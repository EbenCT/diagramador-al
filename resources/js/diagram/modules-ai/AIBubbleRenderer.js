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

    // ✅ NUEVO: Detectar si el texto es largo
    const isLongText = bubbleData.message.length > 80;
    const truncatedMessage = isLongText ?
        bubbleData.message.substring(0, 80) + '...' :
        bubbleData.message;

    const bubbleElement = document.createElement('div');
    bubbleElement.id = bubbleId;
    bubbleElement.className = `ai-bubble ai-bubble-${bubbleData.type} ai-bubble-draggable`;
    bubbleElement.innerHTML = `
        <div class="ai-bubble-header" data-bubble-id="${bubbleId}">
            <div class="ai-bubble-drag-handle">⋮⋮</div>
            <button class="ai-bubble-close" onclick="this.closest('.ai-bubble').remove(); window.aiCurrentInstance.removeBubbleReference('${bubbleId}')">×</button>
        </div>
        <div class="ai-bubble-content">
            <div class="ai-bubble-icon">${this.getBubbleIcon(bubbleData.type)}</div>
            <div class="ai-bubble-text-container">
                <div class="ai-bubble-text" id="text-${bubbleId}">
                    <span class="ai-bubble-text-content">${truncatedMessage}</span>
                    ${isLongText ? `
                        <button class="ai-bubble-expand-btn" onclick="window.aiCurrentInstance.toggleBubbleText('${bubbleId}', \`${bubbleData.message.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                            ver más
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        <div class="ai-bubble-arrow"></div>
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
        cursor: move;
        z-index: 201;
    `;

    this.bubbleContainer.appendChild(bubbleElement);

    // ✅ NUEVO: Hacer la burbuja arrastrable
    this.makeBubbleDraggable(bubbleElement, bubbleId);

    // Animar entrada
    setTimeout(() => {
        bubbleElement.style.opacity = '1';
        bubbleElement.style.transform = 'translateY(0) scale(1)';
    }, 10);

    // Guardar referencia con datos completos
    this.activeBubbles.set(bubbleId, {
        element: bubbleElement,
        data: bubbleData,
        timestamp: Date.now(),
        isExpanded: false,
        originalMessage: bubbleData.message,
        truncatedMessage: truncatedMessage
    });

    // Hacer disponible globalmente
    window.aiCurrentInstance = this;

    console.log(`💬 Burbuja "${bubbleData.type}" creada en posición:`, position);
}

makeBubbleDraggable(bubbleElement, bubbleId) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    const header = bubbleElement.querySelector('.ai-bubble-header');

    header.addEventListener('mousedown', (e) => {
        // Solo permitir drag desde el handle
        if (!e.target.classList.contains('ai-bubble-drag-handle') &&
            !e.target.classList.contains('ai-bubble-header')) {
            return;
        }

        isDragging = true;
        const rect = bubbleElement.getBoundingClientRect();
        const containerRect = this.bubbleContainer.getBoundingClientRect();

        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        bubbleElement.style.cursor = 'grabbing';
        bubbleElement.style.zIndex = '210'; // Traer al frente

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const containerRect = this.bubbleContainer.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - dragOffset.x;
        let newY = e.clientY - containerRect.top - dragOffset.y;

        // Limitar dentro del container
        const bubbleRect = bubbleElement.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, containerRect.width - bubbleRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - bubbleRect.height));

        bubbleElement.style.left = newX + 'px';
        bubbleElement.style.top = newY + 'px';
        bubbleElement.style.transition = 'none'; // Disable transition while dragging
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            bubbleElement.style.cursor = 'move';
            bubbleElement.style.zIndex = '201';
            bubbleElement.style.transition = 'all 0.3s ease'; // Re-enable transition
        }
    });
}

toggleBubbleText(bubbleId, fullMessage) {
    const bubble = this.activeBubbles.get(bubbleId);
    if (!bubble) return;

    const textElement = document.querySelector(`#text-${bubbleId} .ai-bubble-text-content`);
    const expandBtn = document.querySelector(`#text-${bubbleId} .ai-bubble-expand-btn`);

    if (!textElement || !expandBtn) return;

    bubble.isExpanded = !bubble.isExpanded;

    if (bubble.isExpanded) {
        textElement.textContent = fullMessage;
        expandBtn.textContent = 'ver menos';
        bubble.element.classList.add('ai-bubble-expanded');
    } else {
        textElement.textContent = bubble.truncatedMessage;
        expandBtn.textContent = 'ver más';
        bubble.element.classList.remove('ai-bubble-expanded');
    }
}

    removeBubbleReference(bubbleId) {
    this.activeBubbles.delete(bubbleId);
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

    // ✅ MEJORAR distribución - evitar superposición con mini-panel
    const gridCols = 2;
    const col = bubbleCount % gridCols;
    const row = Math.floor(bubbleCount / gridCols);

    // Posicionar en lado izquierdo para evitar conflicto con mini-panel IA
    const baseX = 20 + (col * 260); // 260px de ancho por columna
    const baseY = 20 + (row * 120); // 120px de alto por fila

    return {
        x: Math.min(baseX, Math.max(paperRect.width - 280 - 300, 20)), // Dejar espacio para mini-panel
        y: Math.min(baseY, paperRect.height - 100)
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

    // Animar salida de todas las burbujas
    this.activeBubbles.forEach((bubble, bubbleId) => {
        const element = bubble.element;
        if (element && element.parentNode) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px) scale(0.95)';

            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
    });

    // Limpiar referencias
    this.activeBubbles.clear();
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
        /* Estilos base de burbuja - MEJORADOS PARA DRAG & DROP */
        .ai-bubble-draggable {
            max-width: 280px;
            min-width: 220px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
            position: relative;
            z-index: 201;
            cursor: move;
            user-select: none;
            transition: all 0.3s ease;
        }

        .ai-bubble-draggable:hover {
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            transform: translateY(-1px);
        }

        /* ✅ NUEVO: Header con drag handle */
        .ai-bubble-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px 4px 12px;
            border-bottom: 1px solid #f3f4f6;
            cursor: grab;
        }

        .ai-bubble-header:active {
            cursor: grabbing;
        }

        .ai-bubble-drag-handle {
            color: #9ca3af;
            font-size: 12px;
            cursor: grab;
            padding: 2px 4px;
            border-radius: 3px;
            transition: all 0.2s;
        }

        .ai-bubble-drag-handle:hover {
            background: #f3f4f6;
            color: #6b7280;
        }

        .ai-bubble-content {
            padding: 12px 16px 16px 16px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .ai-bubble-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .ai-bubble-text-container {
            flex: 1;
        }

        .ai-bubble-text {
            font-size: 13px;
            line-height: 1.5;
            color: #374151;
            word-wrap: break-word;
        }

        /* ✅ NUEVO: Botón expandir */
        .ai-bubble-expand-btn {
            background: none;
            border: none;
            color: #6366f1;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            margin-left: 8px;
            text-decoration: underline;
            padding: 2px 4px;
            border-radius: 3px;
            transition: all 0.2s;
        }

        .ai-bubble-expand-btn:hover {
            background: rgba(99, 102, 241, 0.1);
            color: #4f46e5;
        }

        /* ✅ NUEVO: Estado expandido */
        .ai-bubble-expanded {
            max-width: 350px;
            min-width: 300px;
        }

        .ai-bubble-close {
            background: rgba(0, 0, 0, 0.1);
            border: none;
            color: #6b7280;
            cursor: pointer;
            font-size: 16px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
            font-weight: bold;
        }

        .ai-bubble-close:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            transform: scale(1.1);
        }

        /* Tipos de burbujas con gradientes sutiles */
        .ai-bubble-info {
            border-left: 4px solid #3b82f6;
            background: linear-gradient(135deg, #fff 0%, #f0f9ff 100%);
        }

        .ai-bubble-suggestion {
            border-left: 4px solid #f59e0b;
            background: linear-gradient(135deg, #fff 0%, #fefbf3 100%);
        }

        .ai-bubble-warning {
            border-left: 4px solid #ef4444;
            background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
        }

        .ai-bubble-success {
            border-left: 4px solid #10b981;
            background: linear-gradient(135deg, #fff 0%, #f0fdf4 100%);
        }

        .ai-bubble-change {
            border-left: 4px solid #8b5cf6;
            background: linear-gradient(135deg, #fff 0%, #faf5ff 100%);
        }

        /* Flecha */
        .ai-bubble-arrow {
            position: absolute;
            left: 20px;
            bottom: -8px;
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid white;
            filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
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
