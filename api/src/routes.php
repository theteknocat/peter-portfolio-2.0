<?php

declare(strict_types=1);

use App\Handlers\ContentHandler;
use App\Handlers\ManifestHandler;
use App\Handlers\PageHandler;
use App\Middleware\CorsMiddleware;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface;

/** @var App $app */

$app->add(CorsMiddleware::class);

$app->group('/api', function (RouteCollectorProxyInterface $group): void {
    $group->get('/page/{page}', PageHandler::class);
    $group->get('/manifest/{name}', ManifestHandler::class);
    $group->get('/content/{type}/{slug}', ContentHandler::class);
});
