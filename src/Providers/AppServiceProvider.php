<?php

namespace PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Console\Install;
use PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Classes\ViewComposer;
use PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Classes\BladeDirective;

class AppServiceProvider extends ServiceProvider
{
    protected string $publicFolderPath;

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        BladeDirective::registerAll();
        ViewComposer::registerAll();

        if ($this->app->runningInConsole()) {

            $this->publicFolderPath = public_path();

            $this->publishConfig();
            $this->publishJsAssets();

            $this->commands([
                Install::class,
            ]);

            $this->ensureDirectory(
                $this->publicFolderPath . DIRECTORY_SEPARATOR . 'prolancee/crud-blade-ui'
            );
        }
    }

    /**
     * Publish JS assets.
     */
    private function publishJsAssets(): void
    {
        $items = ['src', 'autoload.js'];
        $publishArray = [];

        foreach ($items as $item) {
            $source = __DIR__ . "/../public/vanillaes6/private/{$item}";
            $destination = $this->publicFolderPath
                . DIRECTORY_SEPARATOR . 'prolancee/crud-blade-ui'
                . DIRECTORY_SEPARATOR . $item;

            if (File::exists($source) && ! File::exists($destination)) {
                $publishArray[$source] = $destination;
            }
        }

        if (! empty($publishArray)) {
            $this->publishes(
                $publishArray,
                'prolancee:dynamic-crud-blade-ui:public'
            );
        }
    }

    /**
     * Publish configuration file.
     */
    private function publishConfig(): void
    {
        $this->publishes([
            __DIR__ . '/../config/config.php'
                => config_path('prolancee/dynamic.crud.blade.ui.php'),
        ], 'prolancee:dynamic-crud-blade-ui:config');
    }

    /**
     * Ensure directory exists.
     */
    private function ensureDirectory(string $path): void
    {
        if (! File::isDirectory($path)) {
            File::makeDirectory($path, 0755, true);
        }
    }
}
