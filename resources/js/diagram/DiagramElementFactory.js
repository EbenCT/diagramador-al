// resources/js/diagram/DiagramElementFactory.js
// Clase factorizada que contiene todos los métodos compartidos para crear elementos UML

import * as joint from 'jointjs';

export class DiagramElementFactory {
    constructor() {
        this.umlTemplates = {
            visibility: {
                '+': 'public',
                '-': 'private',
                '#': 'protected',
                '~': 'package'
            },
            commonTypes: [
                'String', 'int', 'boolean', 'double', 'float', 'long', 'char',
                'Date', 'LocalDateTime', 'BigDecimal', 'List<>', 'Set<>', 'Map<,>'
            ]
        };
    }

    // ==================== MÉTODOS DE CÁLCULO DE DIMENSIONES ====================
    
    calculateElementDimensions(className, attributes, methods, type) {
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

        return { width, height };
    }

    // ==================== MÉTODOS DE CONFIGURACIÓN DE COLORES ====================

    getElementColors(type) {
        return type === 'interface' ? {
            fill: '#faf5ff',
            stroke: '#7c3aed',
            strokeDasharray: '8,4',
            textColor: '#7c3aed'
        } : {
            fill: '#ffffff',
            stroke: '#333333',
            strokeDasharray: 'none',
            textColor: '#1e40af'
        };
    }

    getColorByVisibility(text) {
        if (text.startsWith('+')) return '#059669'; // public - verde
        if (text.startsWith('-')) return '#dc2626'; // private - rojo
        if (text.startsWith('#')) return '#d97706'; // protected - naranja
        if (text.startsWith('~')) return '#7c3aed'; // package - violeta
        return '#374151'; // default - gris
    }

    // ==================== CONSTRUCCIÓN DE TEXTO SVG ====================

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
                'font-size': '13px',
                'text-anchor': 'middle'  // Centrado
            },
            textContent: className
        });
        currentY += lineHeight;

        // Atributos - ALINEADOS A LA IZQUIERDA
        if (attributes.length > 0) {
            attributes.forEach((attr, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,
                        dy: index === 0 ? lineHeight * 2 : lineHeight, // Doble espaciado en el primer atributo
                        fill: this.getColorByVisibility(attr),
                        'text-anchor': 'start'  // Alineación izquierda
                    },
                    textContent: attr
                });
                currentY += lineHeight;
            });
        }

        // Métodos - ALINEADOS A LA IZQUIERDA
        if (methods.length > 0) {
            methods.forEach((method, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,
                        dy: index === 0 ? 
                            (attributes.length > 0 ? lineHeight * 2 : lineHeight * 2) : lineHeight,
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

    // ==================== CÁLCULO DE POSICIONES DE LÍNEAS ====================

    calculateDividerPositions(type, attributes, width) {
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

        return {
            line1: {
                x1: 5,
                y1: line1Y,
                x2: width - 5,
                y2: line1Y
            },
            line2: {
                x1: 5,
                y1: line2Y,
                x2: width - 5,
                y2: line2Y,
                display: attributes.length > 0 ? 'block' : 'none'
            }
        };
    }

    // ==================== CREACIÓN COMPLETA DE ELEMENTOS ====================

    createClassElement(className, attributes, methods, x, y, type, graph) {
        const dimensions = this.calculateElementDimensions(className, attributes, methods, type);
        const colors = this.getElementColors(type);
        const textElements = this.buildTextElements(className, attributes, methods, type, dimensions.width);
        const dividers = this.calculateDividerPositions(type, attributes, dimensions.width);

        // Crear elemento con markup que incluye líneas SVG
        const classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - dimensions.width/2, y: y - dimensions.height/2 },
            size: { width: dimensions.width, height: dimensions.height },
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
            umlData: {
                className: className,
                attributes: attributes,
                methods: methods,
                type: type
            }
        });

        // Configurar texto
        classElement.attr('classText', {
            x: 15,
            y: 20,
            fontSize: 12,
            fontFamily: '"Fira Code", "Consolas", monospace',
            fill: colors.textColor,
            textAnchor: 'start',
            dominantBaseline: 'hanging'
        });

        // Configurar líneas divisorias
        classElement.attr({
            'divider1': {
                ...dividers.line1,
                stroke: colors.stroke,
                strokeWidth: 1
            },
            'divider2': {
                ...dividers.line2,
                stroke: colors.stroke,
                strokeWidth: 1
            }
        });

        if (graph) {
            graph.addCell(classElement);
        }

        return classElement;
    }

    // ==================== ACTUALIZACIÓN DE ELEMENTOS EXISTENTES ====================

    updateClassElement(element, className, attributes, methods, type) {
        const dimensions = this.calculateElementDimensions(className, attributes, methods, type);
        const colors = this.getElementColors(type);
        const textElements = this.buildTextElements(className, attributes, methods, type, dimensions.width);
        const dividers = this.calculateDividerPositions(type, attributes, dimensions.width);

        // Redimensionar elemento
        element.resize(dimensions.width, dimensions.height);

        // Actualizar markup con nuevo texto
        element.set('markup', [
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
        ]);

        // Actualizar configuración del texto
        element.attr('classText', {
            x: 15,
            y: 20,
            fontSize: 12,
            fontFamily: '"Fira Code", "Consolas", monospace',
            fill: colors.textColor,
            textAnchor: 'start',
            dominantBaseline: 'hanging'
        });

        // Actualizar líneas divisorias
        element.attr({
            'divider1': {
                ...dividers.line1,
                stroke: colors.stroke,
                strokeWidth: 1
            },
            'divider2': {
                ...dividers.line2,
                stroke: colors.stroke,
                strokeWidth: 1
            }
        });

        // Actualizar datos UML
        element.set('umlData', {
            className: className,
            attributes: attributes,
            methods: methods,
            type: type
        });

        return element;
    }

    // ==================== MÉTODOS PARA RELACIONES ====================

    getRelationshipAttrs(type) {
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
}