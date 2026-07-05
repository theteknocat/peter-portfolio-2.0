<?php

declare(strict_types=1);

namespace App\Handlers;

use App\Services\ContentService;
use App\Services\ManifestService;
use App\Services\PageLayoutService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Exception\HttpNotFoundException;

/**
 * Handles GET /api/page/{page}.
 *
 * Resolves the full page response server-side: loads the page layout, expands
 * every section by fetching the relevant manifests and content items, and
 * returns a single fully-resolved JSON object. The frontend makes one request
 * per page and receives everything it needs to render.
 */
class PageHandler
{
    /**
     * @param PageLayoutService $pageLayoutService
     *   Reads the checked-in layout YAML for the requested page.
     * @param ManifestService $manifestService
     *   Resolves ordered content lists from the content directory.
     * @param ContentService $contentService
     *   Reads individual content items from the content directory.
     */
    public function __construct(
        private readonly PageLayoutService $pageLayoutService,
        private readonly ManifestService $manifestService,
        private readonly ContentService $contentService,
    ) {
    }

    /**
     * Invoke the handler.
     *
     * @param ServerRequestInterface $request
     *   The incoming request.
     * @param ResponseInterface $response
     *   The outgoing response.
     * @param array<string, string> $args
     *   Route arguments. Expects 'page'.
     *
     * @return ResponseInterface
     *   JSON response containing the fully-resolved page data.
     *
     * @throws HttpNotFoundException
     *   When no layout exists for the requested page name.
     */
    public function __invoke(
        ServerRequestInterface $request,
        ResponseInterface $response,
        array $args,
    ): ResponseInterface {
        $page = $args['page'];

        $layout = $this->pageLayoutService->getLayout($page);
        if ($layout === null) {
            throw new HttpNotFoundException($request, "Page '{$page}' not found.");
        }

        $sections = [];
        foreach ($layout['sections'] ?? [] as $section) {
            $resolved = $this->resolveSection((string) $section, $page);
            if ($resolved !== null) {
                $sections[] = $resolved;
            }
        }

        $response->getBody()->write(
            json_encode(['page' => $page, 'sections' => $sections], JSON_THROW_ON_ERROR)
        );

        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Resolve a single layout section into its fully-expanded form.
     *
     * Every section is loaded by its 'source' from 'sections/{page}/{source}'.
     * The loaded content defines everything about the section, including which
     * frontend component renders it ('template') and, for list-driven sections,
     * a 'manifest' key (optionally 'filter'/'limit') that gets expanded into an
     * 'items' array. Sections are optional content — a layout may reference a
     * source that has no content file yet (e.g. an unwritten intro), in which
     * case this returns null and the section is omitted entirely.
     *
     * @param string $source
     *   The section's source slug — each layout section is a bare string.
     * @param string $page
     *   The page name, used to locate section content under 'sections/{page}'.
     *
     * @return array<string, mixed>|null
     *   The resolved section ready for JSON output, or null if the source has
     *   no content file.
     */
    private function resolveSection(string $source, string $page): ?array
    {
        $content = $this->contentService->getItem("sections/{$page}", $source);
        if ($content === null) {
            return null;
        }

        $resolved = [
            'template' => $content['template'] ?? null,
            'content' => $content,
        ];

        if (isset($content['manifest'])) {
            $limit = isset($content['limit']) ? (int) $content['limit'] : null;
            $filter = isset($content['filter']) ? (string) $content['filter'] : null;
            $entries = $this->manifestService->getItems((string) $content['manifest'], $limit, $filter);

            $items = [];
            foreach ($entries as $entry) {
                $item = $this->contentService->getItem((string) $content['manifest'], (string) $entry['slug']);
                if ($item === null) {
                    continue;
                }

                $items[] = $item;
            }
            $resolved['items'] = $items;
        }

        return $resolved;
    }
}
