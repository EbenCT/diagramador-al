{{-- resources/views/diagrams/editor.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>
        @if(isset($diagramId))
            Editor UML - {{ config('app.name') }}
        @else
            Nuevo Diagrama - {{ config('app.name') }}
        @endif
    </title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- JointJS CSS -->
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.7.3/joint.css" />

    <!-- Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="font-sans antialiased bg-gray-100">
    <div id="app" class="h-screen flex flex-col">

        {{-- Header con navegación --}}
        <nav class="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    {{-- Logo y navegación --}}
                    <a href="{{ route('diagrams.index') }}" class="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
                        <span class="text-2xl">🏠</span>
                        <span class="font-medium">Mis Diagramas</span>
                    </a>

                    <div class="h-6 w-px bg-gray-300"></div>

                    {{-- Breadcrumb del diagrama actual --}}
                    <div class="flex items-center space-x-2 text-sm">
                        <span class="text-gray-500">Editor UML</span>
                        @if(isset($diagramId))
                            <span class="text-gray-400">→</span>
                            <span class="text-gray-700 font-medium" id="diagram-title-nav">
                                Cargando...
                            </span>
                        @endif
                    </div>
                </div>

                {{-- Usuario y opciones --}}
                <div class="flex items-center space-x-4">
                    {{-- Estado de guardado --}}
                    <div id="save-status" class="flex items-center space-x-2 text-sm">
                        <div class="w-2 h-2 bg-green-500 rounded-full" id="save-indicator"></div>
                        <span id="save-text" class="text-gray-600">Guardado</span>
                    </div>

                    <div class="h-6 w-px bg-gray-300"></div>

                    {{-- Usuario --}}
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-700 text-sm">{{ Auth::user()->name }}</span>
                        <form method="POST" action="{{ route('logout') }}" class="inline">
                            @csrf
                            <button type="submit" class="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                                Salir
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>

        {{-- Editor principal --}}
        <div class="flex-1 flex flex-col min-h-0">
            @livewire('diagram-editor', ['diagramId' => $diagramId ?? null])
        </div>
    </div>

    {{-- Scripts de auto-guardado --}}
    <script>
        // Auto-save functionality
        class AutoSaveManager {
            constructor() {
                this.diagramId = {{ $diagramId ?? 'null' }};
                this.autoSaveInterval = 30000; // 30 segundos
                this.lastSavedData = '';
                this.autoSaveTimer = null;
                this.isAutoSaving = false;

                this.init();
            }

            init() {
                if (this.diagramId) {
                    this.startAutoSave();
                }

                // Escuchar cuando se crea un diagrama nuevo
                window.addEventListener('diagram-created', (event) => {
                    this.diagramId = event.detail.id;
                    this.startAutoSave();
                    this.updateBreadcrumb();
                });

                // Actualizar breadcrumb al cargar
                this.updateBreadcrumb();
            }

            startAutoSave() {
                if (this.autoSaveTimer) {
                    clearInterval(this.autoSaveTimer);
                }

                this.autoSaveTimer = setInterval(() => {
                    this.performAutoSave();
                }, this.autoSaveInterval);

                console.log('🔄 Auto-save iniciado cada', this.autoSaveInterval / 1000, 'segundos');
            }

            async performAutoSave() {
                if (this.isAutoSaving || !this.diagramId || !window.DiagramEditor?.instance) {
                    return;
                }

                try {
                    const editor = window.DiagramEditor.instance;
                    const currentData = JSON.stringify(editor.graph.toJSON());

                    // Solo auto-guardar si hay cambios
                    if (currentData === this.lastSavedData) {
                        return;
                    }

                    this.isAutoSaving = true;
                    this.updateSaveStatus('saving', 'Auto-guardando...');

                    const response = await fetch(`/diagrams/api/${this.diagramId}/autosave`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        },
                        body: JSON.stringify({
                            data: currentData
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.lastSavedData = currentData;
                        this.updateSaveStatus('saved', 'Auto-guardado');
                        console.log('🔄 Auto-save exitoso');
                    } else {
                        throw new Error(result.error || 'Error en auto-save');
                    }

                } catch (error) {
                    console.warn('⚠️ Auto-save falló:', error);
                    this.updateSaveStatus('error', 'Error auto-guardado');
                } finally {
                    this.isAutoSaving = false;
                }
            }

            updateSaveStatus(status, text) {
                const indicator = document.getElementById('save-indicator');
                const textEl = document.getElementById('save-text');

                if (!indicator || !textEl) return;

                switch (status) {
                    case 'saving':
                        indicator.className = 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';
                        break;
                    case 'saved':
                        indicator.className = 'w-2 h-2 bg-green-500 rounded-full';
                        break;
                    case 'error':
                        indicator.className = 'w-2 h-2 bg-red-500 rounded-full';
                        break;
                }

                textEl.textContent = text;
            }

            async updateBreadcrumb() {
                if (!this.diagramId) {
                    const titleEl = document.getElementById('diagram-title-nav');
                    if (titleEl) titleEl.textContent = 'Nuevo Diagrama';
                    return;
                }

                try {
                    const response = await fetch(`/diagrams/api/${this.diagramId}/stats`);
                    const data = await response.json();

                    const titleEl = document.getElementById('diagram-title-nav');
                    if (titleEl && data.title) {
                        titleEl.textContent = data.title;
                        document.title = `${data.title} - Editor UML`;
                    }
                } catch (error) {
                    console.warn('No se pudo cargar el título del diagrama:', error);
                }
            }

            // Método público para forzar guardado
            forceSave() {
                if (this.diagramId && window.DiagramEditor?.instance) {
                    const editor = window.DiagramEditor.instance;
                    const currentData = JSON.stringify(editor.graph.toJSON());

                    // Forzar guardado a través de Livewire
                    window.Livewire.dispatch('save-diagram', [currentData]);
                }
            }

            // Parar auto-save
            stop() {
                if (this.autoSaveTimer) {
                    clearInterval(this.autoSaveTimer);
                    this.autoSaveTimer = null;
                    console.log('🛑 Auto-save detenido');
                }
            }
        }

        // Inicializar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            window.AutoSaveManager = new AutoSaveManager();

            // Atajo de teclado para guardado manual
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    window.AutoSaveManager.forceSave();
                    console.log('💾 Guardado manual activado');
                }
            });
        });

        // Limpiar al cerrar la página
        window.addEventListener('beforeunload', () => {
            if (window.AutoSaveManager) {
                window.AutoSaveManager.stop();
            }
        });
    </script>

    @livewireScripts
    @stack('scripts')
</body>
</html>
