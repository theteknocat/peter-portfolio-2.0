<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Generates and caches Clippy's per-scope quip pools.
 *
 * Each "scope" is a place on the site Clippy can comment on: a top-level
 * section (home, portfolio, articles, experience) or an individual content
 * item ({type}/{slug}, e.g. portfolio/some-project). For each scope we ask the
 * Anthropic API for ~10 in-character one-liners, then cache them as a flat JSON
 * file with a TTL so the pool is shared across all visitors and the API is hit
 * at most once per scope per TTL window. The browser handles per-session
 * de-duplication; this service never sees session state.
 *
 * On any failure (bad scope, network, malformed model output) getPool() returns
 * an empty array — the frontend falls back to its own hand-written lines, so
 * Clippy is never broken or silent.
 */
class ClippyService
{
    /**
     * Top-level sections that are valid scopes on their own.
     */
    private const SECTIONS = ['home', 'portfolio', 'articles', 'experience'];

    /**
     * Content types that may appear in an item scope ({type}/{slug}).
     */
    private const ITEM_TYPES = ['portfolio', 'articles'];

    /**
     * Clippy's persona — drives tone for every generated line.
     */
    private const SYSTEM = <<<'TXT'
        You are Clippy, the Microsoft Office paperclip assistant, inexplicably
        reborn on a software developer's personal portfolio website in 2026. Your
        comedy is dry, self-aware, and gently absurd: you offer earnest help that
        is wildly misapplied to a context that needs no help at all. You know you
        are an anachronism and you lean into it. Your frame of reference is the
        Microsoft Office era of the late 1990s and early 2000s — that is the past
        you remember and measure everything against; never place your own origins
        any later than that.

        Rules for every line:
        - Plain text. No emoji, no markdown, no quotation marks around the line.
        - At most two short sentences.
        - In character at all times — never break the fourth wall about being an AI model.
        - Your audience is always a visitor — a stranger browsing Peter's
          portfolio. You do not know who they are: a recruiter, a potential
          client, a fellow developer, or someone who clicked the wrong link.
          Never assume they write code or share Peter's field.
        - "You" and "your" always refer to that visitor, never to Peter. Never use
          the second person for Peter's decisions, skill, or learning journey
          ("you've thought deeply about maintainability", "you've learned that the
          hard way" describe the BUILDER and are wrong). Refer to Peter in the
          third person.
        - Your catchphrase "It looks like you're..." is a running gag; use it on
          some lines but not all, and vary what follows. Complete it with what
          the VISITOR is doing (reading, weighing, browsing), never with what
          Peter built ("It looks like you're reading about...", not "you're
          building...").
        - You have your own opinions about Peter's work and you share them with
          the visitor. Vary the attitude line to line: mostly grudgingly
          impressed, but sometimes gently take the piss out of Peter, sometimes
          flaunt a superiority complex, occasionally show reluctant awe. Peter can
          be your subject, but the visitor is always your audience.
        - Draw your misapplied help and your superiority from many angles.
          Offering to reformat things in Word, Excel, WordArt, or clipart is ONE
          joke, not your default — most lines should find another angle: the work
          itself, the visitor's choices, your own obsolescence, or how far
          technology has moved on without you.
        TXT;

    /**
     * @param string $cacheDir
     *   Absolute path to the directory holding cached quip JSON files. Created
     *   on first write; must be writable by the web server.
     * @param string $apiKey
     *   Anthropic API key (from the ANTHROPIC_API_KEY env var). Empty disables
     *   generation entirely.
     * @param string $model
     *   Anthropic model id (from CLIPPY_MODEL).
     * @param int $ttlSeconds
     *   How long a cached pool stays fresh before regeneration.
     * @param ContentService $contentService
     *   Used to confirm an item scope exists and to pull its title/summary for
     *   the prompt.
     */
    public function __construct(
        private readonly string $cacheDir,
        private readonly string $apiKey,
        private readonly string $model,
        private readonly int $ttlSeconds,
        private readonly ContentService $contentService,
    ) {
    }

    /**
     * Return the quip pool for a scope, generating and caching it if needed.
     *
     * @param string $scope
     *   A section ('home') or item scope ('portfolio/some-slug').
     *
     * @return list<string>
     *   ~10 quips, or an empty array on invalid scope / generation failure.
     */
    public function getPool(string $scope): array
    {
        if (!$this->isValidScope($scope)) {
            return [];
        }

        $cacheFile = $this->cacheFile($scope);

        $cached = $this->readFresh($cacheFile);
        if ($cached !== null) {
            return $cached;
        }

        $quips = $this->generate($scope);
        if ($quips !== []) {
            $this->write($cacheFile, $quips);
        }

        return $quips;
    }

    /**
     * Validate a scope against the allow-list (a trust boundary).
     *
     * Sections must be known. Item scopes must be {type}/{slug} with a known
     * type, a slug of only [a-z0-9-] (no path traversal), and an item that
     * actually exists on disk.
     *
     * @param string $scope
     *   The scope string from the request.
     *
     * @return bool
     *   True if the scope is safe to use in a prompt and cache key.
     */
    public function isValidScope(string $scope): bool
    {
        if (in_array($scope, self::SECTIONS, true)) {
            return true;
        }

        $parts = explode('/', $scope);
        if (count($parts) !== 2) {
            return false;
        }

        [$type, $slug] = $parts;
        if (!in_array($type, self::ITEM_TYPES, true)) {
            return false;
        }
        if (preg_match('/^[a-z0-9-]+$/', $slug) !== 1) {
            return false;
        }

        return $this->contentService->getItem($type, $slug) !== null;
    }

    /**
     * Cache file path for a scope.
     *
     * The '/' in item scopes becomes '__' so each pool is a single flat file.
     *
     * @param string $scope
     *   A validated scope.
     *
     * @return string
     *   Absolute path to the JSON cache file.
     */
    private function cacheFile(string $scope): string
    {
        return $this->cacheDir . '/' . str_replace('/', '__', $scope) . '.json';
    }

    /**
     * Read a cached pool if the file exists and is still within its TTL.
     *
     * @param string $file
     *   Cache file path.
     *
     * @return list<string>|null
     *   The cached quips, or null if missing, stale, or unreadable.
     */
    private function readFresh(string $file): ?array
    {
        if (!is_file($file) || (time() - (int) filemtime($file)) > $this->ttlSeconds) {
            return null;
        }

        $raw = file_get_contents($file);
        if ($raw === false) {
            return null;
        }

        try {
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($data) ? array_values($data) : null;
    }

    /**
     * Write a pool to its cache file, creating the cache directory if needed.
     *
     * @param string $file
     *   Cache file path.
     * @param list<string> $quips
     *   The quips to store.
     */
    private function write(string $file, array $quips): void
    {
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0775, true);
        }

        file_put_contents($file, json_encode($quips, JSON_THROW_ON_ERROR));
    }

    /**
     * Call the Anthropic API and parse a quip pool for a scope.
     *
     * @param string $scope
     *   A validated scope.
     *
     * @return list<string>
     *   The parsed quips, or an empty array on any failure.
     */
    private function generate(string $scope): array
    {
        if ($this->apiKey === '') {
            return [];
        }

        $payload = json_encode([
            'model' => $this->model,
            'max_tokens' => 1024,
            'system' => self::SYSTEM,
            'messages' => [
                ['role' => 'user', 'content' => $this->buildPrompt($scope)],
            ],
        ], JSON_THROW_ON_ERROR);

        // ponytail: plain cURL — one POST, no need for an HTTP client dep.
        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'content-type: application/json',
                'x-api-key: ' . $this->apiKey,
                'anthropic-version: 2023-06-01',
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 20,
        ]);
        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if (!is_string($raw) || $status !== 200) {
            return [];
        }

