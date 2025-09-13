import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
    define: {
        global: 'window',
    },
    resolve: {
        alias: {
            '$': 'jquery',
            'jQuery': 'jquery',
            'jquery': 'jquery'
        },
    },
    optimizeDeps: {
        include: [
            'jquery',
            'jointjs',
            'lodash',
            'backbone'
        ]
    },
    build: {
        commonjsOptions: {
            include: [/jointjs/, /node_modules/],
            transformMixedEsModules: true
        }
    }
});
