<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

/**
 * Adds CORS headers to every response and short-circuits OPTIONS preflight requests.
 */
class CorsMiddleware implements MiddlewareInterface
{
    /**
     * Process a server request and return a response.
     *
     * @param ServerRequestInterface $request
     *   The incoming request.
     * @param RequestHandlerInterface $handler
     *   The next middleware handler.
     *
     * @return ResponseInterface
     *   The response with CORS headers attached.
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if ($request->getMethod() === 'OPTIONS') {
            return $this->withCorsHeaders(new Response());
        }

        return $this->withCorsHeaders($handler->handle($request));
    }

    /**
     * Attach CORS headers to a response.
     *
     * @param ResponseInterface $response
     *   The response to modify.
     *
     * @return ResponseInterface
     *   The response with CORS headers attached.
     */
    private function withCorsHeaders(ResponseInterface $response): ResponseInterface
    {
        return $response
            ->withHeader('Access-Control-Allow-Origin', $_ENV['CORS_ORIGIN'] ?? '*')
            ->withHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}
