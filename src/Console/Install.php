<?php

namespace PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class Install extends Command
{
    protected $signature   = 'prolancee:dynamic-crud-blade-ui:install {--force}';
    protected $description = 'Install the PROLANCEE DYNAMIC CRUD Blade Ui package';

    public function handle(): void
    {
        // COLORS
        $yellow = "\e[33m";
        $blue   = "\e[34m";
        $green  = "\e[32m";
        $cyan   = "\e[36m";
        $reset  = "\e[0m";

        $this->info("Installing PROLANCEE DYNAMIC CRUD Blade Ui...\n");

        // HEADER
        $this->info("{$cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$reset}");
        $this->info("           {$yellow}PROLANCEE — INSTALLATION{$reset}");
        $this->info("{$cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$reset}\n");

        // -------------------------------------------------------------
        // STEP 1: Publish Config
        // -------------------------------------------------------------
        $this->info('Checking configuration file...');

        $configPath1 = config_path('prolancee/dynamic.crud.blade.ui.php');
        $configPath2 = config_path('prolancee/dynamic.crud.ajax.php');
        $configPath3 = config_path('prolancee/support.php');

        $missingConfig1 = ! File::exists($configPath1);
        $missingConfig2 = ! File::exists($configPath2);
        $missingConfig3 = ! File::exists($configPath3);

        if ($this->option('force')) {

            $this->warn("Force mode enabled — overwriting existing config files...");

            $status1 = $this->callSilent('vendor:publish', [
                '--tag'   => 'prolancee:dynamic-crud-balde-ui:config',
                '--force' => true,
            ]);

            $status2 = $this->callSilent('vendor:publish', [
                '--tag'   => 'prolancee:dynamic-crud-ajax:config',
                '--force' => true,
            ]);

            $status3 = $this->callSilent('vendor:publish', [
                '--tag'   => 'prolancee:support:config',
                '--force' => true,
            ]);

            if ($status1 === 0 && $status2 === 0 && $status3 === 0) {
                $this->info("{$green}✓{$reset} Config files overwritten.\n");
            } else {
                $this->error("✗ Failed to overwrite config files.\n");
            }

        } elseif ($missingConfig1 || $missingConfig2 || $missingConfig3) {

            $this->info("Publishing missing configuration files...");

            $status1 = $this->callSilent('vendor:publish', [
                '--tag'   => 'prolancee:dynamic-crud-balde-ui:config',
                '--force' => false,
            ]);

            $status2 = $this->callSilent('vendor:publish', [
                '--tag'   => 'prolancee:dynamic-crud-ajax:config',
                '--force' => false,
            ]);

            $status3 = $this->callSilent('vendor:publish', [
                '--tag'   => 'prolancee:support:config',
                '--force' => false,
            ]);

            if ($status1 === 0 && $status2 === 0 && $status3 === 0) {
                $this->info("{$green}✓{$reset} Missing config files installed.\n");
            } else {
                $this->error("✗ Failed to install missing config files.\n");
            }

        } else {
            $this->warn("⚠ All config files already exist — skipping publish.\n");
        }

        // -------------------------------------------------------------
        // STEP 2: Publish Application Files (via Support Commands)
        // -------------------------------------------------------------
        $this->info("Checking application files...");

        $renderFiles = [
            app_path('Http/Prolancee/Render.php'),
            app_path('Http/Prolancee/Classes/Renderable.php'),
        ];

        $modelsFiles = [
            app_path('Models/Prolancee/Modeler.php'),
            app_path('Models/Prolancee/Classes/User.php'),
        ];

        $missingRender = array_filter($renderFiles, fn($file) => ! File::exists($file));
        $missingModels = array_filter($modelsFiles, fn($file) => ! File::exists($file));

        $helperFilePath = $this->detectHelperFolder('Prolancee.php');
        $missingHelper  = ! File::exists($helperFilePath);

        $notifierFile    = app_path('Notifier/Prolancee.php');
        $missingNotifier = ! File::exists($notifierFile);

        if ($this->option('force')) {

            $this->warn("Force mode enabled — overwriting application files...");

            $this->callSilent('prolancee:support:render', [
                '--force' => true,
            ]);

            $this->callSilent('prolancee:support:models', [
                '--force' => true,
            ]);

            $this->callSilent('prolancee:support:helper', [
                '--force' => true,
            ]);

            $this->callSilent('prolancee:support:notifier', [
                '--force' => true,
            ]);

            $this->info("{$green}✓{$reset} Application files overwritten.\n");

        } else {

            if (! empty($missingRender)) {
                $this->info("Installing missing render files...");
                $this->callSilent('prolancee:support:render');
                $this->info("{$green}✓{$reset} Render installed.");
            }

            if (! empty($missingModels)) {
                $this->info("Installing missing model files...");
                $this->callSilent('prolancee:support:models');
                $this->info("{$green}✓{$reset} Models installed.");
            }

            if (! empty($missingHelper)) {
                $this->info("Installing missing helper files...");
                $this->callSilent('prolancee:support:helper');
                $this->info("{$green}✓{$reset} Helper installed and loaded.");
            }

            if ($missingNotifier) {
                $this->info("Installing missing notifier...");
                $this->callSilent('prolancee:support:notifier');
                $this->info("{$green}✓{$reset} Notifier installed.");
            }

            if (
                empty($missingRender)
                && empty($missingModels)
                && ! $missingHelper
                && ! $missingNotifier
            ) {
                $this->warn("⚠ All application files already exist — skipping publish.\n");
            } else {
                $this->info("\n{$green}✓{$reset} Missing application files installed successfully.\n");
            }
        }

        // -------------------------------------------------------------
        // STEP 3: Publish Assets (Optional)
        // -------------------------------------------------------------
        $this->info("Publishing frontend assets...");

        $status = $this->callSilent('vendor:publish', [
            '--tag'   => 'prolancee:dynamic-crud-balde-ui:public',
            '--force' => true,
        ]);

        $status === 0
            ? $this->info("{$green}✓{$reset} JavaScript assets published.\n")
            : $this->error("✗ Failed to publish JavaScript assets.\n");

        // -------------------------------------------------------------
        // STEP 4: Database & Redis Encryption
        // -------------------------------------------------------------
        $this->info('Checking Database & Redis encryption files...');

        $dbEncryptFiles = [
            storage_path('app/private/prolancee/rdbms.json'),
            storage_path('app/private/prolancee/redis.json'),
        ];

        $missingDBEncrypt = array_filter(
            $dbEncryptFiles,
            fn($file) => ! File::exists($file)
        );

        if ($this->option('force')) {

            $this->warn('Force mode enabled — regenerating Database & Redis encryption files...');

            $this->callSilent('prolancee:db:encryption', [
                '--force' => true,
            ]);

            $this->info("✓ Database & Redis encryption files regenerated.\n");

        } else {

            if (! empty($missingDBEncrypt)) {

                $this->info('Missing encryption files detected. Generating...');
                $this->callSilent('prolancee:db:encryption');
                $this->info("✓ Encryption files generated.\n");

            } else {
                $this->warn("⚠ Encryption files already exist — skipping.\n");
            }
        }

        // -------------------------------------------------------------
        // STEP 5: Clear & Rebuild Cache
        // -------------------------------------------------------------
        $this->info("Clearing caches...");
        $this->callSilent('optimize:clear');
        $this->info("✓ All caches cleared.");

        $this->info("Rebuilding cache...");

        $this->callSilent('config:cache');
        $this->callSilent('view:cache');

        try {
            $this->callSilent('route:cache');
            $this->info("✓ Route cache built.");
        } catch (Throwable $e) {
            $this->warn("⚠ Route cache skipped (closures detected).");
        }

        $this->info("✓ Cache rebuilt successfully.\n");

        // -------------------------------------------------------------
        // SUCCESS MESSAGE
        // -------------------------------------------------------------
        $this->info("{$cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$reset}");
        $this->info(" {$green}PROLANCEE DYNAMIC CRUD Blade Ui Installed Successfully!{$reset}");
        $this->info("{$cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{$reset}\n");

        // COMMUNITY MESSAGE
        $this->info("This package is part of the {$yellow}PROLANCEE Ecosystem{$reset}.");
        $this->info("Prolancee.com is a modern freelancing marketplace.\n");

        $this->info("{$yellow}Join our community or create your free account:{$reset}");
        $this->info("➡  {$blue}https://panel.prolancee.com/signup{$reset}\n");

        $this->info("Documentation:");
        $this->info("➡  {$blue}https://flux.prolancee.com/docs/laravel/dynamic-crud-blade-ui/1.0.0{$reset}\n");
    }

    /**
     * Detect correct helper file path.
     */
    private function detectHelperFolder(string $file): string
    {
        $possibleNames = ['Helpers', 'Helper', 'helpers', 'helper'];

        foreach ($possibleNames as $folder) {
            $path = app_path($folder);

            if (File::isDirectory($path)) {
                return $path . DIRECTORY_SEPARATOR . $file;
            }
        }

        // Default fallback
        $path = app_path('Helpers');
        File::ensureDirectoryExists($path);

        return $path . DIRECTORY_SEPARATOR . $file;
    }
}
