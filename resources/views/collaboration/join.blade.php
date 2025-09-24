<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Unirse a Sesión Colaborativa - {{ config('app.name', 'Laravel') }}</title>
    @vite(['resources/css/app.css'])
</head>

<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div class="text-center">
                <div class="mx-auto h-12 w-12 text-4xl mb-4">🤝</div>
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                    Colaboración UML
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    Te han invitado a colaborar en: <strong>{{ $session->diagram->title }}</strong>
                </p>
            </div>

            <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                @auth
                    {{-- Usuario autenticado - Unirse directamente --}}
                    <div class="text-center space-y-4">
                        <p class="text-sm text-gray-500">
                            Conectado como: <strong>{{ Auth::user()->name }}</strong>
                        </p>

                        <form method="GET" action="{{ route('diagrams.editor', $session->diagram->id) }}">
                            <input type="hidden" name="collab" value="{{ $session->invite_token }}">
                            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                🚀 Unirse a la Sesión Colaborativa
                            </button>
                        </form>
                    </div>
                @else
                    {{-- Usuario no autenticado - Necesita login --}}
                    <div class="space-y-6">
                        <div class="text-center">
                            <p class="text-sm text-gray-500">
                                Necesitas iniciar sesión para colaborar
                            </p>
                        </div>

                        <div class="space-y-3">
                            <a href="{{ route('login') }}?redirect={{ urlencode(request()->fullUrl()) }}"
                               class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                🔑 Iniciar Sesión
                            </a>

                            <a href="{{ route('register') }}"
                               class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                📝 Crear Cuenta
                            </a>
                        </div>
                    </div>
                @endauth

                <div class="mt-6 border-t border-gray-200 pt-6">
                    <div class="text-xs text-gray-500 text-center">
                        <p><strong>Diagrama:</strong> {{ $session->diagram->title }}</p>
                        <p><strong>Creado por:</strong> {{ $session->diagram->user->name }}</p>
                        <p><strong>Colaboradores activos:</strong> {{ count($session->active_users ?? []) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
