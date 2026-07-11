<?php

declare(strict_types=1);

namespace App\Handlers;

use App\Services\ContentService;
use App\Services\ManifestService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Exception\HttpNotFoundException;

/**
 * Handles GET /api/content/{type}/{slug}.
 *
 * Returns a single content item by type and slug. Intended for cases where the
 * frontend needs to fetch an individual item on demand (e.g. an article detail
 * page) rather than receiving it as part of a page response.
 */
class ContentHandler
{
    /**
     * @param ContentService $contentService
     *   Reads individual content items from the content directory.
     * @param ManifestService $manifestService
     *   Checks the published status of manifest entries. The 'type' route
     *   argument doubles as the manifest name (e.g. 'portfolio', 'articles').
     */
    public function __construct(
        private readonly ContentService $contentService,
        private readonly ManifestService $manifestService,
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
     *   Route arguments. Expects 'type' and 'slug'.
     *
     * @return ResponseInterface
     *   JSON response containing the content item data.
     *
     * @throws HttpNotFoundException
     *   When no content file exists for the given type and slug.
     */
    public function __invoke(
        ServerRequestInterface $request,
        ResponseInterface $response,
        array $args,
    ): ResponseInterface {
        $item = $this->contentService->getItem($args['type'], $args['slug']);

        if ($item === null || !$this->manifestService->isPublished($args['type'], $args['slug'])) {
            throw new HttpNotFoundException(
                $request,
                "Content '{$args['type']}/{$args['slug']}' not found."
            );
        }

        $response->getBody()->write(json_encode($item, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
