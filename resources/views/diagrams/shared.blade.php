{{-- resources/views/diagrams/shared.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $diagram->title }} - Diagrama Compartido</title>
    <meta name="description" content="{{ $diagram->description ?? 'Diagrama UML compartido' }}">

    <!-- Open Graph para redes sociales -->
    <meta property="og:title" content="{{ $diagram->title }}">
    <meta property="og:description" content="{{ $diagram->description ?? 'Diagrama UML compartido' }}">
    <meta property="og:type" content="website">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- JointJS CSS -->
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.7.3/joint.css" />

    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans antialiased bg-gray-50">
    <div class="min-h-screen flex flex-col">

        <!-- Header minimalista -->
        <nav class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <span class="text-2xl">📊</span>
                        <div>
                            <h1 class="text-lg font-semibold text-gray-900">{{ $diagram->title }}</h1>
                            @if($diagram->description)
                                <p class="text-sm text-gray-600">{{ $diagram->description }}</p>
                            @endif
                        </div>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <!-- Información del diagrama -->
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        <span class="flex items-center">
                            <span class="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                            {{ $diagram->elements_count }} elementos
                        </span>
                        <span class="flex items-center">
                            <span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            {{ $diagram->classes_count }} clases
                        </span>
                        <span class="text-xs text-gray-400">
                            por {{ $diagram->user->name }}
                        </span>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex space-x-2">
                        @auth
                            <form method="POST" action="{{ route('diagrams.duplicate', $diagram->id) }}">
                                @csrf
                                <button type="submit"
                                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    📋 Clonar a mis diagramas
                                </button>
                            </form>
                        @else
                            <a href="{{ route('login') }}"
                               class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Iniciar sesión para clonar
                            </a>
                        @endauth

                        <button onclick="exportDiagram('png')"
                                class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            📷 Exportar PNG
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Visor del diagrama -->
        <div class="flex-1 flex">
            <!-- Canvas principal -->
            <div class="flex-1 relative">
                <div
                    id="paper-container"
                    class="w-full h-full bg-gray-50 relative">
                    <!-- El diagrama se renderiza aquí -->
                </div>

                <!-- Overlay con información -->
                <div class="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-sm border">
                    <div class="text-sm text-gray-600">
                        <div class="font-medium">Modo visualización</div>
                        <div class="text-xs mt-1">Solo lectura • Usa zoom y pan para navegar</div>
                    </div>
                </div>

                <!-- Controles de zoom -->
                <div class="absolute bottom-4 right-4 flex flex-col space-y-2">
                    <button id="zoom-in"
                            class="bg-white hover:bg-gray-50 border border-gray-300 p-2 rounded-md shadow-sm transition-colors"
                            title="Acercar">
                        🔍+
                    </button>
                    <button id="zoom-out"
                            class="bg-white hover:bg-gray-50 border border-gray-300 p-2 rounded-md shadow-sm transition-colors"
                            title="Alejar">
                        🔍-
                    </button>
                    <button id="zoom-fit"
                            class="bg-white hover:bg-gray-50 border border-gray-300 p-2 rounded-md shadow-sm transition-colors"
                            title="Ajustar al contenido">
                        ⬜
                    </button>
                </div>
            </div>

            <!-- Panel de información lateral -->
            <div class="w-80 bg-white shadow-sm border-l border-gray-200 overflow-y-auto">
                <div class="p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Diagrama</h3>

                    <!-- Metadatos -->
                    <div class="space-y-4">
                        <div>
                            <dt class="text-sm font-medium text-gray-500">Creado por</dt>
                            <dd class="text-sm text-gray-900">{{ $diagram->user->name }}</dd>
                        </div>

                        <div>
                            <dt class="text-sm font-medium text-gray-500">Creado</dt>
                            <dd class="text-sm text-gray-900">{{ $diagram->created_at->format('d/m/Y H:i') }}</dd>
                        </div>

                        <div>
                            <dt class="text-sm font-medium text-gray-500">Última actualización</dt>
                            <dd class="text-sm text-gray-900">{{ $diagram->last_saved_at?->diffForHumans() ?? 'No disponible' }}</dd>
                        </div>

                        <div>
                            <dt class="text-sm font-medium text-gray-500">Versión</dt>
                            <dd class="text-sm text-gray-900">{{ $diagram->version }}</dd>
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <h4 class="text-md font-medium text-gray-900 mb-3">Estadísticas</h4>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center p-3 bg-blue-50 rounded-lg">
                                <div class="text-2xl font-bold text-blue-600">{{ $diagram->elements_count }}</div>
                                <div class="text-xs text-blue-600">Elementos totales</div>
                            </div>

                            <div class="text-center p-3 bg-green-50 rounded-lg">
                                <div class="text-2xl font-bold text-green-600">{{ $diagram->classes_count }}</div>
                                <div class="text-xs text-green-600">Clases</div>
                            </div>

                            <div class="text-center p-3 bg-purple-50 rounded-lg">
                                <div class="text-2xl font-bold text-purple-600">{{ $diagram->relationships_count }}</div>
                                <div class="text-xs text-purple-600">Relaciones</div>
                            </div>

                            <div class="text-center p-3 bg-orange-50 rounded-lg">
                                <div class="text-2xl font-bold text-orange-600">{{ $diagram->version }}</div>
                                <div class="text-xs text-orange-600">Versión</div>
                            </div>
                        </div>
                    </div>

                    <!-- Instrucciones de uso -->
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <h4 class="text-md font-medium text-gray-900 mb-3">Navegación</h4>
                        <div class="space-y-2 text-sm text-gray-600">
                            <div class="flex justify-between">
                                <span>Zoom</span>
                                <code class="bg-gray-100 px-2 py-1 rounded text-xs">Scroll del mouse</code>
                            </div>
                            <div class="flex justify-between">
                                <span>Pan</span>
                                <code class="bg-gray-100 px-2 py-1 rounded text-xs">Click y arrastra</code>
                            </div>
                            <div class="flex justify-between">
                                <span>Ajustar</span>
                                <code class="bg-gray-100 px-2 py-1 rounded text-xs">Botón ⬜</code>
                            </div>
                        </div>
                    </div>

                    @auth
                        <!-- Acciones para usuarios autenticados -->
                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <h4 class="text-md font-medium text-gray-900 mb-3">Acciones</h4>
                            <div class="space-y-3">
                                <form method="POST" action="{{ route('diagrams.duplicate', $diagram->id) }}">
                                    @csrf
                                    <button type="submit"
                                            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        📋 Clonar a mis diagramas
                                    </button>
                                </form>

                                <a href="{{ route('diagrams.index') }}"
                                   class="block w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors">
                                    🏠 Ver mis diagramas
                                </a>
                            </div>
                        </div>
                    @endauth
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts para el visor -->
    <script>
        // Datos del diagrama
        const diagramData = @json($diagram->data);

        // Visor de solo lectura
        class DiagramViewer {
            constructor() {
                this.graph = new joint.dia.Graph();
                this.paper = null;
                this.currentZoom = 1;

                this.init();
            }

            init() {
                this.createPaper();
                this.setupEventListeners();
                this.loadDiagram();
            }

            createPaper() {
                const container = document.getElementById('paper-container');
                if (!container) return;

                this.paper = new joint.dia.Paper({
                    el: container,
                    model: this.graph,
                    width: '100%',
                    height: '100%',
                    gridSize: 20,
                    drawGrid: true,
                    background: { color: '#f9fafb' },
                    interactive: false, // Solo lectura
                    mouseWheelZoom: true
                });

                console.log('✅ Visor de diagrama inicializado (solo lectura)');
            }

            setupEventListeners() {
                document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
                document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
                document.getElementById('zoom-fit')?.addEventListener('click', () => this.zoomToFit());
            }

            loadDiagram() {
                if (diagramData && diagramData.cells) {
                    try {
                        this.graph.fromJSON(diagramData);

                        // Ajustar al contenido después de cargar
                        setTimeout(() => {
                            this.zoomToFit();
                        }, 100);

                        console.log('✅ Diagrama cargado:', diagramData.cells.length, 'elementos');
                    } catch (error) {
                        console.error('❌ Error cargando diagrama:', error);
                    }
                }
            }

            zoomIn() {
                this.currentZoom = Math.min(3, this.currentZoom + 0.1);
                this.paper.scale(this.currentZoom, this.currentZoom);
            }

            zoomOut() {
                this.currentZoom = Math.max(0.2, this.currentZoom - 0.1);
                this.paper.scale(this.currentZoom, this.currentZoom);
            }

            zoomToFit() {
                this.paper.scaleContentToFit({ padding: 20 });
                this.currentZoom = this.paper.scale().sx;
            }
        }

        // Función de exportación básica
        function exportDiagram(format) {
            if (format === 'png') {
                // Placeholder - se implementará con html2canvas
                alert('Funcionalidad de exportación próximamente. Por ahora usa clic derecho > Guardar imagen.');
            }
        }

        // Inicializar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            new DiagramViewer();
        });
    </script>
</body>
</html>
