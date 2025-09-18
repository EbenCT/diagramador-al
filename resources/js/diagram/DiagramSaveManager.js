// resources/js/diagram/DiagramSaveManager.js
// Módulo encargado del guardado y carga de diagramas - TAL COMO ESTABA EN EL EDITOR ORIGINAL

import * as joint from 'jointjs';

export class DiagramSaveManager {
    constructor(editor) {
        this.editor = editor;
    }

    // ==================== GUARDADO Y CARGA MEJORADOS ====================

    saveDiagram() {
        try {
            var jsonData = JSON.stringify(this.editor.graph.toJSON());

            // Obtener título si no está disponible
            var title = window.currentDiagramTitle ||
                       prompt('📝 Título del diagrama:', 'Mi Diagrama UML');

            if (!title && !window.currentDiagramId) {
                console.log('❌ Guardado cancelado');
                return;
            }

            console.log('💾 Guardando diagrama...');

            // Aquí iría la lógica de guardado al servidor via Livewire/AJAX
            if (window.Livewire) {
                window.Livewire.dispatch('save-diagram', [jsonData, title]);
            }

            // Actualizar estado local
            window.currentDiagramTitle = title;
            this.showSaveNotification('💾 Diagrama guardado correctamente', 'success');

            console.log('💾 Diagrama guardado exitosamente');

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.showSaveNotification('❌ Error al guardar el diagrama', 'error');
        }
    }

    loadDiagramData() {
        console.log('🔄 Cargando datos del diagrama...');
        console.log('📊 Datos disponibles:', window.diagramData);

        if (window.diagramData && window.diagramData !== '[]') {
            try {
                var data = JSON.parse(window.diagramData);
                console.log('📋 Datos parseados:', data);

                if (data.cells && data.cells.length > 0) {
                    // Limpiar graph antes de cargar
                    this.editor.graph.clear();

                    // RECREAR ELEMENTOS EN LUGAR DE USAR fromJSON()
                    this.recreateElementsFromData(data.cells);
                    this.editor.updateCanvasInfo();

                    // Ajustar zoom para mostrar todo el diagrama
                    setTimeout(() => {
                        this.editor.zoomManager.zoomToFit();
                    }, 500);

                    console.log('✅ Diagrama cargado con', data.cells.length, 'elementos');
                } else {
                    console.log('ℹ️ No hay elementos en el diagrama');
                }
            } catch (e) {
                console.error('❌ Error cargando diagrama:', e);
                console.error('📊 Datos que causaron error:', window.diagramData);
                // Limpiar datos corruptos
                this.editor.graph.clear();
            }
        } else {
            console.log('ℹ️ No hay datos de diagrama para cargar');
        }

        // Establecer ID del diagrama si está disponible
        if (window.diagramId) {
            window.currentDiagramId = window.diagramId;
            console.log('🆔 ID del diagrama establecido:', window.currentDiagramId);
        }

        if (window.diagramTitle) {
            window.currentDiagramTitle = window.diagramTitle;
            console.log('📝 Título del diagrama establecido:', window.currentDiagramTitle);
        }
    }

    // ==================== RECREACIÓN DE ELEMENTOS ====================

    recreateElementsFromData(cells) {
        var elements = [];
        var links = [];

        // Separar elementos y enlaces
        cells.forEach(cell => {
            if (cell.type === 'standard.Rectangle') {
                elements.push(cell);
            } else if (cell.type === 'standard.Link') {
                links.push(cell);
            }
        });

        console.log('🔄 Recreando', elements.length, 'elementos y', links.length, 'enlaces');

        // Recrear elementos primero
        elements.forEach(elementData => {
            this.recreateElement(elementData);
        });

        // Recrear enlaces después (necesitan que los elementos ya existan)
        links.forEach(linkData => {
            this.recreateLink(linkData);
        });
    }

