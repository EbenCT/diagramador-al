{{-- resources/views/diagrams/index.blade.php --}}
<x-app-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ __('Mis Diagramas UML') }}
            </h2>
            <a href="{{ route('diagrams.editor') }}"
               class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                ➕ Nuevo Diagrama
            </a>
        </div>
    </x-slot>

    <div class="py-6">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

            {{-- Estadísticas rápidas --}}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-blue-600 font-semibold">📊</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Total</dt>
                                    <dd class="text-lg font-medium text-gray-900">{{ $stats['total'] }}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span class="text-green-600 font-semibold">🔒</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Privados</dt>
                                    <dd class="text-lg font-medium text-gray-900">{{ $stats['private'] }}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span class="text-purple-600 font-semibold">🤝</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Compartidos</dt>
                                    <dd class="text-lg font-medium text-gray-900">{{ $stats['shared'] }}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span class="text-orange-600 font-semibold">📝</span>
                                </div>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Templates</dt>
                                    <dd class="text-lg font-medium text-gray-900">{{ $stats['templates'] }}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Filtros y búsqueda --}}
            <div class="bg-white shadow-sm sm:rounded-lg mb-6">
                <div class="p-6">
                    <form method="GET" action="{{ route('diagrams.index') }}" class="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                        <div class="flex-1">
                            <input type="text"
                                   name="search"
                                   value="{{ $filters['search'] }}"
                                   placeholder="Buscar por título o descripción..."
                                   class="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>

                        <div>
                            <select name="visibility" class="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                <option value="">Todas las visibilidades</option>
                                <option value="private" {{ $filters['visibility'] === 'private' ? 'selected' : '' }}>Privados</option>
                                <option value="shared" {{ $filters['visibility'] === 'shared' ? 'selected' : '' }}>Compartidos</option>
                                <option value="public" {{ $filters['visibility'] === 'public' ? 'selected' : '' }}>Públicos</option>
                            </select>
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox"
                                   name="templates"
                                   id="templates"
                                   value="1"
                                   {{ $filters['is_template'] ? 'checked' : '' }}
                                   class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                            <label for="templates" class="ml-2 text-sm text-gray-700">Solo templates</label>
                        </div>

                        <div class="flex space-x-2">
                            <button type="submit"
                                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                🔍 Filtrar
                            </button>
                            <a href="{{ route('diagrams.index') }}"
                               class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                ✖️ Limpiar
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            {{-- Lista de diagramas --}}
            @if($diagrams->count() > 0)
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @foreach($diagrams as $diagram)
                        <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg hover:shadow-md transition-shadow">
                            <div class="p-6">
                                {{-- Header del diagrama --}}
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <h3 class="text-lg font-medium text-gray-900 truncate">
                                            {{ $diagram->title }}
                                        </h3>
                                        @if($diagram->description)
                                            <p class="mt-1 text-sm text-gray-600 line-clamp-2">
                                                {{ Str::limit($diagram->description, 100) }}
                                            </p>
                                        @endif
                                    </div>

                                    {{-- Indicador de visibilidad --}}
                                    <div class="ml-4 flex-shrink-0">
                                        @if($diagram->visibility === 'private')
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                🔒 Privado
                                            </span>
                                        @elseif($diagram->visibility === 'shared')
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                🤝 Compartido
                                            </span>
                                        @elseif($diagram->visibility === 'public')
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                🌍 Público
                                            </span>
                                        @endif

                                        @if($diagram->is_template)
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2">
                                                📝 Template
                                            </span>
                                        @endif
                                    </div>
                                </div>

                                {{-- Estadísticas del diagrama --}}
                                <div class="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                                    <span class="flex items-center">
                                        <span class="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                        {{ $diagram->elements_count }} elementos
                                    </span>
                                    <span class="flex items-center">
                                        <span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        {{ $diagram->classes_count }} clases
                                    </span>
                                    <span class="flex items-center">
                                        <span class="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                                        v{{ $diagram->version }}
                                    </span>
                                </div>

                                {{-- Fechas --}}
                                <div class="text-xs text-gray-400 mb-4">
                                    <div>Creado: {{ $diagram->created_at->format('d/m/Y H:i') }}</div>
                                    @if($diagram->last_saved_at)
                                        <div>Guardado: {{ $diagram->last_saved_at->diffForHumans() }}</div>
                                    @endif
                                </div>

                                {{-- Botones de acción --}}
                                <div class="flex flex-wrap gap-2">
                                    <a href="{{ route('diagrams.editor', $diagram->id) }}"
                                       class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                        ✏️ Editar
                                    </a>

                                    <a href="{{ route('diagrams.show', $diagram->id) }}"
                                       class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                        👁️ Ver
                                    </a>

                                    <form method="POST" action="{{ route('diagrams.duplicate', $diagram->id) }}" class="inline">
                                        @csrf
                                        <button type="submit"
                                                class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                            📋 Clonar
                                        </button>
                                    </form>

                                    @if($diagram->user_id === auth()->id())
                                        <form method="POST" action="{{ route('diagrams.destroy', $diagram->id) }}"
                                              class="inline"
                                              onsubmit="return confirm('¿Estás seguro de eliminar este diagrama?')">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit"
                                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                                                🗑️ Eliminar
                                            </button>
                                        </form>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>

                {{-- Paginación --}}
                <div class="mt-6">
                    {{ $diagrams->appends(request()->query())->links() }}
                </div>
            @else
                {{-- Estado vacío --}}
                <div class="bg-white shadow-sm sm:rounded-lg">
                    <div class="p-12 text-center">
                        <div class="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <span class="text-4xl text-gray-400">📊</span>
                        </div>

                        <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes diagramas aún</h3>
                        <p class="text-gray-600 mb-6">Comienza creando tu primer diagrama de clases UML</p>

                        <a href="{{ route('diagrams.editor') }}"
                           class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
                            ➕ Crear mi primer diagrama
                        </a>
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- Notificaciones --}}
    @if (session('success'))
        <div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
             x-data="{ show: true }"
             x-show="show"
             x-init="setTimeout(() => show = false, 4000)"
             x-transition:enter="transform transition-all duration-300"
             x-transition:enter-start="translate-x-full opacity-0"
             x-transition:enter-end="translate-x-0 opacity-100"
             x-transition:leave="transform transition-all duration-300"
             x-transition:leave-start="translate-x-0 opacity-100"
             x-transition:leave-end="translate-x-full opacity-0">
            <div class="flex items-center space-x-2">
                <span class="text-lg">✅</span>
                <span>{{ session('success') }}</span>
            </div>
        </div>
    @endif
</x-app-layout>
