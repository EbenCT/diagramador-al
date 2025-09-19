// resources/js/diagram/DiagramSaveManager.js
// VERSIÓN CON LÍNEAS SVG REALES QUE OCUPAN TODO EL ANCHO Y NOMBRE CENTRADO

import * as joint from 'jointjs';

export class DiagramSaveManager {
    constructor(editor) {
        this.editor = editor;
    }

    saveDiagram() {
        try {
            var jsonData = JSON.stringify(this.editor.graph.toJSON());
            var title = window.currentDiagramTitle ||
                       prompt('📝 Título del diagrama:', 'Mi Diagrama UML');

            if (!title && !window.currentDiagramId) {
                console.log('❌ Guardado cancelado');
                return;
            }

            console.log('💾 Guardando diagrama...');

            if (window.Livewire) {
                window.Livewire.dispatch('save-diagram', [jsonData, title]);
            }

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
                    this.editor.graph.clear();
                    this.recreateElementsFromData(data.cells);
                    this.editor.updateCanvasInfo();

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
                this.editor.graph.clear();
            }
        } else {
            console.log('ℹ️ No hay datos de diagrama para cargar');
        }

        if (window.diagramId) {
            window.currentDiagramId = window.diagramId;
            console.log('🆔 ID del diagrama establecido:', window.currentDiagramId);
        }

