<?php

declare(strict_types=1);

namespace App\Services;

use Symfony\Component\Yaml\Yaml;

/**
 * Reads individual content items from the flat-file content directory.
 *
 * Content lives at {contentPath}/{type}/{slug}.yaml. An optional sibling
 * {slug}.md file, when present, is attached as a 'body' string (raw Markdown).
 */
class ContentService
{
    /**
     * @param string $contentPath
     *   Absolute path to the content root directory (from CONTENT_PATH env var).
     */
    public function __construct(private readonly string $contentPath)
    {
    }

    /**
     * Load a content item by type and slug.
     *
     * @param string $type
     *   The content type subdirectory (e.g. 'portfolio', 'articles', 'jobs').
     * @param string $slug
     *   The content item slug (filename without extension).
     *
     * @return array<string, mixed>|null
     *   The parsed content data with 'slug' injected, or null if not found.
     */
    public function getItem(string $type, string $slug): ?array
    {
        $yamlPath = "{$this->contentPath}/{$type}/{$slug}.yaml";

        if (!file_exists($yamlPath)) {
            return null;
        }

        /** @var array<string, mixed> $data */
        $data = Yaml::parseFile($yamlPath) ?? [];
        $data['slug'] = $slug;

        $mdPath = "{$this->contentPath}/{$type}/{$slug}.md";
        if (file_exists($mdPath)) {
            $data['body'] = file_get_contents($mdPath) ?: '';
        }

        return $data;
    }

    /**
     * Load a page-specific content item from the 'pages' subdirectory.
     *
     * @param string $slug
     *   The page content slug (filename without extension).
     *
     * @return array<string, mixed>|null
     *   The parsed content data, or null if not found.
     */
    public function getPageItem(string $slug): ?array
    {
        return $this->getItem('pages', $slug);
    }
}
