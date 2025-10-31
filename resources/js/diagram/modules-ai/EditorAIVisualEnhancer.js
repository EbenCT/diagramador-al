// resources/js/diagram/modules-ai/EditorAIVisualEnhancer.js
// Mejora visual de elementos creados por IA y efectos de preview

import * as joint from 'jointjs';

export class EditorAIVisualEnhancer {
    constructor(editor) {
        this.editor = editor;
        this.previewElements = new Map();
        this.enhancedElements = new Set();

        this.addEnhancerStyles();
    }

    // ==================== MEJORAR CLASES NUEVAS ====================

    enhanceNewClass(element, isPreview = false) {
        if (!element) {
            console.warn('⚠️ No se recibió elemento para mejorar');
            return;
        }

        console.log(`🔒 ENHANCER COMPLETAMENTE DESHABILITADO para: ${element.get('umlData')?.className}`);
        console.log(`📐 Elemento actual - Tamaño: ${element.size().width}x${element.size().height}`);

        // *** COMPLETAMENTE DESHABILITADO ***
        // NO HACER NADA - DEJAR QUE EL ELEMENTO MANTENGA SUS DIMENSIONES ORIGINALES

        if (isPreview) {
            // Solo para preview aplicar estilos mínimos
            this.applyPreviewStyles(element);
        }

        // Marcar como "mejorado" sin realmente modificar nada
        this.enhancedElements.add(element.id);

        console.log('✅ Elemento mantenido INTACTO sin mejoras para preservar dimensiones');
    }

    applyNewClassStyles(element) {
        console.log('🎨 DESHABILITADO - NO aplicando NINGÚN estilo para mantener dimensiones correctas');

        // *** COMPLETAMENTE DESHABILITADO ***
        // NO TOCAR NADA DEL ELEMENTO - DEJAR INTACTO
        // El DiagramElementFactory ya lo creó perfecto

        console.log('✅ Elemento mantenido INTACTO sin modificaciones');
    }

    applyPreviewStyles(element) {
        // Obtener atributos actuales para mantener estructura
        const currentAttrs = element.attr();

        // PREVIEW MÁS SUTIL - MANTENIENDO ESTRUCTURA BASE
        element.attr({
            body: {
                ...currentAttrs.body, // Mantener todos los estilos base
                fill: 'rgba(139, 92, 246, 0.08)', // Muy sutil
                stroke: '#8b5cf6',
                strokeWidth: 2,
                strokeDasharray: '8,4',
                opacity: 0.9
            },
            // MANTENER LÍNEAS DIVISORIAS EN PREVIEW
            divider1: {
                ...currentAttrs.divider1,
                stroke: '#8b5cf6',
                strokeDasharray: '6,3',
                opacity: 0.7
            },
            divider2: {
                ...currentAttrs.divider2,
                stroke: '#8b5cf6',
                strokeDasharray: '6,3',
                opacity: 0.7
            },
            classText: {
                ...currentAttrs.classText,
                opacity: 0.8 // Solo reducir opacidad, mantener colores originales
            }
        });

        // LÍNEA DIVISORIA 3 SI EXISTE
        if (currentAttrs.divider3) {
            element.attr('divider3', {
                ...currentAttrs.divider3,
                stroke: '#8b5cf6',
                strokeDasharray: '6,3',
                opacity: 0.7
            });
        }
    }

    normalizeClassStyles(element) {
        // Volver a estilos normales gradualmente
        element.transition('attrs/body/fill', '#ffffff', {
            duration: 1000,
            timingFunction: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
        });

        element.transition('attrs/body/stroke', '#1e40af', {
            duration: 1000,
            timingFunction: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
        });

        element.transition('attrs/body/strokeWidth', 2, {
            duration: 1000,
            timingFunction: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
        });

        // Remover filtro gradualmente
        setTimeout(() => {
            element.attr('body/filter', null);
        }, 1000);
    }

    // ==================== ANIMACIONES ====================

