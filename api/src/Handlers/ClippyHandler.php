<?php

declare(strict_types=1);

namespace App\Handlers;

use App\Services\ClippyService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Handles GET /api/clippy/quips/{scope}.
 *
 * Returns the cached quip pool for a scope as {"quips": [...]}. An invalid
 * scope or a generation failure yields an empty array rather than an error:
 * the frontend treats an empty pool as "use my built-in lines", so Clippy
 * degrades gracefully instead of breaking.
 */
class ClippyHandler
{
    /**
     * @param ClippyService $clippyService
     *   Generates and caches per-scope quip pools.
     */
    public function __construct(private readonly ClippyService $clippyService)
    {
    }

    /**
     * Invoke the handler.
     *
     * @param ServerRequestInterface $request
     *   The incoming request.
     * @param ResponseInterface $response
     *   The outgoing response.
     * @param array<string, string> $args
     *   Route arguments. Expects 'scope' (may contain a '/').
     *
     * @return ResponseInterface
     *   JSON response containing the quip pool.
     */
    public function __invoke(
        ServerRequestInterface $request,
        ResponseInterface $response,
        array $args,
    ): ResponseInterface {
        $quips = $this->clippyService->getPool($args['scope']);

        $response->getBody()->write(json_encode(['quips' => $quips], JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
