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
            $sections[] = $this->resolveSection($section);
        }

        $response->getBody()->write(
            json_encode(['page' => $page, 'sections' => $sections], JSON_THROW_ON_ERROR)
        );

        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Resolve a single layout section into its fully-expanded form.
     *
     * Sections with a 'manifest' key are expanded to an 'items' array by
     * fetching each referenced content item. Sections with a 'source' key
     * are expanded to a single 'content' object.
     *
     * @param array<string, mixed> $section
     *   A raw section definition from the page layout YAML.
     *
     * @return array<string, mixed>
     *   The resolved section ready for JSON output.
     */
    private function resolveSection(array $section): array
    {
        $resolved = ['type' => $section['type']];

        if (isset($section['source'])) {
            $resolved['content'] = $this->contentService->getPageItem((string) $section['source']);
        }

        if (isset($section['manifest'])) {
            $limit = isset($section['limit']) ? (int) $section['limit'] : null;
            $filter = isset($section['filter']) ? (string) $section['filter'] : null;
            $entries = $this->manifestService->getItems($section['manifest'], $limit, $filter);

            $items = [];
            foreach ($entries as $entry) {
                $item = $this->contentService->getItem((string) $section['manifest'], (string) $entry['slug']);
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
