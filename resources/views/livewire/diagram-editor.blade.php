<div class="h-screen flex flex-col bg-gray-100">
    <!-- Header/Toolbar -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <h1 class="text-xl font-semibold text-gray-900">{{ $diagramTitle }}</h1>
                <div class="flex items-center space-x-2">
                    <button
                        wire:click="saveDiagram"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        💾 Guardar
                    </button>
                    <button
                        wire:click="clearDiagram"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            <!-- Herramientas principales -->
            <div class="flex items-center space-x-2">
                <button id="zoom-in" class="p-2 hover:bg-gray-100 rounded-md">🔍+</button>
                <button id="zoom-out" class="p-2 hover:bg-gray-100 rounded-md">🔍-</button>
                <button id="zoom-fit" class="p-2 hover:bg-gray-100 rounded-md">⬜</button>
            </div>
        </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar con Paleta de Herramientas -->
        <div class="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-medium text-gray-900">Herramientas</h2>
            </div>

            <!-- Herramientas de Selección -->
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Selección</h3>
                <button
                    wire:click="selectTool('select')"
                    class="w-full flex items-center space-x-2 p-3 rounded-md border {{ $selectedTool === 'select' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
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
                        class="w-full flex items-center space-x-2 p-3 rounded-md border {{ $selectedTool === 'class' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">📋</span>
                        <span>Clase</span>
                </div>
            </div>

            <!-- Relaciones -->
            <div class="p-4">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Relaciones</h3>
                <div class="space-y-2">
                    <button
                        wire:click="selectTool('association')"
                        class="w-full flex items-center space-x-2 p-3 rounded-md border {{ $selectedTool === 'association' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">➡️</span>
                        <span>Asociación</span>
                    </button>
                    <button
                        wire:click="selectTool('inheritance')"
                        class="w-full flex items-center space-x-2 p-3 rounded-md border {{ $selectedTool === 'inheritance' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">🔺</span>
                        <span>Herencia</span>
                    </button>
                    <button
                        wire:click="selectTool('aggregation')"
                        class="w-full flex items-center space-x-2 p-3 rounded-md border {{ $selectedTool === 'aggregation' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">◇</span>
                        <span>Agregación</span>
                    </button>
                    <button
                        wire:click="selectTool('composition')"
                        class="w-full flex items-center space-x-2 p-3 rounded-md border {{ $selectedTool === 'composition' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50' }}">
                        <span class="text-lg">♦️</span>
                        <span>Composición</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Canvas Principal -->
        <div class="flex-1 flex flex-col bg-gray-50">
            <!-- Canvas Container -->
            <div class="flex-1 overflow-hidden relative">
                <!-- Paper JointJS se renderizará aquí -->
                <div id="paper-container" class="w-full h-full">
                    <!-- Grid de fondo -->
                    <div class="absolute inset-0 opacity-20"
                         style="background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px); background-size: 20px 20px;">
                    </div>
                </div>
            </div>

            <!-- Barra de estado -->
            <div class="bg-white border-t border-gray-200 px-4 py-2">
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <span>Herramienta actual: <strong>{{ $tools[$selectedTool] }}</strong></span>
                    <span id="canvas-info">Elementos: 0 | Zoom: 100%</span>
                </div>
            </div>
        </div>
    </div>

    @if (session()->has('message'))
        <div class="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-md shadow-lg z-50">
            {{ session('message') }}
        </div>
    @endif
</div>

@push('scripts')
<script>
    // Datos del diagrama disponibles para JavaScript
    window.diagramData = @json($diagramData);
    window.selectedTool = @json($selectedTool);
</script>
@endpush
