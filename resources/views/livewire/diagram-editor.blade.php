{{-- resources/views/livewire/diagram-editor.blade.php --}}
{{-- VERSIÓN SIMPLIFICADA - Solo responsabilidades de Livewire --}}

<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.7.3/joint.css" />

<div class="h-screen flex flex-col bg-gray-100">
    <!-- Header/Toolbar - SOLO funciones de Livewire -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <h1 class="text-xl font-semibold text-gray-900">{{ $diagramTitle }}</h1>
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

                    {{-- Dropdown de Importación --}}
                    <div class="relative" x-data="{ open: false }">
                        <button
                            @click="open = !open"
                            @click.outside="open = false"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center">
                            📁 Importar
                            <svg class="ml-2 w-4 h-4" :class="{ 'rotate-180': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        {{-- Menú desplegable --}}
                        <div
                            x-show="open"
                            x-transition:enter="transition ease-out duration-200"
                            x-transition:enter-start="opacity-0 scale-95"
                            x-transition:enter-end="opacity-100 scale-100"
                            x-transition:leave="transition ease-in duration-150"
                            x-transition:leave-start="opacity-100 scale-100"
                            x-transition:leave-end="opacity-0 scale-95"
                            class="absolute top-full right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                            style="display: none;">

                            {{-- Importación desde archivos --}}
                            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                Desde Archivo
                            </div>

                            <button
                                id="import-xmi-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Importar XML/XMI
                                <span class="ml-auto text-xs text-gray-400">UML 2.5</span>
                            </button>

                            {{-- Separador --}}
                            <div class="border-t border-gray-100 my-1"></div>

                            {{-- Importación con IA --}}
                            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Desde Imagen (IA)
                            </div>

                            <button
                                id="import-image-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Analizar Imagen
                                <span class="ml-auto text-xs text-purple-400">Groq AI</span>
                            </button>
                        </div>
                    </div>

                    {{-- Dropdown de Exportación --}}
                    <div class="relative" x-data="{ open: false }">
                        <button
                            @click="open = !open"
                            @click.outside="open = false"
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center">
                            📄 Exportar
                            <svg class="ml-2 w-4 h-4" :class="{ 'rotate-180': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        {{-- Menú desplegable --}}
                        <div
                            x-show="open"
                            x-transition:enter="transition ease-out duration-200"
                            x-transition:enter-start="opacity-0 scale-95"
                            x-transition:enter-end="opacity-100 scale-100"
                            x-transition:leave="transition ease-in duration-150"
                            x-transition:leave-start="opacity-100 scale-100"
                            x-transition:leave-end="opacity-0 scale-95"
                            class="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                            style="display: none;">

                            {{-- Exportación de Imágenes --}}
                            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                Imágenes
                            </div>

                            <button
                                id="export-png-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Exportar PNG
                            </button>

                            <button
                                id="export-jpg-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                Exportar JPG
                            </button>

                            {{-- Separador --}}
                            <div class="border-t border-gray-100 my-1"></div>

                            {{-- Otros formatos --}}
                            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Otros formatos
                            </div>
                            <div class="border-t border-gray-100 my-1"></div>
                            <button
                                id="export-xmi-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                Exportar XMI
                                <span class="ml-auto text-xs text-gray-400">UML 2.5</span>
                            </button>

                            <button
                                id="generate-sql-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4"></path>
                                </svg>
                                Generar SQL
                                <span class="ml-auto text-xs text-gray-400">MySQL</span>
                            </button>
                            <div class="border-t border-gray-100 my-1"></div>
                            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                BACKEND
                            </div>
                            <button
                                id="generate-java-btn"
                                @click="expanded = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                </svg>
                                Generar Java
                                <span class="ml-auto text-xs text-gray-400">Spring Boot</span>
                            </button>

                            <button
                                id="generate-postman-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                                </svg>
                                Generar Postman
                                <span class="ml-auto text-xs text-gray-400">API Collection</span>
                            </button>

                            <button
                                id="generate-flutter-btn"
                                @click="open = false"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 flex items-center">
                                <svg class="w-4 h-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                                Generar Flutter
                                <span class="ml-auto text-xs text-gray-400">Mobile App</span>
                            </button>
                        </div>
                    </div>
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
        window.AI_CONFIG = {
            GROQ_API_KEY: '{{ config("services.groq.api_key") }}',
            GROQ_MODEL: '{{ config("services.groq.model") }}'
        };
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
