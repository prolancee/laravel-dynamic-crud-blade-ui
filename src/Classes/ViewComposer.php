<?php

namespace PROLANCEE\DYNAMIC\CRUD\Blade\Ui\Classes;

use Illuminate\Support\Facades\View;

final class ViewComposer
{
    public static function registerAll()
    {
        $secure = config('prolancee.dynamic.crud.blade.ui.assets.secure', false); // HTTPS toggle

        $scripts = [
            'prolancee_crud_blade_autoload_script' => [
                'config' => true,
                'path'   => 'prolancee/crud-blade-ui/autoload.js',
                'type'   => 'blade_autoload_script'
            ],
            'prolancee_crud_blade_ckeditor4_script' => [
                'config' => 'prolancee.dynamic.crud.blade.ui.editors.ckeditor4.enabled',
                'path'   => function () {
                    return 'prolancee/crud-blade-ui/src/public/plugins/editors/ckeditor/ckeditor4/standard/' .
                        config('prolancee.dynamic.crud.blade.ui.editors.ckeditor4.version', '4.22.1') .
                        '/ckeditor.min.js';
                },
                'type'   => 'blade_ckeditor4_standard_script'
            ],
            'prolancee_crud_blade_ckeditor5_script' => [
                'config' => 'prolancee.dynamic.crud.blade.ui.editors.ckeditor5.enabled',
                'path'   => function () {
                    return 'prolancee/crud-blade-ui/src/public/plugins/editors/ckeditor/ckeditor5/classic/' .
                        config('prolancee.dynamic.crud.blade.ui.editors.ckeditor5.version', '41.0.0') .
                        '/ckeditor.min.js';
                },
                'type'   => 'blade_ckeditor5_classic_script'
            ],
            'prolancee_crud_blade_sweetalert2_script' => [
                'config' => 'prolancee.dynamic.crud.blade.ui.messages.sweetalert2.enabled',
                'path'   => function () {
                    return 'prolancee/crud-blade-ui/src/public/plugins/messages/sweetalert2/' .
                        config('prolancee.dynamic.crud.blade.ui.messages.sweetalert2.version', '11.26.3') .
                        '/sweetalert2.min.js';
                },
                'type'   => 'blade_sweetalert2_script'
            ],
            'prolancee_crud_blade_toastr_script' => [
                'config' => 'prolancee.dynamic.crud.blade.ui.messages.toastr.enabled',
                'path'   => function () {
                    return 'prolancee/crud-blade-ui/src/public/plugins/messages/toastr/' .
                        config('prolancee.dynamic.crud.blade.ui.messages.toastr.version', '2.1.4') .
                        '/toastr.min.js';
                },
                'type'   => 'blade_toastr_script'
            ],
        ];

        View::composer('*', function ($view) use ($scripts, $secure) {
            foreach ($scripts as $var => $data) {
                $enabled = $data['config'] === true ? true : config($data['config'], false);

                if ($enabled) {
                    $path = is_callable($data['path']) ? $data['path']() : $data['path'];
                    $url = $secure ? secure_asset($path) : asset($path);

                    $view->with($var, '<script src="' . $url . '" defer prolancee="' . $data['type'] . '"></script>');
                } else {
                    $view->with($var, '');
                }
            }
        });
    }
}
