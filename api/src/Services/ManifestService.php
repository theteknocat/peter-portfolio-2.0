<?php

declare(strict_types=1);

namespace App\Services;

use Symfony\Component\Yaml\Yaml;

/**
 * Reads ordered manifest files from the content directory.
 *
 * Manifests live at {contentPath}/manifests/{name}.yaml and contain an
 * ordered list of content references. This service is internal — it is called
 * by PageHandler, not exposed as an API endpoint.
 */
class ManifestService
{
    /**
     * @param string $contentPath
     *   Absolute path to the content root directory (from CONTENT_PATH env var).
     */
    public function __construct(private readonly string $contentPath)
    {
    }

    /**
     * Load manifest items, with optional filtering and limiting.
     *
     * Each item in the manifest is an associative array that must at minimum
     * contain a 'slug' key. Additional keys (e.g. 'featured') may be used
     * for filtering. Items are always filtered to those with 'published'
     * truthy first, regardless of the $filter argument.
     *
     * @param string $name
     *   The manifest name (filename without extension, e.g. 'portfolio').
     * @param int|null $limit
     *   Maximum number of items to return. Null returns all.
     * @param string|null $filter
     *   When set, only items where this key is truthy are returned.
     *
     * @return array<int, array<string, mixed>>
     *   The filtered and limited list of manifest entries.
     */
    public function getItems(string $name, ?int $limit = null, ?string $filter = null): array
    {
        $items = array_values(
            array_filter($this->loadManifest($name), fn(array $item): bool => !empty($item['published']))
        );

        if ($filter !== null) {
            $items = array_values(
                array_filter($items, fn(array $item): bool => !empty($item[$filter]))
            );
        }

        if ($limit !== null) {
            $items = array_slice($items, 0, $limit);
        }

        return $items;
    }

    /**
     * Check whether a single manifest entry is published.
     *
     * @param string $name
     *   The manifest name (filename without extension, e.g. 'portfolio').
     * @param string $slug
     *   The slug to look up within the manifest.
     *
     * @return bool
     *   True if the entry exists and its 'published' key is truthy.
     */
    public function isPublished(string $name, string $slug): bool
    {
        foreach ($this->loadManifest($name) as $item) {
            if (($item['slug'] ?? null) === $slug) {
                return !empty($item['published']);
            }
        }

        return false;
    }

    /**
     * Load and parse a manifest file.
     *
     * @param string $name
     *   The manifest name (filename without extension, e.g. 'portfolio').
     *
     * @return array<int, array<string, mixed>>
     *   The raw, unfiltered manifest entries, or an empty array if the
     *   manifest file does not exist.
     */
    private function loadManifest(string $name): array
    {
        $path = "{$this->contentPath}/manifests/{$name}.yaml";

        if (!file_exists($path)) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $items */
        $items = Yaml::parseFile($path) ?? [];

        return $items;
    }
}
