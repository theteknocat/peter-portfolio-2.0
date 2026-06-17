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
     * for filtering.
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
        $path = "{$this->contentPath}/manifests/{$name}.yaml";

        if (!file_exists($path)) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $items */
        $items = Yaml::parseFile($path) ?? [];

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
}
