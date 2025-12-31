<?php

namespace PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Classes;

use Illuminate\Support\Facades\Blade;
use Closure;

final class BladeDirective
{
    public static function registerAll()
    {
        $secure = config('prolancee.dynamic.crud.blade.ui.assets.secure', false); // HTTPS toggle

        // CSRF meta tag directive
        static::registerDirective('prolancee_csrf_token', function () {
            return "<?php echo '<meta name=\"prolancee-csrf-token\" content=\"' . csrf_token() . '\">'; ?>";
        });

        // CSS assets with version from config
        $cssAssets = [
            'prolancee_blade_toastr_css' => [
                'config' => 'prolancee.dynamic.crud.blade.ui.messages.toastr.enabled',
                'path'   => function () {
                    return 'prolancee/crud-blade-ui/src/public/plugins/messages/toastr/' .
                        config('prolancee.dynamic.crud.blade.ui.messages.toastr.version', '2.1.4') .
                        '/toastr.min.css';
                },
                'type'   => 'blade_toastr_css'
            ],
        ];

        foreach ($cssAssets as $name => $data) {
            static::registerDirective($name, function () use ($data) {
                if (config($data['config'], false)) {
                    $path = is_callable($data['path']) ? $data['path']() : $data['path'];
                    $url = $secure ? secure_asset($path) : asset($path);
                    return '<link href="' . $url . '" rel="stylesheet" prolancee="' . $data['type'] . '">';
                }
                return '';
            });
        }
    }

    private static function registerDirective(string $name, Closure $handler)
    {
        Blade::directive($name, $handler);
    }
}