    recreateElement(elementData) {
        try {
            var umlData = elementData.umlData || {};
            var position = elementData.position || { x: 100, y: 100 };
            var size = elementData.size || { width: 220, height: 120 };
            var attrs = elementData.attrs || {};

            // Recrear elemento con markup correcto y estilo mejorado
            var newElement = new joint.shapes.standard.Rectangle({
                id: elementData.id, // Mantener el ID original
                position: position,
                size: size,
                attrs: {
                    body: {
                        stroke: attrs.body?.stroke || '#1e40af',
                        fill: attrs.body?.fill || '#fefefe',
                        strokeWidth: 2,
                        strokeDasharray: attrs.body?.strokeDasharray || 'none',
                        rx: 4,
                        ry: 4,
                        filter: {
                            name: 'dropShadow',
                            args: {
                                dx: 2,
                                dy: 2,
                                blur: 3,
                                color: 'rgba(0,0,0,0.1)'
                            }
                        }
                    },
                    label: {
                        text: this.buildClassTextImproved(umlData),
                        fontSize: 12,
                        fontFamily: '"Fira Code", "Consolas", monospace',
                        fill: attrs.label?.fill || '#1e40af',
                        textVerticalAnchor: 'top',
                        textAnchor: 'start',
                        x: 12,
                        y: 12,
                        lineHeight: 1.3
                    }
                },
                umlData: umlData
            });

            this.editor.graph.addCell(newElement);
            console.log('✅ Elemento recreado:', umlData.className || 'Sin nombre');

        } catch (error) {
            console.error('❌ Error recreando elemento:', error);
        }
    }

    recreateLink(linkData) {
        try {
            var relationData = linkData.relationData || {};
            var source = linkData.source || {};
            var target = linkData.target || {};
            var attrs = linkData.attrs || {};
            var labels = linkData.labels || [];

            // Verificar que los elementos fuente y destino existen
            var sourceElement = this.editor.graph.getCell(source.id);
            var targetElement = this.editor.graph.getCell(target.id);

            if (!sourceElement || !targetElement) {
                console.warn('⚠️ No se pudo recrear enlace: elementos fuente/destino no encontrados');
                return;
            }

            // Recrear enlace con markup correcto
            var newLink = new joint.shapes.standard.Link({
                id: linkData.id, // Mantener el ID original
                source: source,
                target: target,
                attrs: attrs,
                labels: labels,
                relationData: relationData
            });

            this.editor.graph.addCell(newLink);
            console.log('✅ Enlace recreado:', relationData.type || 'Sin tipo');

        } catch (e) {
            console.error('❌ Error recreando enlace:', e, linkData);
        }
    }

    buildClassTextImproved(umlData) {
        if (!umlData || !umlData.className) {
            return 'Clase Sin Nombre';
        }

        var text = '';

        // Agregar estereotipo para interfaces
        if (umlData.type === 'interface') {
            text = '<<interface>>\n';
        }

        text += umlData.className;

        // Separador visual mejorado
        if (umlData.attributes && umlData.attributes.length > 0) {
            text += '\n' + '─'.repeat(Math.max(umlData.className.length, 20)) + '\n';
            text += umlData.attributes.join('\n');
        }

        // Separador de métodos
        if (umlData.methods && umlData.methods.length > 0) {
            if (umlData.attributes && umlData.attributes.length > 0) {
                text += '\n' + '─'.repeat(Math.max(umlData.className.length, 20)) + '\n';
            } else {
                text += '\n' + '─'.repeat(Math.max(umlData.className.length, 20)) + '\n';
            }
            text += umlData.methods.join('\n');
        }

        return text;
    }

    // ==================== UTILIDADES DE GUARDADO ====================

    showSaveNotification(message, type) {
        // Crear notificación visual simple
        var notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 transition-opacity duration-300 ${
            type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    clearDiagram() {
        if (confirm('¿Estás seguro de que quieres limpiar el diagrama?\n\nEsta acción no se puede deshacer.')) {
            this.editor.graph.clear();
            this.editor.selectedElement = null;
            this.editor.firstElementSelected = null;
            this.editor.updateCanvasInfo();
            console.log('🧹 Diagrama limpiado');
        }
    }

    exportToPNG() {
        console.log('📸 Export a PNG no implementado aún');
        this.showSaveNotification('📸 Export a PNG será implementado próximamente', 'info');
    }
}

// Función global para compatibilidad hacia atrás
window.saveFromButton = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        window.DiagramEditor.instance.saveManager.saveDiagram();
    } else {
        console.error('❌ Save Manager no disponible');
    }
};
