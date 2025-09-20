<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased bg-gray-100 min-h-screen">
        <div class="min-h-screen flex flex-col">
            <!-- Header con navegación -->
            <header class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-6">
                        <!-- Logo -->
                        <div class="flex items-center">
                            <x-application-logo class="h-10 w-auto fill-current text-gray-500" />
                            <h1 class="ml-3 text-xl font-bold text-gray-900">{{ config('app.name', 'Diagrams App') }}</h1>
                        </div>

                        <!-- Navigation -->
                        <nav class="flex items-center space-x-4">
                            @auth
                                <a href="{{ route('diagrams.index') }}"
                                   class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                    Ir al Dashboard
                                </a>
                                <form method="POST" action="{{ route('logout') }}" class="inline">
                                    @csrf
                                    <button type="submit"
                                            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                        Cerrar Sesión
                                    </button>
                                </form>
                            @else
                                <a href="{{ route('login') }}"
                                   class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                    Iniciar Sesión
                                </a>
                                <a href="{{ route('register') }}"
                                   class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                    Registrarse
                                </a>
                            @endauth
                        </nav>
                    </div>
                </div>
            </header>

            <!-- Main content -->
            <main class="flex-1">
                <!-- Hero Section -->
                <div class="bg-white">
                    <div class="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
                        <div class="text-center">
                            <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                                Bienvenido a tu
                                <span class="text-blue-600">Editor de Diagramas</span>
                            </h1>
                            <p class="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                                Crea, edita y colabora en diagramas de forma intuitiva.
                                Diseña tus ideas con herramientas profesionales.
                            </p>
                        </div>

                        <!-- Action buttons -->
                        <div class="mt-8 flex justify-center">
                            @auth
                                <div class="rounded-md shadow">
                                    <a href="{{ route('diagrams.index') }}"
                                       class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                                        Ver mis Diagramas
                                    </a>
                                </div>
                            @else
                                <div class="rounded-md shadow">
                                    <a href="{{ route('register') }}"
                                       class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                                        Comenzar Gratis
                                    </a>
                                </div>
                                <div class="ml-3 rounded-md shadow">
                                    <a href="{{ route('login') }}"
                                       class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                                        Iniciar Sesión
                                    </a>
                                </div>
                            @endauth
                        </div>
                    </div>
                </div>

                <!-- Features Section -->
                <div class="py-12 bg-gray-50">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="lg:text-center">
                            <h2 class="text-base text-blue-600 font-semibold tracking-wide uppercase">Características</h2>
                            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                Todo lo que necesitas para crear diagramas
                            </p>
                        </div>

                        <div class="mt-10">
                            <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                                <!-- Feature 1 -->
                                <div class="text-center">
                                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="mt-4 text-lg leading-6 font-medium text-gray-900">Editor Intuitivo</h3>
                                    <p class="mt-2 text-base text-gray-500">
                                        Interface fácil de usar con herramientas de diseño profesionales.
                                    </p>
                                </div>

                                <!-- Feature 2 -->
                                <div class="text-center">
                                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <h3 class="mt-4 text-lg leading-6 font-medium text-gray-900">Colaboración</h3>
                                    <p class="mt-2 text-base text-gray-500">
                                        Trabaja en tiempo real con tu equipo en los mismos diagramas.
                                    </p>
                                </div>

                                <!-- Feature 3 -->
                                <div class="text-center">
                                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                        </svg>
                                    </div>
                                    <h3 class="mt-4 text-lg leading-6 font-medium text-gray-900">Exportación</h3>
                                    <p class="mt-2 text-base text-gray-500">
                                        Exporta tus diagramas en múltiples formatos para cualquier uso.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-white">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div class="text-center text-gray-500 text-sm">
                        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    </body>
</html>