    animateElementEntry(element) {
        if (!element) return;

        console.log('🎬 ANIMACIÓN DESHABILITADA - No tocar opacity ni nada');

        // *** COMPLETAMENTE DESHABILITADO ***
        // NO ANIMAR NADA - PODRÍA ESTAR CAUSANDO PROBLEMAS DE DIMENSIONES
    }

    animateElementUpdate(element) {
        if (!element) return;

        // Pulso de actualización más suave
        const originalFill = element.attr('body/fill');
        const originalStroke = element.attr('body/stroke');

        element.attr('body/fill', 'rgba(16, 185, 129, 0.1)');
        element.attr('body/stroke', '#10b981');
        element.attr('body/strokeWidth', 3);

        setTimeout(() => {
            element.transition('attrs/body/fill', originalFill || '#ffffff', {
                duration: 600,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
            element.transition('attrs/body/stroke', originalStroke || '#1e40af', {
                duration: 600,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
            element.transition('attrs/body/strokeWidth', 2, {
                duration: 600,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
        }, 300);
    }

    // ==================== PREVIEW DE CAMBIOS ====================

    showPreview(commands) {
        console.log(`👁️ Mostrando preview de ${commands.length} comandos`);

        commands.forEach((command, index) => {
            setTimeout(() => {
                this.createCommandPreview(command, index);
            }, index * 150);
        });
    }

    createCommandPreview(command, index) {
        switch (command.action) {
            case 'CREATE_CLASS':
                this.previewCreateClass(command, index);
                break;
            case 'ADD_ATTRIBUTE':
                this.previewAddAttribute(command, index);
                break;
            case 'CREATE_RELATION':
                this.previewCreateRelation(command, index);
                break;
            default:
                console.log(`Preview no implementado para: ${command.action}`);
        }
    }

    previewCreateClass(command, index) {
        // Crear elemento fantasma temporal
        const ghostElement = this.editor.classManager.elementFactory.createClassElement(
            `${command.className} (Preview)`,
            command.attributes || [],
            command.methods || [],
            command.position.x,
            command.position.y,
            'class',
            null // No agregar al graph aún
        );

        // Aplicar estilos de preview
        this.applyPreviewStyles(ghostElement);

        // Agregar temporalmente al graph
        this.editor.graph.addCell(ghostElement);

        // Guardar referencia
        this.previewElements.set(`preview-${index}`, {
            element: ghostElement,
            command: command,
            type: 'create_class'
        });

        // Auto-remover después de 5 segundos si no se confirma
        setTimeout(() => {
            if (this.previewElements.has(`preview-${index}`)) {
                ghostElement.remove();
                this.previewElements.delete(`preview-${index}`);
            }
        }, 5000);
    }

    previewAddAttribute(command, index) {
        const targetElement = this.findElementByClassName(command.className);
        if (!targetElement) {
            console.warn(`⚠️ No se encontró clase ${command.className} para preview`);
            return;
        }

        // Crear highlight temporal
        this.highlightAttributeAddition(targetElement, command.attribute);
    }

    previewCreateRelation(command, index) {
        const sourceElement = this.findElementByClassName(command.sourceClass);
        const targetElement = this.findElementByClassName(command.targetClass);

        if (!sourceElement || !targetElement) {
            console.warn(`⚠️ No se encontraron clases para relación preview`);
            return;
        }

        // Crear línea de preview
        const previewLine = this.createPreviewRelation(sourceElement, targetElement, command.relationType);
        if (previewLine) {
            this.editor.graph.addCell(previewLine);
            this.previewElements.set(`preview-relation-${index}`, {
                element: previewLine,
                command: command,
                type: 'create_relation'
            });

            // Auto-remover
            setTimeout(() => {
                if (this.previewElements.has(`preview-relation-${index}`)) {
                    previewLine.remove();
                    this.previewElements.delete(`preview-relation-${index}`);
                }
            }, 5000);
        }
    }

    createPreviewRelation(sourceElement, targetElement, relationType) {
        const link = new joint.shapes.standard.Link({
            source: { id: sourceElement.id },
            target: { id: targetElement.id }
        });

        // Aplicar estilos de preview
        link.attr({
            line: {
                stroke: '#8b5cf6',
                strokeWidth: 2,
                strokeDasharray: '8,4',
                opacity: 0.7
            }
        });

        return link;
    }

    highlightAttributeAddition(element, attribute) {
        // Crear highlight visual temporal
        const originalStroke = element.attr('body/stroke');
        const originalFill = element.attr('body/fill');

        element.attr('body/stroke', '#f59e0b');
        element.attr('body/strokeWidth', 3);
        element.attr('body/fill', 'rgba(245, 158, 11, 0.1)');

        // Mostrar tooltip con el atributo que se agregará
        this.showAttributeTooltip(element, attribute);

        setTimeout(() => {
            element.attr('body/stroke', originalStroke);
            element.attr('body/strokeWidth', 2);
            element.attr('body/fill', originalFill);
        }, 3000);
    }

    showAttributeTooltip(element, attribute) {
        const elementView = this.editor.paper.findViewByModel(element);
        if (!elementView) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'ai-attribute-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">📝 Nuevo Atributo</div>
            <div class="tooltip-content">${this.formatAttribute(attribute)}</div>
        `;

        const elementRect = elementView.el.getBoundingClientRect();
        const paperRect = this.editor.paper.el.getBoundingClientRect();

        tooltip.style.cssText = `
            position: absolute;
            left: ${elementRect.right - paperRect.left + 10}px;
            top: ${elementRect.top - paperRect.top}px;
            background: white;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.3s ease;
        `;

        this.editor.paper.el.appendChild(tooltip);

        // Animar entrada
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(0)';
        }, 50);

        // Auto-remover
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        }, 2500);
    }

    // ==================== UTILIDADES ====================

    findElementByClassName(className) {
        const elements = this.editor.graph.getElements();
        return elements.find(element => {
            const umlData = element.get('umlData');
            return umlData?.className?.toLowerCase() === className?.toLowerCase();
        });
    }

    formatAttribute(attribute) {
        if (typeof attribute === 'string') {
            return `- ${attribute}: String`;
        }

        const visibility = this.getVisibilitySymbol(attribute.visibility || 'private');
        const name = attribute.name || 'newAttribute';
        const type = attribute.type || 'String';

        return `${visibility} ${name}: ${type}`;
    }

    getVisibilitySymbol(visibility) {
        const symbols = {
            'public': '+',
            'private': '-',
            'protected': '#',
            'package': '~'
        };
        return symbols[visibility] || '-';
    }

    clearPreviews() {
        console.log('🧹 Limpiando previews...');

        this.previewElements.forEach((preview, key) => {
            if (preview.element && preview.element.remove) {
                preview.element.remove();
            }
        });

        this.previewElements.clear();
    }

    // ==================== ESTILOS CSS ====================

    addEnhancerStyles() {
        if (document.getElementById('ai-visual-enhancer-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-visual-enhancer-styles';
        styles.textContent = `
            .ai-attribute-tooltip {
                font-family: system-ui, -apple-system, sans-serif;
            }

            .tooltip-header {
                font-weight: 600;
                color: #f59e0b;
                margin-bottom: 4px;
                font-size: 11px;
            }

            .tooltip-content {
                color: #374151;
                font-family: monospace;
                font-size: 11px;
            }

            /* Animación para elementos mejorados */
            .ai-enhanced-element {
                animation: aiElementEnhanced 2s ease-in-out;
            }

            @keyframes aiElementEnhanced {
                0%, 100% {
                    transform: scale(1);
                }
                25% {
                    transform: scale(1.02);
                }
                50% {
                    transform: scale(1.05);
                }
                75% {
                    transform: scale(1.02);
                }
            }
        `;

        document.head.appendChild(styles);
    }
}
