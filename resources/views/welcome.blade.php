<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Diagramador UML Colaborativo</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Styles / Scripts -->
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            <style>
                /* ! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com */
                *,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}::after,::before{--tw-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:Figtree, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace, SFMono-Regular, "Roboto Mono", "Consolas", "Courier New", monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,role:where([role=button]){cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}*, ::before, ::after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / 0.5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / 0.5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }.absolute{position:absolute}.relative{position:relative}.-left-20{left:-5rem}.-top-1{top:-0.25rem}.top-0{top:0px}.col-start-2{grid-column-start:2}.m-auto{margin:auto}.mx-auto{margin-left:auto;margin-right:auto}.ms-2{margin-inline-start:0.5rem}.mt-4{margin-top:1rem}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.\!hidden{display:none!important}.hidden{display:none}.aspect-video{aspect-ratio:16 / 9}.size-12{width:3rem;height:3rem}.size-5{width:1.25rem;height:1.25rem}.size-6{width:1.5rem;height:1.5rem}.h-12{height:3rem}.h-40{height:10rem}.h-5{height:1.25rem}.h-full{height:100%}.min-h-screen{min-height:100vh}.w-5{width:1.25rem}.w-\[calc\(100\%_\+_8rem\)\]{width:calc(100% + 8rem)}.w-auto{width:auto}.w-full{width:100%}.max-w-2xl{max-width:42rem}.max-w-\[877px\]{max-width:877px}.flex-1{flex:1 1 0%}.shrink-0{flex-shrink:0}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.\!flex-row{flex-direction:row!important}.flex-col{flex-direction:column}.items-start{align-items:flex-start}.items-center{align-items:center}.items-stretch{align-items:stretch}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.justify-items-center{justify-items:center}.gap-2{gap:0.5rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.self-center{align-self:center}.overflow-hidden{overflow:hidden}.rounded-\[10px\]{border-radius:10px}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:0.5rem}.rounded-md{border-radius:0.375rem}.rounded-sm{border-radius:0.125rem}.border{border-width:1px}.border-gray-300{--tw-border-opacity: 1;border-color:rgb(209 213 219 / var(--tw-border-opacity))}.bg-\[\#FF2D20\]\/10{background-color:rgb(255 45 32 / 0.1)}.bg-gray-50{--tw-bg-opacity: 1;background-color:rgb(249 250 251 / var(--tw-bg-opacity))}.bg-white{--tw-bg-opacity: 1;background-color:rgb(255 255 255 / var(--tw-bg-opacity))}.bg-zinc-900{--tw-bg-opacity: 1;background-color:rgb(24 24 27 / var(--tw-bg-opacity))}.bg-gradient-to-b{background-image:linear-gradient(to bottom, var(--tw-gradient-stops))}.from-transparent{--tw-gradient-from: transparent var(--tw-gradient-from-position);--tw-gradient-to: rgb(0 0 0 / 0)  var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)}.via-white{--tw-gradient-to: rgb(255 255 255 / 0)  var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), rgb(255 255 255 / 1) var(--tw-gradient-via-position), var(--tw-gradient-to)}.via-zinc-900{--tw-gradient-to: rgb(24 24 27 / 0)  var(--tw-gradient-to-position);--tw-gradient-stops: var(--tw-gradient-from), rgb(24 24 27 / 1) var(--tw-gradient-via-position), var(--tw-gradient-to)}.to-white{--tw-gradient-to: rgb(255 255 255 / 1) var(--tw-gradient-to-position)}.to-zinc-900{--tw-gradient-to: rgb(24 24 27 / 1) var(--tw-gradient-to-position)}.stroke-\[\#FF2D20\]{stroke:#FF2D20}.object-cover{object-fit:cover}.object-top{object-position:top}.p-6{padding:1.5rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-10{padding-top:2.5rem;padding-bottom:2.5rem}.py-16{padding-top:4rem;padding-bottom:4rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}.pb-3{padding-bottom:0.75rem}.px-3{padding-left:0.75rem;padding-right:0.75rem}.pt-3{padding-top:0.75rem}.text-center{text-align:center}.text-sm{font-size:0.875rem;line-height:1.25rem}.text-sm\/relaxed{font-size:0.875rem;line-height:1.625}.text-xl{font-size:1.25rem;line-height:1.75rem}.font-semibold{font-weight:600}.text-black{--tw-text-opacity: 1;color:rgb(0 0 0 / var(--tw-text-opacity))}.text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity))}.underline{text-decoration-line:underline}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.shadow-\[0px_14px_34px_0px_rgba\(0\,0\,0\,0\.08\)\]{box-shadow:0px 14px 34px 0px rgba(0,0,0,0.08)}.ring-1{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)}.ring-white\/\[0\.05\]{--tw-ring-color: rgb(255 255 255 / 0.05)}.ring-zinc-800{--tw-ring-opacity: 1;--tw-ring-color: rgb(39 39 42 / var(--tw-ring-opacity))}.drop-shadow-\[0px_4px_34px_rgba\(0\,0\,0\,0\.25\)\]{--tw-drop-shadow: drop-shadow(0px 4px 34px rgba(0,0,0,0.25));filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.duration-300{transition-duration:300ms}.selection\:bg-\[\#FF2D20\] *::selection{--tw-bg-opacity: 1;background-color:rgb(255 45 32 / var(--tw-bg-opacity))}.selection\:text-white *::selection{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity))}.selection\:bg-\[\#FF2D20\]::selection{--tw-bg-opacity: 1;background-color:rgb(255 45 32 / var(--tw-bg-opacity))}.selection\:text-white::selection{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity))}.hover\:text-black\/70:hover{color:rgb(0 0 0 / 0.7)}.hover\:text-white\/80:hover{color:rgb(255 255 255 / 0.8)}.hover\:ring-black\/20:hover{--tw-ring-color: rgb(0 0 0 / 0.2)}.hover\:ring-zinc-700:hover{--tw-ring-opacity: 1;--tw-ring-color: rgb(63 63 70 / var(--tw-ring-opacity))}.focus\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus-visible\:ring-1:focus-visible{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)}.focus-visible\:ring-\[\#FF2D20\]:focus-visible{--tw-ring-opacity: 1;--tw-ring-color: rgb(255 45 32 / var(--tw-ring-opacity))}@media (min-width: 640px){.sm\:size-16{width:4rem;height:4rem}.sm\:size-6{width:1.5rem;height:1.5rem}.sm\:pt-5{padding-top:1.25rem}}@media (min-width: 1024px){.lg\:col-start-2{grid-column-start:2}.lg\:h-16{height:4rem}.lg\:max-w-7xl{max-width:80rem}.lg\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.lg\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.lg\:flex-col{flex-direction:column}.lg\:items-end{align-items:flex-end}.lg\:justify-center{justify-content:center}.lg\:gap-8{gap:2rem}.lg\:p-10{padding:2.5rem}.lg\:pb-10{padding-bottom:2.5rem}.lg\:pt-0{padding-top:0}.lg\:text-\[\#FF2D20\]{--tw-text-opacity: 1;color:rgb(255 45 32 / var(--tw-text-opacity))}}@media (prefers-color-scheme: dark){.dark\:block{display:block}.dark\:hidden{display:none}.dark\:bg-zinc-900{--tw-bg-opacity: 1;background-color:rgb(24 24 27 / var(--tw-bg-opacity))}.dark\:text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity))}.dark\:text-white\/50{color:rgb(255 255 255 / 0.5)}.dark\:text-white\/70{color:rgb(255 255 255 / 0.7)}.dark\:ring-zinc-800{--tw-ring-opacity: 1;--tw-ring-color: rgb(39 39 42 / var(--tw-ring-opacity))}.dark\:hover\:text-white\/70:hover{color:rgb(255 255 255 / 0.7)}.dark\:hover\:text-white\/80:hover{color:rgb(255 255 255 / 0.8)}.dark\:hover\:ring-zinc-700:hover{--tw-ring-opacity: 1;--tw-ring-color: rgb(63 63 70 / var(--tw-ring-opacity))}.dark\:focus-visible\:ring-\[\#FF2D20\]:focus-visible{--tw-ring-opacity: 1;--tw-ring-color: rgb(255 45 32 / var(--tw-ring-opacity))}}
            </style>
        @endif
    </head>
    <body class="font-sans antialiased dark:bg-zinc-900 dark:text-white/50">
        <div class="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50">
            <img id="background" class="absolute -left-20 top-0 max-w-[877px]" src="https://laravel.com/assets/img/welcome/background.svg" alt="UML background" />
            <div class="relative min-h-screen flex flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
                <div class="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                    <header class="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3">
                        <div class="flex lg:justify-center lg:col-start-2">
                            <!-- Logo UML Colaborativo personalizado -->
                            <svg class="h-12 w-auto lg:h-16" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
                              <!-- Gradiente de fondo -->
                              <defs>
                                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
                                  <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
                                </linearGradient>

                                <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
                                  <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
                                </linearGradient>

                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
                                </filter>
                              </defs>

                              <!-- Fondo con bordes redondeados -->
                              <rect width="200" height="80" rx="12" ry="12" fill="url(#bgGradient)" filter="url(#shadow)"/>

                              <!-- Elementos UML - Diagrama de clases simplificado -->
                              <g transform="translate(15, 15)">
                                <!-- Clase 1 -->
                                <rect x="0" y="0" width="25" height="18" fill="white" stroke="#dc2626" stroke-width="1.5" rx="2"/>
                                <line x1="0" y1="6" x2="25" y2="6" stroke="#dc2626" stroke-width="1"/>
                                <line x1="0" y1="12" x2="25" y2="12" stroke="#dc2626" stroke-width="1"/>

                                <!-- Clase 2 -->
                                <rect x="40" y="25" width="25" height="18" fill="white" stroke="#dc2626" stroke-width="1.5" rx="2"/>
                                <line x1="40" y1="31" x2="65" y2="31" stroke="#dc2626" stroke-width="1"/>
                                <line x1="40" y1="37" x2="65" y2="37" stroke="#dc2626" stroke-width="1"/>

                                <!-- Clase 3 -->
                                <rect x="80" y="5" width="25" height="18" fill="white" stroke="#dc2626" stroke-width="1.5" rx="2"/>
                                <line x1="80" y1="11" x2="105" y2="11" stroke="#dc2626" stroke-width="1"/>
                                <line x1="80" y1="17" x2="105" y2="17" stroke="#dc2626" stroke-width="1"/>

                                <!-- Conexiones/Relaciones -->
                                <line x1="25" y1="9" x2="40" y2="34" stroke="#00f2fe" stroke-width="2" opacity="0.8"/>
                                <line x1="65" y1="34" x2="80" y2="14" stroke="#00f2fe" stroke-width="2" opacity="0.8"/>
                                <line x1="25" y1="9" x2="80" y2="14" stroke="#00f2fe" stroke-width="2" opacity="0.8"/>

                                <!-- Puntos de conexión colaborativa -->
                                <circle cx="32.5" cy="21.5" r="3" fill="#00f2fe" opacity="0.9"/>
                                <circle cx="72.5" cy="19.5" r="3" fill="#00f2fe" opacity="0.9"/>
                                <circle cx="52.5" cy="11.5" r="3" fill="#00f2fe" opacity="0.9"/>
                              </g>

                              <!-- Texto del logo -->
                              <text x="125" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">UML</text>
                              <text x="125" y="48" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.9">Colaborativo</text>

                              <!-- Icono de colaboración (personas conectadas) -->
                              <g transform="translate(125, 52)">
                                <circle cx="5" cy="5" r="3" fill="white" opacity="0.8"/>
                                <circle cx="15" cy="5" r="3" fill="white" opacity="0.8"/>
                                <circle cx="25" cy="5" r="3" fill="white" opacity="0.8"/>
                                <line x1="5" y1="8" x2="15" y2="8" stroke="white" stroke-width="1.5" opacity="0.6"/>
                                <line x1="15" y1="8" x2="25" y2="8" stroke="white" stroke-width="1.5" opacity="0.6"/>
                              </g>
                            </svg>
                        </div>
                        @if (Route::has('login'))
                            <nav class="-mx-3 flex flex-1 justify-end">
                                @auth
                                    <a
                                        href="{{ url('/diagrams') }}"
                                        class="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Mis Diagramas
                                    </a>
                                @else
                                    <a
                                        href="{{ route('login') }}"
                                        class="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Iniciar Sesión
                                    </a>

                                    @if (Route::has('register'))
                                        <a
                                            href="{{ route('register') }}"
                                            class="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Registrarse
                                        </a>
                                    @endif
                                @endauth
                            </nav>
                        @endif
                    </header>

                    <main class="mt-6">
                        <div class="grid gap-6 lg:grid-cols-2 lg:gap-8">
                            <div id="docs-card" class="flex flex-col items-start gap-6 overflow-hidden rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] md:row-span-3 lg:p-10 lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700 dark:focus-visible:ring-[#FF2D20]">
                                <div id="screenshot-container" class="relative flex w-full flex-1 items-stretch">
                                    <!-- Imagen de demostración del editor UML -->
                                    <img
                                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOWZhZmIiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiM0Yjc2OGgiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjExMCIgeT0iNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMyNTI1MjUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5Vc2VyPC90ZXh0PjxsaW5lIHgxPSI1MCIgeTE9Ijc1IiB4Mj0iMTcwIiB5Mj0iNzUiIHN0cm9rZT0iIzQ5NzE2OCIgc3Ryb2tlLXdpZHRoPSIxIi8+PHRleHQgeD0iMTEwIiB5PSI5NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzI1MjUyNSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiPisgbmFtZTogU3RyaW5nPC90ZXh0Pjx0ZXh0IHg9IjExMCIgeT0iMTA4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMjUyNTI1IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCI+KyBlbWFpbDogU3RyaW5nPC90ZXh0PjxyZWN0IHg9IjMzMCIgeT0iNTAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiM0YjU1NjMiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjM5MCIgeT0iNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMyNTI1MjUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5Qb3N0PC90ZXh0PjxsaW5lIHgxPSIzMzAiIHkxPSI3NSIgeDI9IjQ1MCIgeTI9Ijc1IiBzdHJva2U9IiM0YjU1NjMiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjM5MCIgeT0iOTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMyNTI1MjUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj4rIHRpdGxlOiBTdHJpbmc8L3RleHQ+PHRleHQgeD0iMzkwIiB5PSIxMDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMyNTI1MjUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj4rIGNvbnRlbnQ6IFN0cmluZzwvdGV4dD48bGluZSB4MT0iMTcwIiB5MT0iOTAiIHgyPSIzMzAiIHkyPSI5MCIgc3Ryb2tlPSIjZmY0ZTY0IiBzdHJva2Utd2lkdGg9IjIiLz48cG9seWdvbiBwb2ludHM9IjMyNSw4NSAzMzUsOTAgMzI1LDk1IiBmaWxsPSIjZmY0ZTY0Ii8+PHRleHQgeD0iMjUwIiB5PSI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzI1MjUyNSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiPndyaXRlczwvdGV4dD48L3N2Zz4="
                                        alt="Editor UML screenshot"
                                        class="aspect-video h-full w-full flex-1 rounded-[10px] object-top object-cover drop-shadow-[0px_4px_34px_rgba(0,0,0,0.25)] dark:hidden"
                                        onload="
                                            document.getElementById('screenshot-container').classList.add('!flex-row');
                                            document.getElementById('screenshot-container').classList.add('!h-auto');
                                            document.getElementById('docs-card-content').classList.add('!flex-row');
                                            document.getElementById('background').classList.add('!hidden');
                                        "
                                    />
                                    <img
                                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxODE4MWIiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiMyNDI0MjciIHN0cm9rZT0iIzcyODA4YSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTEwIiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5Vc2VyPC90ZXh0PjxsaW5lIHgxPSI1MCIgeTE9Ijc1IiB4Mj0iMTcwIiB5Mj0iNzUiIHN0cm9rZT0iIzcyODA4YSIgc3Ryb2tlLXdpZHRoPSIxIi8+PHRleHQgeD0iMTEwIiB5PSI5NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2Q0ZDRkOCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiPisgbmFtZTogU3RyaW5nPC90ZXh0Pjx0ZXh0IHg9IjExMCIgeT0iMTA4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZDRkNGQ4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCI+KyBlbWFpbDogU3RyaW5nPC90ZXh0PjxyZWN0IHg9IjMzMCIgeT0iNTAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiMyNDI0MjciIHN0cm9rZT0iIzcyODA4YSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMzkwIiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj5Qb3N0PC90ZXh0PjxsaW5lIHgxPSIzMzAiIHkxPSI3NSIgeDI9IjQ1MCIgeTI9Ijc1IiBzdHJva2U9IiM3MjgwOGEiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjM5MCIgeT0iOTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNkNGQ0ZDgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj4rIHRpdGxlOiBTdHJpbmc8L3RleHQ+PHRleHQgeD0iMzkwIiB5PSIxMDgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNkNGQ0ZDgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIj4rIGNvbnRlbnQ6IFN0cmluZzwvdGV4dD48bGluZSB4MT0iMTcwIiB5MT0iOTAiIHgyPSIzMzAiIHkyPSI5MCIgc3Ryb2tlPSIjZmY0ZTY0IiBzdHJva2Utd2lkdGg9IjIiLz48cG9seWdvbiBwb2ludHM9IjMyNSw4NSAzMzUsOTAgMzI1LDk1IiBmaWxsPSIjZmY0ZTY0Ii8+PHRleHQgeD0iMjUwIiB5PSI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2Q0ZDRkOCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiPndyaXRlczwvdGV4dD48L3N2Zz4="
                                        alt="Editor UML dark mode screenshot"
                                        class="hidden aspect-video h-full w-full flex-1 rounded-[10px] object-top object-cover drop-shadow-[0px_4px_34px_rgba(0,0,0,0.25)] dark:block"
                                    />
                                    <div
                                        class="absolute -bottom-16 -left-16 h-40 w-[calc(100%_+_8rem)] bg-gradient-to-b from-transparent via-white to-white dark:via-zinc-900 dark:to-zinc-900"
                                    ></div>
                                </div>

                                <div class="relative flex items-center gap-6 lg:items-end">
                                    <div id="docs-card-content" class="flex items-start gap-6 lg:flex-col">
                                        <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                            <!-- Icono de documentación UML -->
                                            <svg class="size-5 sm:size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <path fill="#FF2D20" d="M4 4h16v2H4V4zm0 4h16v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z"/>
                                                <path fill="#FF2D20" d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/>
                                            </svg>
                                        </div>

                                        <div class="pt-3 sm:pt-5 lg:pt-0">
                                            <h2 class="text-xl font-semibold text-black dark:text-white">Editor UML Avanzado</h2>

                                            <p class="mt-4 text-sm/relaxed">
                                                Crea diagramas de clases UML de forma intuitiva con nuestro editor visual.
                                                Soporte completo para asociaciones, herencia, composición y agregación.
                                                Diseñado para desarrolladores que buscan calidad profesional.
                                            </p>
                                        </div>
                                    </div>

                                    <svg class="size-6 shrink-0 self-center stroke-[#FF2D20]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
                                </div>
                            </div>

                            <a
                                href="{{ route('login') }}"
                                class="flex items-start gap-4 rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700 dark:focus-visible:ring-[#FF2D20]"
                            >
                                <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                    <!-- Icono de colaboración -->
                                    <svg class="size-5 sm:size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <path fill="#FF2D20" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        <path fill="#FF2D20" d="M16 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z"/>
                                        <path fill="#FF2D20" d="M8 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z"/>
                                    </svg>
                                </div>

                                <div class="pt-3 sm:pt-5">
                                    <h2 class="text-xl font-semibold text-black dark:text-white">Colaboración en Tiempo Real</h2>

                                    <p class="mt-4 text-sm/relaxed">
                                        Trabaja en equipo de forma sincronizada. Ve los cambios de tus colaboradores
                                        en tiempo real, comparte diagramas con enlaces seguros y mantén la productividad
                                        del equipo al máximo nivel.
                                    </p>
                                </div>

                                <svg class="size-6 shrink-0 self-center stroke-[#FF2D20]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
                            </a>

                            <a
                                href="{{ route('register') }}"
                                class="flex items-start gap-4 rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:text-white/70 dark:hover:ring-zinc-700 dark:focus-visible:ring-[#FF2D20]"
                            >
                                <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                    <!-- Icono de código/generación -->
                                    <svg class="size-5 sm:size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <path fill="#FF2D20" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                                        <rect x="2" y="2" width="20" height="20" rx="2" fill="none" stroke="#FF2D20" stroke-width="1"/>
                                    </svg>
                                </div>

                                <div class="pt-3 sm:pt-5">
                                    <h2 class="text-xl font-semibold text-black dark:text-white">Generación de Código</h2>

                                    <p class="mt-4 text-sm/relaxed">
                                        Convierte tus diagramas UML directamente en código Spring Boot funcional.
                                        Genera modelos, repositorios, servicios y controladores completos.
                                        De la idea al código en segundos.
                                    </p>
                                </div>

                                <svg class="size-6 shrink-0 self-center stroke-[#FF2D20]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
                            </a>

                            <div class="flex items-start gap-4 rounded-lg bg-white p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-1 ring-white/[0.05] lg:pb-10 dark:bg-zinc-900 dark:ring-zinc-800">
                                <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF2D20]/10 sm:size-16">
                                    <!-- Icono de exportación -->
                                    <svg class="size-5 sm:size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <path fill="#FF2D20" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                        <path fill="white" d="M14 2v6h6"/>
                                        <path fill="white" d="M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
                                        <path fill="#FF2D20" d="M12 11v4"/>
                                        <path fill="#FF2D20" d="M10 13h4"/>
                                    </svg>
                                </div>

                                <div class="pt-3 sm:pt-5">
                                    <h2 class="text-xl font-semibold text-black dark:text-white">Exportación Profesional</h2>

                                    <p class="mt-4 text-sm/relaxed">
                                        Exporta tus diagramas en múltiples formatos: PNG de alta calidad, XMI compatible con
                                        Enterprise Architect, y colecciones Postman listas para usar. Integración perfecta
                                        con tu flujo de trabajo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>

                    <footer class="py-16 text-center text-sm text-black dark:text-white/70">
                        Diagramador UML Colaborativo - Potenciado por Laravel v{{ Illuminate\Foundation\Application::VERSION }}
                    </footer>
                </div>
            </div>
        </div>
    </body>
</html>
