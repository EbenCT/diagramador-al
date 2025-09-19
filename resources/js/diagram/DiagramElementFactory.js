// resources/js/diagram/DiagramElementFactory.js - EXTENSIÓN UML 2.5
// Mantiene retrocompatibilidad completa pero agrega soporte opcional para UML 2.5

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
            ],
            // NUEVOS: Estereotipos UML 2.5
            uml25Stereotypes: {
                'entity': '<<entity>>',
                'enumeration': '<<enumeration>>',
                'datatype': '<<datatype>>',
                'service': '<<service>>',
                'repository': '<<repository>>',
                'controller': '<<controller>>',
                'utility': '<<utility>>'
            }
        };
    }

    // ==================== ANÁLISIS DE DATOS UML 2.5 ====================

    /**
     * Verifica si un elemento usa características UML 2.5
     */
    isUML25Element(umlData) {
        return !!(umlData.uml25 && Object.keys(umlData.uml25).length > 0);
    }

    /**
     * Obtiene la configuración UML 2.5 con valores por defecto
     */
    getUML25Config(umlData) {
        return {
            stereotype: umlData.uml25?.stereotype || null,
            derivedAttributes: umlData.uml25?.derivedAttributes || [],
            responsibilities: umlData.uml25?.responsibilities || [],
            constraints: umlData.uml25?.constraints || [],
            extendedVisibility: umlData.uml25?.extendedVisibility || false,
            multiplicities: umlData.uml25?.multiplicities || {}
        };
    }

    // ==================== MÉTODOS DE CÁLCULO EXTENDIDOS ====================

    calculateElementDimensions(className, attributes, methods, type, uml25Config = null) {
        const maxLineLength = Math.max(
            className.length,
            ...attributes.map(attr => attr.length),
            ...methods.map(method => method.length),
            // NUEVO: Considerar responsibilities y constraints si existen
            ...(uml25Config?.responsibilities || []).map(resp => resp.length),
            ...(uml25Config?.constraints || []).map(constraint => constraint.length)
        );
        const width = Math.max(200, maxLineLength * 8 + 30);

        const totalLines = 1 + // nombre de clase
                           (type === 'interface' ? 1 : 0) + // estereotipo interface
                           (uml25Config?.stereotype ? 1 : 0) + // NUEVO: estereotipo UML 2.5
                           attributes.length + // atributos
                           methods.length + // métodos
                           (uml25Config?.responsibilities?.length || 0) + // NUEVO: responsabilidades
                           (uml25Config?.constraints?.length || 0); // NUEVO: restricciones

        const height = Math.max(120, totalLines * 16 + 60); // +10px más de padding para UML 2.5

        return { width, height };
    }

    getElementColors(type, uml25Config = null) {
        // Colores especiales para estereotipos UML 2.5
        if (uml25Config?.stereotype) {
            const stereotypeColors = {
                'entity': { fill: '#fef3c7', stroke: '#f59e0b', textColor: '#92400e' },
                'enumeration': { fill: '#f3e8ff', stroke: '#8b5cf6', textColor: '#6b21a8' },
                'datatype': { fill: '#ecfdf5', stroke: '#10b981', textColor: '#065f46' },
                'service': { fill: '#eff6ff', stroke: '#3b82f6', textColor: '#1e40af' },
                'repository': { fill: '#f0fdf4', stroke: '#22c55e', textColor: '#15803d' },
                'controller': { fill: '#fefce8', stroke: '#eab308', textColor: '#a16207' },
                'utility': { fill: '#f8fafc', stroke: '#6b7280', textColor: '#374151' }
            };

            return stereotypeColors[uml25Config.stereotype] || this.getDefaultColors(type);
        }

        return this.getDefaultColors(type);
    }

    getDefaultColors(type) {
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
        if (text.startsWith('~')) return '#7c3aed'; // package - violeta (UML 2.5)
        if (text.startsWith('/')) return '#0891b2'; // derivado - azul cian (UML 2.5)
        return '#374151'; // default - gris
    }

    // ==================== CONSTRUCCIÓN DE TEXTO SVG EXTENDIDA ====================

    buildTextElements(className, attributes, methods, type, width, uml25Config = null) {
        const elements = [];
        let currentY = 0;
        const lineHeight = 16;

        // NUEVO: Estereotipo UML 2.5 (más prioritario que interface)
        if (uml25Config?.stereotype) {
            elements.push({
                tagName: 'tspan',
                attributes: {
                    x: width / 2,
                    dy: currentY === 0 ? 0 : lineHeight,
                    'font-style': 'italic',
                    'font-size': '10px',
                    'text-anchor': 'middle',
                    'fill': '#6b7280'
                },
                textContent: this.umlTemplates.uml25Stereotypes[uml25Config.stereotype]
            });
            currentY += lineHeight;
        }

        // Estereotipo interface (solo si no hay estereotipo UML 2.5)
        if (type === 'interface' && !uml25Config?.stereotype) {
            elements.push({
                tagName: 'tspan',
                attributes: {
                    x: width / 2,
                    dy: currentY === 0 ? 0 : lineHeight,
                    'font-style': 'italic',
                    'font-size': '10px',
                    'text-anchor': 'middle'
                },
                textContent: '<<interface>>'
            });
            currentY += lineHeight;
        }

        // Nombre de la clase - CENTRADO
        elements.push({
            tagName: 'tspan',
            attributes: {
                x: width / 2,
                dy: currentY === 0 ? 0 : lineHeight,
                'font-weight': 'bold',
                'font-size': '13px',
                'text-anchor': 'middle'
            },
            textContent: className
        });
        currentY += lineHeight;

        // Atributos - ALINEADOS A LA IZQUIERDA (con soporte para derivados)
        if (attributes.length > 0) {
            attributes.forEach((attr, index) => {
                // NUEVO: Marcar atributos derivados si están en la lista
                const isDerived = uml25Config?.derivedAttributes?.includes(index);
                const displayText = isDerived && !attr.startsWith('/') ? `/${attr}` : attr;

                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,
                        dy: index === 0 ? lineHeight * 2 : lineHeight,
                        fill: this.getColorByVisibility(displayText),
                        'text-anchor': 'start',
                        'font-style': isDerived ? 'italic' : 'normal'
                    },
                    textContent: displayText
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
                        'text-anchor': 'start'
                    },
                    textContent: method
                });
                currentY += lineHeight;
            });
        }

        // NUEVO: Responsabilidades UML 2.5
        if (uml25Config?.responsibilities?.length > 0) {
            uml25Config.responsibilities.forEach((responsibility, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,
                        dy: index === 0 ? lineHeight * 2 : lineHeight,
                        fill: '#6b7280',
                        'text-anchor': 'start',
                        'font-size': '11px',
                        'font-style': 'italic'
                    },
                    textContent: responsibility
                });
                currentY += lineHeight;
            });
        }

        // NUEVO: Restricciones UML 2.5
        if (uml25Config?.constraints?.length > 0) {
            uml25Config.constraints.forEach((constraint, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,
                        dy: index === 0 && uml25Config.responsibilities.length === 0 ? lineHeight * 2 : lineHeight,
                        fill: '#dc2626',
                        'text-anchor': 'start',
                        'font-size': '11px',
                        'font-weight': 'bold'
                    },
                    textContent: constraint
                });
                currentY += lineHeight;
            });
        }

        return elements;
    }

    // ==================== CÁLCULO DE POSICIONES DE LÍNEAS EXTENDIDO ====================

    calculateDividerPositions(type, attributes, methods, width, uml25Config = null) {
        const lineHeight = 16;
        let currentY = 20;

        // Saltar el estereotipo UML 2.5 si existe
        if (uml25Config?.stereotype) {
            currentY += lineHeight;
        }

        // Saltar el estereotipo interface si no hay UML 2.5
        if (type === 'interface' && !uml25Config?.stereotype) {
            currentY += lineHeight;
        }

        // Saltar el nombre de la clase
        currentY += lineHeight;

        // Primera línea divisoria (después del nombre)
        const line1Y = currentY + 5;

        // Segunda línea divisoria (después de atributos, si existen)
        const line2Y = attributes.length > 0 ?
            line1Y + (attributes.length * lineHeight) + lineHeight :
            -100;

        // NUEVA: Tercera línea divisoria (después de métodos, si hay responsabilidades o restricciones)
        const hasUML25Sections = uml25Config?.responsibilities?.length > 0 || uml25Config?.constraints?.length > 0;
        const line3Y = hasUML25Sections && methods.length > 0 ?
            line2Y + (methods.length * lineHeight) + lineHeight :
            -100;

        return {
            line1: {
                x1: 5, y1: line1Y, x2: width - 5, y2: line1Y
            },
            line2: {
                x1: 5, y1: line2Y, x2: width - 5, y2: line2Y,
                display: attributes.length > 0 ? 'block' : 'none'
            },
            // NUEVA: Línea para separar responsabilidades/restricciones
            line3: {
                x1: 5, y1: line3Y, x2: width - 5, y2: line3Y,
                display: hasUML25Sections && methods.length > 0 ? 'block' : 'none'
            }
        };
    }

    // ==================== CREACIÓN COMPLETA DE ELEMENTOS EXTENDIDA ====================

    createClassElement(className, attributes, methods, x, y, type, graph, uml25Config = null) {
        const dimensions = this.calculateElementDimensions(className, attributes, methods, type, uml25Config);
        const colors = this.getElementColors(type, uml25Config);
        const textElements = this.buildTextElements(className, attributes, methods, type, dimensions.width, uml25Config);
        const dividers = this.calculateDividerPositions(type, attributes, methods, dimensions.width, uml25Config);

        // Determinar si necesitamos markup extendido para UML 2.5
        const hasUML25Sections = uml25Config?.responsibilities?.length > 0 || uml25Config?.constraints?.length > 0;

        const markup = [
            { tagName: 'rect', selector: 'body' },
            { tagName: 'text', selector: 'classText', children: textElements },
            { tagName: 'line', selector: 'divider1' },
            { tagName: 'line', selector: 'divider2' }
        ];

        // NUEVO: Agregar tercera línea divisoria si hay secciones UML 2.5
        if (hasUML25Sections) {
            markup.push({ tagName: 'line', selector: 'divider3' });
        }

        const classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - dimensions.width/2, y: y - dimensions.height/2 },
            size: { width: dimensions.width, height: dimensions.height },
            attrs: {
                body: {
                    fill: colors.fill,
                    stroke: colors.stroke,
                    strokeWidth: 2,
                    strokeDasharray: colors.strokeDasharray,
                    rx: 4, ry: 4,
                    filter: {
                        name: 'dropShadow',
                        args: { dx: 2, dy: 2, blur: 4, color: 'rgba(0,0,0,0.15)' }
                    }
                },
                label: { text: '', display: 'none' }
            },
            markup: markup,
            umlData: {
                // Campos existentes (retrocompatibilidad)
                className: className,
                attributes: attributes,
                methods: methods,
                type: type,
                // NUEVO: Configuración UML 2.5 opcional
                ...(uml25Config ? { uml25: uml25Config } : {})
            }
        });

        // Configurar texto
        classElement.attr('classText', {
            x: 15, y: 20, fontSize: 12,
            fontFamily: '"Fira Code", "Consolas", monospace',
            fill: colors.textColor, textAnchor: 'start', dominantBaseline: 'hanging'
        });

        // Configurar líneas divisorias
        classElement.attr({
            'divider1': { ...dividers.line1, stroke: colors.stroke, strokeWidth: 1 },
            'divider2': { ...dividers.line2, stroke: colors.stroke, strokeWidth: 1 }
        });

        // NUEVO: Configurar tercera línea si existe
        if (hasUML25Sections) {
            classElement.attr('divider3', {
                ...dividers.line3, stroke: colors.stroke, strokeWidth: 1
            });
        }

        if (graph) {
            graph.addCell(classElement);
        }

        return classElement;
    }

    // ==================== ACTUALIZACIÓN DE ELEMENTOS EXISTENTES EXTENDIDA ====================

    updateClassElement(element, className, attributes, methods, type, uml25Config = null) {
        const dimensions = this.calculateElementDimensions(className, attributes, methods, type, uml25Config);
        const colors = this.getElementColors(type, uml25Config);
        const textElements = this.buildTextElements(className, attributes, methods, type, dimensions.width, uml25Config);
        const dividers = this.calculateDividerPositions(type, attributes, methods, dimensions.width, uml25Config);

        element.resize(dimensions.width, dimensions.height);

        // Determinar markup necesario
        const hasUML25Sections = uml25Config?.responsibilities?.length > 0 || uml25Config?.constraints?.length > 0;

        const markup = [
            { tagName: 'rect', selector: 'body' },
            { tagName: 'text', selector: 'classText', children: textElements },
            { tagName: 'line', selector: 'divider1' },
            { tagName: 'line', selector: 'divider2' }
        ];

        if (hasUML25Sections) {
            markup.push({ tagName: 'line', selector: 'divider3' });
        }

        element.set('markup', markup);

        // Actualizar configuración del texto
        element.attr('classText', {
            x: 15, y: 20, fontSize: 12,
            fontFamily: '"Fira Code", "Consolas", monospace',
            fill: colors.textColor, textAnchor: 'start', dominantBaseline: 'hanging'
        });

        // Actualizar líneas divisorias
        element.attr({
            'divider1': { ...dividers.line1, stroke: colors.stroke, strokeWidth: 1 },
            'divider2': { ...dividers.line2, stroke: colors.stroke, strokeWidth: 1 }
        });

        if (hasUML25Sections) {
            element.attr('divider3', { ...dividers.line3, stroke: colors.stroke, strokeWidth: 1 });
        }

        // Actualizar datos UML (manteniendo retrocompatibilidad)
        element.set('umlData', {
            className: className,
            attributes: attributes,
            methods: methods,
            type: type,
            ...(uml25Config ? { uml25: uml25Config } : {})
        });

        return element;
    }

    // ==================== MÉTODOS PARA RELACIONES (INALTERADOS) ====================

    getRelationshipAttrs(type) {
        const baseAttrs = {
            line: { stroke: '#1e40af', strokeWidth: 2.5 }
        };

        switch(type) {
            case 'inheritance':
                baseAttrs.line.targetMarker = {
                    type: 'path', d: 'M 20 -12 L 0 0 L 20 12 Z',
                    fill: 'white', stroke: '#1e40af', strokeWidth: 2.5
                };
                break;
            case 'aggregation':
                baseAttrs.line.sourceMarker = {
                    type: 'path', d: 'M 24 -10 12 0 24 10 36 0 z',
                    fill: 'white', stroke: '#1e40af', strokeWidth: 2.5
                };
                baseAttrs.line.targetMarker = {
                    type: 'path', d: 'M 12 -6 0 0 12 6',
                    stroke: '#1e40af', fill: 'none', strokeWidth: 2.5
                };
                break;
            case 'composition':
                baseAttrs.line.sourceMarker = {
                    type: 'path', d: 'M 24 -10 12 0 24 10 36 0 z',
                    fill: '#1e40af', stroke: '#1e40af', strokeWidth: 2.5
                };
                baseAttrs.line.targetMarker = {
                    type: 'path', d: 'M 12 -6 0 0 12 6',
                    stroke: '#1e40af', fill: 'none', strokeWidth: 2.5
                };
                break;
            case 'association':
            default:
                baseAttrs.line.targetMarker = {
                    type: 'path', d: 'M 12 -6 0 0 12 6',
                    stroke: '#1e40af', fill: 'none', strokeWidth: 2.5
                };
                break;
        }

        return baseAttrs;
    }
}