        if (window.diagramTitle) {
            window.currentDiagramTitle = window.diagramTitle;
            console.log('📝 Título del diagrama establecido:', window.currentDiagramTitle);
        }
    }

    recreateElementsFromData(cells) {
        var elements = [];
        var links = [];

        cells.forEach(cell => {
            if (cell.type === 'standard.Rectangle') {
                elements.push(cell);
            } else if (cell.type === 'standard.Link') {
                links.push(cell);
            }
        });

        console.log('🔄 Recreando', elements.length, 'elementos y', links.length, 'enlaces');

        elements.forEach(elementData => {
            this.recreateElement(elementData);
        });

        links.forEach(linkData => {
            this.recreateLink(linkData);
        });
    }

    recreateElement(elementData) {
        try {
            var umlData = elementData.umlData || {};
            var position = elementData.position || { x: 100, y: 100 };
            var size = elementData.size || { width: 200, height: 120 };
            var type = umlData.type || 'class';
            var className = umlData.className || 'Clase';
            var attributes = umlData.attributes || [];
            var methods = umlData.methods || [];

            const maxLineLength = Math.max(
                className.length,
                ...attributes.map(attr => attr.length),
                ...methods.map(method => method.length)
            );
            const width = Math.max(200, maxLineLength * 8 + 30);

            const totalLines = 1 +
                               (type === 'interface' ? 1 : 0) +
                               attributes.length +
                               methods.length;
            const height = Math.max(120, totalLines * 16 + 50);

            const textElements = this.buildTextElements(className, attributes, methods, type, width);

            const colors = type === 'interface' ? {
                fill: '#faf5ff',
                stroke: '#7c3aed',
                strokeDasharray: '8,4'
            } : {
                fill: '#ffffff',
                stroke: '#333333',
                strokeDasharray: 'none'
            };

            // Crear elemento con markup que incluye líneas SVG
            const classElement = new joint.shapes.standard.Rectangle({
                id: elementData.id,
                position: position,
                size: { width: width, height: height },
                attrs: {
                    body: {
                        fill: colors.fill,
                        stroke: colors.stroke,
                        strokeWidth: 2,
                        strokeDasharray: colors.strokeDasharray,
                        rx: 4,
                        ry: 4,
                        filter: {
                            name: 'dropShadow',
                            args: {
                                dx: 2,
                                dy: 2,
                                blur: 4,
                                color: 'rgba(0,0,0,0.15)'
                            }
                        }
                    },
                    label: {
                        text: '',
                        display: 'none'
                    }
                },
                markup: [
                    {
                        tagName: 'rect',
                        selector: 'body'
                    },
                    {
                        tagName: 'text',
                        selector: 'classText',
                        children: textElements
                    },
                    {
                        tagName: 'line',
                        selector: 'divider1'
                    },
                    {
                        tagName: 'line',
                        selector: 'divider2'
                    }
                ],
                umlData: umlData
            });

            // Configurar texto - MANTENER POSICIÓN ORIGINAL
            classElement.attr('classText', {
                x: 15,  // Mantener posición original
                y: 20,
                fontSize: 12,
                fontFamily: '"Fira Code", "Consolas", monospace',
                fill: type === 'interface' ? '#7c3aed' : '#1e40af',
                textAnchor: 'start',  // Mantener alineación original
                dominantBaseline: 'hanging'
            });

            // Calcular posiciones Y para las líneas divisorias
            const lineHeight = 16;
            let currentY = 20;

            // Saltar el estereotipo si existe
            if (type === 'interface') {
                currentY += lineHeight;
            }

            // Saltar el nombre de la clase
            currentY += lineHeight;

            // Primera línea divisoria (después del nombre)
            const line1Y = currentY + 5;

            // Segunda línea divisoria (después de atributos, si existen)
            const line2Y = attributes.length > 0 ?
                line1Y + (attributes.length * lineHeight) + lineHeight :
                -100; // Fuera de vista si no hay atributos

            // Configurar líneas divisorias que ocupen TODO EL ANCHO
            classElement.attr({
                'divider1': {
                    x1: 5,
                    y1: line1Y,
                    x2: width - 5,  // Todo el ancho del rectángulo
                    y2: line1Y,
                    stroke: type === 'interface' ? '#7c3aed' : '#333333',
                    strokeWidth: 1
                },
                'divider2': {
                    x1: 5,
                    y1: line2Y,
                    x2: width - 5,  // Todo el ancho del rectángulo
                    y2: line2Y,
                    stroke: type === 'interface' ? '#7c3aed' : '#333333',
                    strokeWidth: 1,
                    display: attributes.length > 0 ? 'block' : 'none'
                }
            });

            this.editor.graph.addCell(classElement);
            console.log('✅ Elemento recreado:', umlData.className || 'Sin nombre');

        } catch (error) {
            console.error('❌ Error recreando elemento:', error);
        }
    }

    // Construcción de texto CON NOMBRE CENTRADO PERO SIN CAMBIAR EL PUNTO DE REFERENCIA
    buildTextElements(className, attributes, methods, type, width) {
        const elements = [];
        let currentY = 0;
        const lineHeight = 16;

        // Estereotipo para interfaces - CENTRADO
        if (type === 'interface') {
            elements.push({
                tagName: 'tspan',
                attributes: {
                    x: width / 2,  // Centrar en el ancho del rectángulo
                    dy: currentY === 0 ? 0 : lineHeight,
                    'font-style': 'italic',
                    'font-size': '10px',
                    'text-anchor': 'middle'  // Centrado
                },
                textContent: '<<interface>>'
            });
            currentY += lineHeight;
        }

        // Nombre de la clase - CENTRADO
        elements.push({
            tagName: 'tspan',
            attributes: {
                x: width / 2,  // Centrar en el ancho del rectángulo
                dy: currentY === 0 ? 0 : lineHeight,
                'font-weight': 'bold',
                'font-size': '14px',
                'text-anchor': 'middle'  // Centrado
            },
            textContent: className
        });
        currentY += lineHeight;

        // Atributos - ALINEACIÓN IZQUIERDA CON ESPACIADO EXTRA PARA COMPENSAR LA LÍNEA SVG
        if (attributes.length > 0) {
            attributes.forEach((attr, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,  // Mantener posición izquierda normal
                        dy: index === 0 ? lineHeight * 2 : lineHeight,  // Doble espaciado en el primer atributo
                        fill: this.getColorByVisibility(attr),
                        'text-anchor': 'start'  // Alineación izquierda
                    },
                    textContent: attr
                });
                currentY += lineHeight;
            });
        }

        // Métodos - ALINEACIÓN IZQUIERDA CON ESPACIADO EXTRA PARA COMPENSAR LA LÍNEA SVG
        if (methods.length > 0) {
            methods.forEach((method, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,  // Mantener posición izquierda normal
                        dy: index === 0 ? (attributes.length > 0 ? lineHeight * 2 : lineHeight * 2) : lineHeight,  // Doble espaciado en el primer método
                        fill: this.getColorByVisibility(method),
                        'text-anchor': 'start'  // Alineación izquierda
                    },
                    textContent: method
                });
                currentY += lineHeight;
            });
        }

        return elements;
    }

    getColorByVisibility(text) {
        if (text.startsWith('+')) return '#059669';
        if (text.startsWith('-')) return '#dc2626';
        if (text.startsWith('#')) return '#d97706';
        if (text.startsWith('~')) return '#7c3aed';
        return '#374151';
    }

