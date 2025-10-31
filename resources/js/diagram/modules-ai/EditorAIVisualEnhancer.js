// resources/js/diagram/modules-ai/EditorAIVisualEnhancer.js
// Mejora visual de elementos creados por IA y efectos de preview

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

        console.log(`✨ Mejorando visual de clase: ${element.get('umlData')?.className}`);

        // APLICAR ESTILOS INMEDIATAMENTE (como hace el analizador)
        if (isPreview) {
            this.applyPreviewStyles(element);
        } else {
            this.applyNewClassStyles(element);
        }

        // FORZAR ACTUALIZACIÓN VISUAL
        element.trigger('change:attrs');

        // Agregar animación de entrada
        this.animateElementEntry(element);

        // Marcar como mejorado
        this.enhancedElements.add(element.id);
    }

    applyNewClassStyles(element) {
        console.log('🎨 Aplicando estilos mejorados...');

        // ESTILOS SIMILARES A LOS DEL ANALIZADOR
        element.attr({
            body: {
                fill: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                stroke: '#0ea5e9',
                strokeWidth: 3,
                rx: 12,
                ry: 12,
                filter: {
                    name: 'dropShadow',
                    args: {
                        dx: 0,
                        dy: 4,
                        blur: 12,
                        color: 'rgba(14, 165, 233, 0.4)'
                    }
                }
            },
            header: {
                fill: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                stroke: '#0284c7',
                rx: 12,
                ry: 12
            },
            headerText: {
                fill: 'white',
                fontWeight: '700',
                fontSize: '14px'
            },
            '.uml-class-attrs-text': {
                fontSize: '12px',
                fill: '#1e293b'
            },
            '.uml-class-methods-text': {
                fontSize: '12px',
                fill: '#1e293b'
            }
        });

        // FORZAR REDIBUJADO
        element.trigger('change:attrs');

        console.log('✅ Estilos aplicados correctamente');
    }

    applyPreviewStyles(element) {
        // Estilo para preview de clases
        element.attr({
            body: {
                fill: 'rgba(139, 92, 246, 0.1)',
                stroke: '#8b5cf6',
                strokeWidth: 2,
                strokeDasharray: '8,4',
                opacity: 0.8,
                rx: 8,
                ry: 8
            },
            header: {
                fill: 'rgba(139, 92, 246, 0.2)',
                stroke: '#8b5cf6',
                strokeDasharray: '8,4'
            },
            headerText: {
                fill: '#6b21a8',
                fontStyle: 'italic'
            }
        });
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

        // Animación de entrada con rebote
        element.attr('body/transform', 'scale(0.8)');
        element.attr('body/opacity', 0.5);

        setTimeout(() => {
            element.transition('attrs/body/transform', 'scale(1.05)', {
                duration: 200,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
            element.transition('attrs/body/opacity', 1, {
                duration: 200,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });

            // Segundo rebote
            setTimeout(() => {
                element.transition('attrs/body/transform', 'scale(1)', {
                    duration: 150,
                    timingFunction: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
                });
            }, 200);
        }, 50);
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
            return umlData?.className === className;
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
