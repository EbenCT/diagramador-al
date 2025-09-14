{{-- CSS de JointJS --}}
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.7.3/joint.css" />

<div class="h-screen flex flex-col bg-gray-100">
    <!-- Header/Toolbar -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <h1 class="text-xl font-semibold text-gray-900">{{ $diagramTitle }}</h1>
                <div class="flex items-center space-x-2">
                    <button
                        wire:click="saveDiagram"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        💾 Guardar
                    </button>
                    <button
                        wire:click="clearDiagram"
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

            <!-- Controles de zoom -->
            <div class="flex items-center space-x-2">
                <button id="zoom-in" class="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Acercar">
                    🔍+
                </button>
                <button id="zoom-out" class="p-2 hover:bg-gray-100 rounded-md transition-colors" title="Alejar">
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
        <!-- Sidebar con herramientas UML -->
        <div class="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-medium text-gray-900">Herramientas UML</h2>
            </div>

            <!-- Herramientas de navegación -->
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Navegación</h3>
                <button
                    wire:click="selectTool('select')"
                    class="w-full flex items-center space-x-3 p-3 rounded-md border transition-all {{ $selectedTool === 'select' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                    <span class="text-lg">👆</span>
                    <span>Seleccionar</span>
                </button>
            </div>

            <!-- Elementos UML -->
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Elementos</h3>
                <div class="space-y-2">
                    <button
                        wire:click="selectTool('class')"
                        class="w-full flex items-center space-x-3 p-3 rounded-md border transition-all {{ $selectedTool === 'class' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">📦</span>
                        <span>Clase</span>
                    </button>
                </div>
            </div>

            <!-- Relaciones UML -->
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Relaciones</h3>
                <div class="space-y-2">
                    <button
                        wire:click="selectTool('association')"
                        class="w-full flex items-center space-x-3 p-3 rounded-md border transition-all {{ $selectedTool === 'association' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">↔️</span>
                        <span>Asociación</span>
                    </button>

                    <button
                        wire:click="selectTool('inheritance')"
                        class="w-full flex items-center space-x-3 p-3 rounded-md border transition-all {{ $selectedTool === 'inheritance' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">⬆️</span>
                        <span>Herencia</span>
                    </button>

                    <button
                        wire:click="selectTool('aggregation')"
                        class="w-full flex items-center space-x-3 p-3 rounded-md border transition-all {{ $selectedTool === 'aggregation' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">◇</span>
                        <span>Agregación</span>
                    </button>

                    <button
                        wire:click="selectTool('composition')"
                        class="w-full flex items-center space-x-3 p-3 rounded-md border transition-all {{ $selectedTool === 'composition' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">◆</span>
                        <span>Composición</span>
                    </button>
                </div>
            </div>

            <!-- Información contextual -->
            <div class="p-4 flex-1">
                <div class="bg-blue-50 rounded-lg p-3">
                    <h4 class="text-sm font-medium text-blue-900 mb-2">
                        {{ $tools[$selectedTool] ?? $selectedTool }}
                    </h4>

                    <div class="text-xs text-blue-700">
                        @if($selectedTool === 'select')
                            <p>• Haz clic para seleccionar elementos</p>
                            <p>• Arrastra para mover elementos</p>
                            <p>• Usa la rueda del ratón para zoom</p>
                        @elseif($selectedTool === 'class')
                            <p>• Haz clic en el canvas para crear una clase</p>
                            <p>• Se abrirá un prompt para el nombre</p>
                        @else
                            <p>• Selecciona el primer elemento</p>
                            <p>• Luego selecciona el segundo elemento</p>
                            <p>• Se creará la relación automáticamente</p>
                        @endif
                    </div>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-200">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Atajos de teclado</h4>
                    <div class="text-xs text-gray-500 space-y-1">
                        <div class="flex justify-between">
                            <span>Guardar</span>
                            <code class="bg-gray-100 px-1 rounded">Ctrl+S</code>
                        </div>
                        <div class="flex justify-between">
                            <span>Zoom</span>
                            <code class="bg-gray-100 px-1 rounded">Scroll</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Canvas principal -->
        <div class="flex-1 relative">
            <div
                id="paper-container"
                class="w-full h-full bg-gray-50"
                style="min-height: 600px;">
                <!-- JointJS se renderizará aquí -->
            </div>

            <!-- Loading overlay -->
            <div
                wire:loading
                class="absolute inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center z-10">
                <div class="bg-white px-6 py-3 rounded-lg shadow-lg">
                    <div class="flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span class="text-gray-600 font-medium">Procesando...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Notificaciones flash -->
    @if (session()->has('message'))
        <div
            class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-20 transform transition-all"
            x-data="{ show: true }"
            x-show="show"
            x-init="setTimeout(() => show = false, 4000)"
            x-transition:enter="translate-x-full"
            x-transition:enter-start="translate-x-full"
            x-transition:enter-end="translate-x-0"
            x-transition:leave="translate-x-full">
            <div class="flex items-center space-x-2">
                <span class="text-lg">✅</span>
                <span>{{ session('message') }}</span>
            </div>
        </div>
    @endif

    {{-- Datos para JavaScript --}}
    <script>
        // Pasar datos del componente a JavaScript
        window.diagramData = @json($diagramData);
        window.selectedTool = @json($selectedTool);
    </script>
</div>
