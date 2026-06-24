<?php

declare(strict_types=1);

use App\Services\ClippyService;
use App\Services\ContentService;
use App\Services\ManifestService;
use App\Services\PageLayoutService;
use Psr\Container\ContainerInterface;

$contentPath = __DIR__ . '/../../content';

return [
    ContentService::class => static function () use ($contentPath): ContentService {
        return new ContentService($contentPath);
    },

    ClippyService::class => static function (ContainerInterface $c): ClippyService {
        return new ClippyService(
            cacheDir: __DIR__ . '/../var/cache/clippy',
            apiKey: $_ENV['ANTHROPIC_API_KEY'] ?? '',
            model: $_ENV['CLIPPY_MODEL'] ?? 'claude-haiku-4-5',
            ttlSeconds: (int) ($_ENV['CLIPPY_CACHE_TTL'] ?? 604800),
            contentService: $c->get(ContentService::class),
        );
    },

    ManifestService::class => static function () use ($contentPath): ManifestService {
        return new ManifestService($contentPath);
    },

    PageLayoutService::class => static function (): PageLayoutService {
        return new PageLayoutService(__DIR__ . '/../layouts');
    },
];
