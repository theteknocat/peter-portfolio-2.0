<?php

declare(strict_types=1);

use App\Services\ContentService;
use App\Services\ManifestService;
use App\Services\PageLayoutService;

$contentPath = __DIR__ . '/../../content';

return [
    ContentService::class => static function () use ($contentPath): ContentService {
        return new ContentService($contentPath);
    },

    ManifestService::class => static function () use ($contentPath): ManifestService {
        return new ManifestService($contentPath);
    },

    PageLayoutService::class => static function (): PageLayoutService {
        return new PageLayoutService(__DIR__ . '/../layouts');
    },
];
