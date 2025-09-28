// resources/js/diagram/modules-ai/AIBubbleRenderer.js
// Renderiza burbujas de diálogo flotantes sobre el canvas con respuestas de IA

export class AIBubbleRenderer {
    constructor(editor) {
        this.editor = editor;
        this.activeBubbles = new Map();
        this.bubbleCounter = 0;
        this.bubbleContainer = null;

        this.initializeBubbleContainer();
    }

    // ==================== INICIALIZACIÓN ====================

    initializeBubbleContainer() {
        // Crear contenedor para burbujas
        this.bubbleContainer = document.createElement('div');
        this.bubbleContainer.className = 'ai-bubble-container';
        this.bubbleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 200;
        `;

        // Agregar al contenedor del paper
        const paperContainer = this.editor.paper.el;
        paperContainer.style.position = 'relative';
        paperContainer.appendChild(this.bubbleContainer);

        console.log('✅ Contenedor de burbujas inicializado');
    }

    // ==================== MOSTRAR BURBUJAS ====================

    showBubbles(bubbles) {
        console.log(`💬 Mostrando ${bubbles.length} burbujas...`);

        bubbles.forEach((bubble, index) => {
            setTimeout(() => {
                this.createBubble(bubble);
            }, index * 300); // Escalonar aparición
        });
    }

    createBubble(bubbleData) {
        const bubbleId = `bubble-${++this.bubbleCounter}`;
        const position = this.calculateBubblePosition(bubbleData);

        const bubbleElement = document.createElement('div');
        bubbleElement.id = bubbleId;
        bubbleElement.className = `ai-bubble ai-bubble-${bubbleData.type}`;
        bubbleElement.innerHTML = `
            <div class="ai-bubble-content">
                <div class="ai-bubble-icon">${this.getBubbleIcon(bubbleData.type)}</div>
                <div class="ai-bubble-text">${bubbleData.message}</div>
            </div>
            <div class="ai-bubble-arrow"></div>
            <button class="ai-bubble-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Posicionar burbuja
        bubbleElement.style.cssText += `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            opacity: 0;
            transform: translateY(10px) scale(0.95);
            transition: all 0.3s ease;
            pointer-events: auto;
        `;

        this.bubbleContainer.appendChild(bubbleElement);

        // Animar entrada
        setTimeout(() => {
            bubbleElement.style.opacity = '1';
            bubbleElement.style.transform = 'translateY(0) scale(1)';
        }, 10);

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            this.removeBubble(bubbleId);
        }, 10000);

        // Guardar referencia
        this.activeBubbles.set(bubbleId, {
            element: bubbleElement,
            data: bubbleData,
            timestamp: Date.now()
        });

        console.log(`💬 Burbuja "${bubbleData.type}" creada en posición:`, position);
    }

    // ==================== POSICIONAMIENTO INTELIGENTE ====================

    calculateBubblePosition(bubbleData) {
        const paperRect = this.editor.paper.el.getBoundingClientRect();
        let targetElement = null;

        // Intentar encontrar elemento relacionado
        if (bubbleData.targetClass) {
            targetElement = this.findElementByClassName(bubbleData.targetClass);
        }

        if (targetElement) {
            // Posicionar cerca del elemento específico
            return this.getPositionNearElement(targetElement);
        } else {
            // Posición inteligente general
            return this.getGeneralPosition();
        }
    }

    findElementByClassName(className) {
        const elements = this.editor.graph.getElements();
        return elements.find(element => {
            const umlData = element.get('umlData');
            return umlData?.className === className;
        });
    }

    getPositionNearElement(element) {
        const elementView = this.editor.paper.findViewByModel(element);
        if (!elementView) return this.getGeneralPosition();

        const elementRect = elementView.el.getBoundingClientRect();
        const paperRect = this.editor.paper.el.getBoundingClientRect();

        // Calcular posición relativa al papel
        const relativeX = elementRect.left - paperRect.left;
        const relativeY = elementRect.top - paperRect.top;

        // Posicionar a la derecha del elemento con offset
        return {
            x: Math.min(relativeX + elementRect.width + 20, paperRect.width - 250),
            y: Math.max(relativeY - 10, 10)
        };
    }

    getGeneralPosition() {
        const paperRect = this.editor.paper.el.getBoundingClientRect();
        const bubbleCount = this.activeBubbles.size;

        // Distribuir burbujas en una cuadrícula imaginaria
        const gridCols = 3;
        const col = bubbleCount % gridCols;
        const row = Math.floor(bubbleCount / gridCols);

        const baseX = 20 + (col * 220); // 220px de ancho por columna
        const baseY = 20 + (row * 100); // 100px de alto por fila

        return {
            x: Math.min(baseX, paperRect.width - 250),
            y: Math.min(baseY, paperRect.height - 80)
        };
    }

    // ==================== TIPOS DE BURBUJAS ====================

    getBubbleIcon(type) {
        const icons = {
            info: 'ℹ️',
            suggestion: '💡',
            warning: '⚠️',
            error: '❌',
            success: '✅',
            change: '🔄'
        };
        return icons[type] || 'ℹ️';
    }

    // ==================== BURBUJAS ESPECIALES ====================

    showErrorBubble(message) {
        const bubbleData = {
            type: 'error',
            message: message,
            targetClass: null
        };
        this.createBubble(bubbleData);
    }

    showSuccessBubble(message) {
        const bubbleData = {
            type: 'success',
            message: message,
            targetClass: null
        };
        this.createBubble(bubbleData);
    }

    showChangeBubble(message, targetClass) {
        const bubbleData = {
            type: 'change',
            message: message,
            targetClass: targetClass
        };
        this.createBubble(bubbleData);
    }

    // ==================== GESTIÓN DE BURBUJAS ====================

    removeBubble(bubbleId) {
        const bubble = this.activeBubbles.get(bubbleId);
        if (!bubble) return;

        const element = bubble.element;

        // Animar salida
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px) scale(0.95)';

        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.activeBubbles.delete(bubbleId);
        }, 300);
    }

    clearBubbles() {
        console.log('🧹 Limpiando todas las burbujas...');

        this.activeBubbles.forEach((bubble, bubbleId) => {
            this.removeBubble(bubbleId);
        });
    }

    // ==================== ANIMACIONES ESPECIALES ====================

    async showSequentialBubbles(bubbles, delay = 500) {
        for (let i = 0; i < bubbles.length; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.createBubble(bubbles[i]);
                    resolve();
                }, i * delay);
            });
        }
    }

    highlightBubble(bubbleId) {
        const bubble = this.activeBubbles.get(bubbleId);
        if (!bubble) return;

        const element = bubble.element;
        element.classList.add('ai-bubble-highlighted');

        setTimeout(() => {
            element.classList.remove('ai-bubble-highlighted');
        }, 2000);
    }

    // ==================== ESTILOS CSS ====================

    static addBubbleStyles() {
        if (document.getElementById('ai-bubble-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-bubble-styles';
        styles.textContent = `
            /* Contenedor base de burbujas */
            .ai-bubble-container {
                font-family: system-ui, -apple-system, sans-serif;
            }

            /* Estilos base de burbuja */
            .ai-bubble {
                max-width: 240px;
                min-width: 180px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border: 1px solid #e5e7eb;
                position: relative;
                z-index: 201;
                animation: aiBubbleFloat 3s ease-in-out infinite;
            }

            .ai-bubble-content {
                padding: 12px 16px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }

            .ai-bubble-icon {
                font-size: 16px;
                flex-shrink: 0;
                margin-top: 2px;
            }

            .ai-bubble-text {
                font-size: 13px;
                line-height: 1.4;
                color: #374151;
                flex: 1;
            }

            .ai-bubble-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 14px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                opacity: 0.7;
            }

            .ai-bubble-close:hover {
                background: #f3f4f6;
                opacity: 1;
            }

            /* Flecha de la burbuja */
            .ai-bubble-arrow {
                position: absolute;
                left: 16px;
                bottom: -8px;
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 8px solid white;
                filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
            }

            /* Tipos de burbujas */
            .ai-bubble-info {
                border-left: 4px solid #3b82f6;
            }

            .ai-bubble-suggestion {
                border-left: 4px solid #f59e0b;
                background: linear-gradient(135deg, #fff 0%, #fefbf3 100%);
            }

            .ai-bubble-warning {
                border-left: 4px solid #ef4444;
                background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
            }

            .ai-bubble-error {
                border-left: 4px solid #dc2626;
                background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
                border-color: #fecaca;
            }

            .ai-bubble-success {
                border-left: 4px solid #10b981;
                background: linear-gradient(135deg, #fff 0%, #f0fdf4 100%);
            }

            .ai-bubble-change {
                border-left: 4px solid #8b5cf6;
                background: linear-gradient(135deg, #fff 0%, #faf5ff 100%);
            }

            /* Estado destacado */
            .ai-bubble-highlighted {
                animation: aiBubbleHighlight 0.6s ease-in-out;
                box-shadow: 0 6px 25px rgba(99, 102, 241, 0.3);
            }

            /* Animaciones */
            @keyframes aiBubbleFloat {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-2px);
                }
            }

            @keyframes aiBubbleHighlight {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
                }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .ai-bubble {
                    max-width: 200px;
                    min-width: 160px;
                }

                .ai-bubble-text {
                    font-size: 12px;
                }
            }

            /* Efectos hover en burbujas */
            .ai-bubble:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            }

            /* Indicador de burbuja nueva */
            .ai-bubble-new {
                animation: aiBubbleEntrance 0.5s ease-out;
            }

            @keyframes aiBubbleEntrance {
                0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.9);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // ==================== UTILIDADES ====================

    getBubbleCount() {
        return this.activeBubbles.size;
    }

    getBubbleById(bubbleId) {
        return this.activeBubbles.get(bubbleId);
    }

    getAllBubbles() {
        return Array.from(this.activeBubbles.values());
    }

    // Método para mostrar progreso de análisis
    showAnalysisProgressBubble(progress) {
        const existingProgress = document.getElementById('progress-bubble');
        if (existingProgress) {
            existingProgress.remove();
        }

        const progressBubble = document.createElement('div');
        progressBubble.id = 'progress-bubble';
        progressBubble.className = 'ai-bubble ai-bubble-info';
        progressBubble.innerHTML = `
            <div class="ai-bubble-content">
                <div class="ai-bubble-icon">🔍</div>
                <div class="ai-bubble-text">
                    Analizando... ${Math.round(progress * 100)}%
                    <div style="width: 100%; height: 4px; background: #f3f4f6; border-radius: 2px; margin-top: 6px; overflow: hidden;">
                        <div style="width: ${progress * 100}%; height: 100%; background: #3b82f6; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
        `;

        progressBubble.style.cssText = `
            position: absolute;
            left: 20px;
            top: 20px;
            opacity: 1;
            pointer-events: auto;
        `;

        this.bubbleContainer.appendChild(progressBubble);

        if (progress >= 1) {
            setTimeout(() => {
                progressBubble.remove();
            }, 1000);
        }
    }
}

// Agregar estilos al cargar el módulo
AIBubbleRenderer.addBubbleStyles();
