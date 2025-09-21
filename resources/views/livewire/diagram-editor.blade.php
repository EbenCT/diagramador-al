{{-- resources/views/livewire/diagram-editor.blade.php --}}
{{-- VERSIÓN SIMPLIFICADA - Solo responsabilidades de Livewire --}}

<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.7.3/joint.css" />

<div class="h-screen flex flex-col bg-gray-100">
    <!-- Header/Toolbar - SOLO funciones de Livewire -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <h1 class="text-xl font-semibold text-gray-900">{{ $diagramTitle }}</h1>

                {{-- Solo botones que SÍ necesitan Livewire --}}
                <div class="flex items-center space-x-2">
                    <button
                        onclick="saveFromButton()"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        💾 Guardar
                    </button>
                    <button
                        wire:click="clearDiagram"
                        wire:confirm="¿Estás seguro de limpiar todo el diagrama?"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        🗑️ Limpiar
                    </button>
                    <button
                        wire:click="exportDiagram"
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        📄 Exportar
                    </button>
                </div>
            </div>

            <!-- Controles de zoom - JavaScript directo -->
            <div class="flex items-center space-x-2">
                <button id="zoom-in" class="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Acercar (Scroll Up)">
                    🔍+
                </button>
                <button id="zoom-out" class="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Alejar (Scroll Down)">
                    🔍-
                </button>
                <button id="zoom-fit" class="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Ajustar al contenido">
                    ⬜
                </button>
                <span id="canvas-info" class="text-sm text-gray-500 ml-4 font-mono">
                    Elementos: 0 | Zoom: 100%
                </span>
            </div>
        </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar - JavaScript generará el toolbar aquí -->
        <div class="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-medium text-gray-900">Herramientas UML</h2>
            </div>

            {{-- Container para toolbar generado por JavaScript --}}
            <div id="js-toolbar" class="flex-1">
                {{-- El JavaScript creará los botones aquí --}}
                <div class="p-4 text-center text-gray-500 text-sm" id="loading-toolbar">
                    <div class="animate-pulse">Cargando herramientas...</div>
                </div>
            </div>

            {{-- Instrucciones dinámicas --}}
            <div class="p-4 border-t border-gray-200 bg-gray-50">
                <div class="text-sm">
                    <div class="font-medium text-gray-700 mb-2">Instrucciones:</div>
                    <div id="tool-instructions" class="text-gray-600 italic">
                        Selecciona una herramienta para comenzar
                    </div>
                </div>

                {{-- Atajos de teclado --}}
                <div class="mt-4 pt-4 border-t border-gray-300">
                    <div class="text-xs font-medium text-gray-700 mb-2">Atajos:</div>
                    <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>1-6: Herramientas</div>
                        <div>Ctrl+S: Guardar</div>
                        <div>Scroll: Zoom</div>
                        <div>Click+Drag: Pan</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Canvas principal -->
        <div class="flex-1 relative overflow-hidden">
            <div
                id="paper-container"
                class="w-full h-full bg-gray-50 relative">
                {{-- JointJS se renderiza aquí --}}

                {{-- Overlay de estado --}}
                <div class="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-sm border z-10">
                    <div class="flex items-center space-x-3 text-sm">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-500 rounded-full" id="editor-status"></div>
                            <span class="text-gray-600">Editor listo</span>
                        </div>
                        <div class="text-gray-400">|</div>
                        <span id="current-tool" class="font-mono text-gray-800">select</span>
                    </div>
                </div>
            </div>

            {{-- Loading overlay para operaciones Livewire --}}
            <div
                wire:loading
                class="absolute inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-20">
                <div class="bg-white px-6 py-3 rounded-lg shadow-lg">
                    <div class="flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span class="text-gray-600 font-medium">Procesando...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Notificaciones flash - Solo para operaciones Livewire --}}
    @if (session()->has('message'))
        <div
            class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-30"
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
                <span>{{ session('message') }}</span>
            </div>
        </div>
    @endif

    {{-- Error notifications --}}
    @if (session()->has('error'))
        <div
            class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-30"
            x-data="{ show: true }"
            x-show="show"
            x-init="setTimeout(() => show = false, 5000)"
            x-transition:enter="transform transition-all duration-300"
            x-transition:enter-start="translate-x-full opacity-0"
            x-transition:enter-end="translate-x-0 opacity-100"
            x-transition:leave="transform transition-all duration-300"
            x-transition:leave-start="translate-x-0 opacity-100"
            x-transition:leave-end="translate-x-full opacity-0">
            <div class="flex items-center space-x-2">
                <span class="text-lg">❌</span>
                <span>{{ session('error') }}</span>
            </div>
        </div>
    @endif

    {{-- Scripts simplificados --}}
    <script>
        // Datos del diagrama para JavaScript
        window.diagramData = @json($diagramData);
        window.diagramId = {{ $diagramId ?? 'null' }};
        window.diagramTitle = @json($diagramTitle ?? 'Nuevo Diagrama UML *');
        window.authUser = @json(auth()->user());

        // NUEVO: Datos de sesión colaborativa
        @if($collaborationSession)
            window.diagramSessionId = @json($collaborationSession);
            console.log('🤝 Sesión colaborativa detectada:', window.diagramSessionId);
        @endif

        console.log('📊 Datos del template:', {
            hasData: window.diagramData !== '[]',
            diagramId: window.diagramId,
            title: window.diagramTitle,
            dataLength: window.diagramData.length
        });

        // Función simple para guardar desde botón
        function saveFromButton() {
            console.log('💾 Guardado desde botón...');

            if (window.DiagramEditor && window.DiagramEditor.instance) {
                window.DiagramEditor.instance.saveDiagram();
            } else {
                console.error('❌ Editor no disponible');
                alert('Editor no está listo');
            }
        }

        // Función para limpiar desde botón
        function clearFromButton() {
            if (window.DiagramEditor && window.DiagramEditor.instance) {
                if (confirm('¿Estás seguro de limpiar todo el diagrama?')) {
                    window.DiagramEditor.instance.clearDiagram();
                }
            }
        }

        // Escuchar cuando se crea un diagrama para actualizar la URL
        window.addEventListener('diagram-created', function(event) {
            console.log('🆕 Diagrama creado:', event.detail);

            // Actualizar variables globales
            window.currentDiagramId = event.detail.id;
            window.currentDiagramTitle = event.detail.title;

            // Actualizar URL sin recargar
            var newUrl = '/diagrams/editor/' + event.detail.id;
            window.history.pushState({}, '', newUrl);

            // Actualizar título de la página
            document.title = event.detail.title + ' - Editor UML';
        });

        console.log('✅ Template Livewire scripts cargados');
    </script>
</div>