// En DiagramSaveManager.js - Reemplaza el método recreateLink completo:

recreateLink(linkData) {
    try {
        var relationData = linkData.relationData || {};
        var source = linkData.source || {};
        var target = linkData.target || {};
        var labels = linkData.labels || [];

        var sourceElement = this.editor.graph.getCell(source.id);
        var targetElement = this.editor.graph.getCell(target.id);

        if (!sourceElement || !targetElement) {
            console.warn('⚠️ No se pudo recrear enlace: elementos fuente/destino no encontrados');
            return;
        }

        // APLICAR MARKERS MEJORADOS según el tipo
        var attrs = this.getImprovedLinkAttrs(relationData.type);

        var newLink = new joint.shapes.standard.Link({
            id: linkData.id,
            source: source,
            target: target,
            attrs: attrs,
            labels: labels,
            relationData: relationData
        });

        this.editor.graph.addCell(newLink);
        console.log('✅ Enlace recreado con markers mejorados:', relationData.type || 'Sin tipo');

    } catch (e) {
        console.error('❌ Error recreando enlace:', e, linkData);
    }
}

// NUEVO MÉTODO - Agrega después de recreateLink:
getImprovedLinkAttrs(type) {
    const baseAttrs = {
        line: {
            stroke: '#1e40af',
            strokeWidth: 2.5
        }
    };

    switch(type) {
        case 'inheritance':
            baseAttrs.line.targetMarker = {
                type: 'path',
                d: 'M 20 -12 L 0 0 L 20 12 Z', // Triángulo MÁS GRANDE
                fill: 'white',
                stroke: '#1e40af',
                strokeWidth: 2.5
            };
            break;

        case 'aggregation':
            baseAttrs.line.sourceMarker = {
                type: 'path',
                d: 'M 24 -10 12 0 24 10 36 0 z', // Rombo MÁS GRANDE
                fill: 'white',
                stroke: '#1e40af',
                strokeWidth: 2.5
            };
            baseAttrs.line.targetMarker = {
                type: 'path',
                d: 'M 12 -6 0 0 12 6',
                stroke: '#1e40af',
                fill: 'none',
                strokeWidth: 2.5
            };
            break;

        case 'composition':
            baseAttrs.line.sourceMarker = {
                type: 'path',
                d: 'M 24 -10 12 0 24 10 36 0 z', // Rombo MÁS GRANDE
                fill: '#1e40af',
                stroke: '#1e40af',
                strokeWidth: 2.5
            };
            baseAttrs.line.targetMarker = {
                type: 'path',
                d: 'M 12 -6 0 0 12 6',
                stroke: '#1e40af',
                fill: 'none',
                strokeWidth: 2.5
            };
            break;

        case 'association':
        default:
            baseAttrs.line.targetMarker = {
                type: 'path',
                d: 'M 12 -6 0 0 12 6',
                stroke: '#1e40af',
                fill: 'none',
                strokeWidth: 2.5
            };
            break;
    }

    return baseAttrs;
}

    showSaveNotification(message, type) {
        var notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 transition-opacity duration-300 ${
            type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

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

window.saveFromButton = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        window.DiagramEditor.instance.saveManager.saveDiagram();
    } else {
        console.error('❌ Save Manager no disponible');
    }
};
