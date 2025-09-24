// resources/js/app.js - VERSIÓN CON FUNCIONES GLOBALES AGREGADAS
import './bootstrap';

// Solo importar el editor, SIN shapes personalizadas
import { UMLDiagramEditor } from './diagram/editor.js';

console.log('🚀 App JavaScript iniciado');

// Inicialización cuando DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando editor...');

    var container = document.getElementById('paper-container');
    if (container) {
        try {
            console.log('🔧 Inicializando UMLDiagramEditor...');

            var editor = new UMLDiagramEditor();

            // Hacer disponible globalmente
            window.DiagramEditor = {
                instance: editor,
                debug: function() {
                    return editor.getState();
                }
            };

            // NUEVAS LÍNEAS AGREGADAS - PASO 3:
            // Hacer el editor disponible globalmente para las funciones de eliminación
            window.umlEditor = editor;
            window.diagramEditor = editor;
            // Función global para eliminar clases (necesaria para el botón X)
            window.deleteClass = function(elementId) {
                if (window.umlEditor && window.umlEditor.graph) {
                    const element = window.umlEditor.graph.getCell(elementId);
                    if (element) {
                        const classDiv = document.getElementById(`class-overlay-${elementId}`);
                        if (classDiv) {
                            classDiv.classList.add('removing');
                            setTimeout(() => {
                                element.remove();
                            }, 300);
                        } else {
                            element.remove();
                        }
                    }
                }
            };
            // FIN DE LAS NUEVAS LÍNEAS

            // Configurar toolbar DESPUÉS de que el editor esté listo
            setTimeout(function() {
                setupToolbar(editor);
            }, 500);

            console.log('✅ Editor inicializado exitosamente');
            console.log('🔧 Debug disponible en: window.DiagramEditor.debug()');

        } catch (error) {
            console.error('❌ Error inicializando editor:', error);
        }
    } else {
        console.log('ℹ️ Container del editor no encontrado en esta página');
    }
});

// Función para configurar toolbar nativo
function setupToolbar(editor) {
    console.log('🔧 Configurando toolbar...');

    var toolbarContainer = document.getElementById('js-toolbar');
    if (!toolbarContainer) {
        console.warn('⚠️ Container js-toolbar no encontrado');
        return;
    }

    // Ocultar mensaje de carga
    var loadingMsg = document.getElementById('loading-toolbar');
    if (loadingMsg) {
        loadingMsg.style.display = 'none';
    }

    var tools = [
        { id: 'select', icon: '👆', label: 'Seleccionar', shortcut: '1' },
        { id: 'class', icon: '📦', label: 'Clase', shortcut: '2' },
        { id: 'association', icon: '↔️', label: 'Asociación', shortcut: '3' },
        { id: 'inheritance', icon: '⬆️', label: 'Herencia', shortcut: '4' },
        { id: 'aggregation', icon: '◇', label: 'Agregación', shortcut: '5' },
        { id: 'composition', icon: '♦️', label: 'Composición', shortcut: '6' }
    ];

    var toolbarHtml = '<div class="flex flex-col space-y-2 p-4">';

    tools.forEach(function(tool) {
        var activeClass = editor.selectedTool === tool.id ?
            'border-blue-500 bg-blue-50 text-blue-700' :
            'border-gray-200 hover:bg-gray-50';

        toolbarHtml += '<button onclick="selectEditorTool(\'' + tool.id + '\')" ' +
            'class="flex items-center space-x-3 p-3 rounded-md border transition-all w-full text-left ' + activeClass + '" ' +
            'data-tool="' + tool.id + '">' +
            '<span class="text-lg">' + tool.icon + '</span>' +
            '<span class="flex-1">' + tool.label + '</span>' +
            '<code class="text-xs bg-gray-100 px-1 rounded">' + tool.shortcut + '</code>' +
            '</button>';
    });

    toolbarHtml += '</div>';

    toolbarContainer.innerHTML = toolbarHtml;

    console.log('✅ Toolbar configurado');
}

// Función global para seleccionar herramienta
window.selectEditorTool = function(tool) {
    if (window.DiagramEditor && window.DiagramEditor.instance) {
        window.DiagramEditor.instance.selectTool(tool);

        // Actualizar botones visualmente
        var buttons = document.querySelectorAll('button[data-tool]');
        buttons.forEach(function(button) {
            var isActive = button.getAttribute('data-tool') === tool;
            button.className = 'flex items-center space-x-3 p-3 rounded-md border transition-all w-full text-left ' + (
                isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
            );
        });

        console.log('🔧 Tool seleccionado desde toolbar:', tool);
    } else {
        console.error('❌ Editor no disponible');
    }
};

// Función de debugging global
window.debugEditor = function() {
    console.log('🔍 Debug del Editor:');
    console.log('- Editor disponible:', !!window.DiagramEditor?.instance);
    console.log('- JointJS disponible:', !!window.joint);
    console.log('- Shapes estándar disponibles:', !!window.joint?.shapes?.standard);
    console.log('- Livewire disponible:', !!window.Livewire);

    if (window.DiagramEditor?.instance) {
        console.log('- Estado del editor:', window.DiagramEditor.instance.getState());
    }
};

console.log('✅ App JavaScript configurado completamente');