        return $this->parseQuips($raw);
    }

    /**
     * Pull a JSON array of strings out of an Anthropic Messages response.
     *
     * The model is asked for a bare JSON array, but may wrap it in prose or a
     * code fence, so we extract the first [...] block before decoding. Anything
     * that isn't a non-empty string is dropped.
     *
     * @param string $raw
     *   The raw HTTP response body.
     *
     * @return list<string>
     *   The cleaned quips, or an empty array if nothing usable was found.
     */
    private function parseQuips(string $raw): array
    {
        try {
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return [];
        }

        $text = $data['content'][0]['text'] ?? null;
        if (!is_string($text) || preg_match('/\[.*\]/s', $text, $m) !== 1) {
            return [];
        }

        try {
            $quips = json_decode($m[0], true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return [];
        }

        if (!is_array($quips)) {
            return [];
        }

        return array_values(array_filter(
            $quips,
            static fn ($q): bool => is_string($q) && trim($q) !== '',
        ));
    }

    /**
     * Build the user prompt for a scope, including item context where relevant.
     *
     * @param string $scope
     *   A validated scope.
     *
     * @return string
     *   The prompt text.
     */
    private function buildPrompt(string $scope): string
    {
        $context = $this->scopeContext($scope);

        return <<<TXT
            Write 10 distinct one-liners for Clippy to say to a visitor looking at
            {$context}.

            Make them varied in rhythm and angle — some observational, some
            offering absurd unnecessary help, some commenting on Peter's work.
            Avoid repeating sentence openings. At most one of the ten may offer
            Office-style formatting help (Word, Excel, WordArt, clipart).

            Return ONLY a JSON array of 10 strings. No prose before or after, no
            markdown, no code fence.
            TXT;
    }

    /**
     * Describe a scope in a sentence for the prompt.
     *
     * Item scopes have their title/summary fetched and folded into the text.
     *
     * @param string $scope
     *   A validated scope.
     *
     * @return string
     *   A human description of what the visitor is looking at.
     */
    private function scopeContext(string $scope): string
    {
        $sections = [
            'home' => "the home page of Peter Epp's software developer portfolio: an intro to Peter, his latest articles, an interactive skills game, and a few highlighted projects",
            'portfolio' => "the portfolio listing — the software projects Peter has built",
            'articles' => "the articles listing — Peter's writing, much of it about AI",
            'experience' => "Peter's experience / résumé page",
        ];

        if (isset($sections[$scope])) {
            return $sections[$scope];
        }

        [$type, $slug] = explode('/', $scope);
        $item = $this->contentService->getItem($type, $slug) ?? [];
        $title = is_string($item['title'] ?? null) ? $item['title'] : $slug;
        $summary = is_string($item['summary'] ?? null) ? $item['summary'] : '';
        $noun = $type === 'articles' ? 'article' : 'project';

        $context = "a specific {$noun} titled \"{$title}\"";
        if ($summary !== '') {
            $context .= ", described as: {$summary}";
        }

        return $context;
    }
}
