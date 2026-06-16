<?php

declare(strict_types=1);

namespace App\Services;

use Symfony\Component\Yaml\Yaml;

/**
 * Reads page layout YAML files checked in to the repository.
 *
 * Layouts live at {layoutsPath}/{page}.yaml and define the section structure
 * for each page. Unlike content files, layouts are part of the codebase and
 * require a deploy to change.
 */
class PageLayoutService
{
    /**
     * @param string $layoutsPath
     *   Absolute path to the api/layouts directory.
     */
    public function __construct(private readonly string $layoutsPath)
    {
    }

    /**
     * Load a page layout by page name.
     *
     * @param string $page
     *   The page name (filename without extension, e.g. 'home').
     *
     * @return array<string, mixed>|null
     *   The parsed layout data, or null if no layout file exists for this page.
     */
    public function getLayout(string $page): ?array
    {
        $path = "{$this->layoutsPath}/{$page}.yaml";

        if (!file_exists($path)) {
            return null;
        }

        /** @var array<string, mixed> $layout */
        $layout = Yaml::parseFile($path) ?? [];

        return $layout;
    }
}
