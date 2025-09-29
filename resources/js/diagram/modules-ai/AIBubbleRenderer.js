// resources/js/diagram/modules-ai/AIBubbleRenderer.js
// Renderiza burbujas de diálogo flotantes sobre el canvas con respuestas de IA

export class AIBubbleRenderer {
    constructor(editor) {
        this.editor = editor;
        this.activeBubbles = new Map();
        this.bubbleCounter = 0;
        this.bubbleContainer = null;

        // ✅ NUEVA CONFIGURACIÓN INTELIGENTE
        this.TRUNCATE_CONFIG = {
            SHORT_LIMIT: 150,     // Más caracteres iniciales (vs 80 anterior)
            LONG_LIMIT: 400,      // Solo truncar si es MUY largo
            MOBILE_LIMIT: 100,    // Adaptado para móvil
            WORD_BOUNDARY: true   // Truncar por palabras completas
        };

        this.initializeBubbleContainer();
        AIBubbleRenderer.addBubbleStyles(); // Cargar estilos mejorados
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

        console.log('✅ Contenedor de burbujas inicializado con configuración mejorada');
    }

    // ==================== MOSTRAR BURBUJAS ====================

    showBubbles(bubbles) {
        console.log(`💬 Mostrando ${bubbles.length} burbujas con sistema mejorado...`);

        bubbles.forEach((bubble, index) => {
            setTimeout(() => {
                this.createBubble(bubble);
            }, index * 300); // Escalonar aparición
        });
    }

    // ✅ NUEVA FUNCIÓN: Truncamiento inteligente por palabras
    smartTruncate(text, maxLength, useWordBoundary = true) {
        if (text.length <= maxLength) return { text, wasTruncated: false };

        if (!useWordBoundary) {
            return {
                text: text.substring(0, maxLength) + '...',
                wasTruncated: true
            };
        }

        // Truncar por palabras completas
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        const lastPunctuation = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf(','),
            truncated.lastIndexOf(';')
        );

        // Usar el punto de corte más apropiado
        const cutPoint = Math.max(lastSpace, lastPunctuation);
        const finalText = cutPoint > maxLength * 0.7 ?
            truncated.substring(0, cutPoint) :
            truncated;

        return {
            text: finalText + '...',
            wasTruncated: true
        };
    }

    // ✅ DETECTAR SI ES MÓVIL
    isMobileDevice() {
        return window.innerWidth <= 768;
    }

createBubble(bubbleData) {
    const bubbleId = `bubble-${++this.bubbleCounter}`;
    const position = this.calculateBubblePosition(bubbleData);

    // ✅ LÓGICA MEJORADA: Truncamiento inteligente adaptativo
    const isMobile = this.isMobileDevice();
    const truncateLimit = isMobile ?
        this.TRUNCATE_CONFIG.MOBILE_LIMIT :
        this.TRUNCATE_CONFIG.SHORT_LIMIT;

    const truncateResult = this.smartTruncate(
        bubbleData.message,
        truncateLimit,
        this.TRUNCATE_CONFIG.WORD_BOUNDARY
    );

    const displayMessage = truncateResult.text;
    const showExpandButton = truncateResult.wasTruncated;

    const bubbleElement = document.createElement('div');
    bubbleElement.id = bubbleId;
    bubbleElement.className = `ai-bubble ai-bubble-${bubbleData.type} ai-bubble-draggable`;

    // ✅ HTML MEJORADO con mejor estructura
    bubbleElement.innerHTML = `
        <div class="ai-bubble-header" data-bubble-id="${bubbleId}">
            <div class="ai-bubble-drag-handle" title="Arrastra para mover">⋮⋮</div>
            <button class="ai-bubble-close" onclick="this.closest('.ai-bubble').remove(); window.aiCurrentInstance?.removeBubbleReference('${bubbleId}')" title="Cerrar">×</button>
        </div>
        <div class="ai-bubble-content">
            <div class="ai-bubble-icon">${this.getBubbleIcon(bubbleData.type)}</div>
            <div class="ai-bubble-text-container">
                <div class="ai-bubble-text" id="text-${bubbleId}">
                    <div class="ai-bubble-text-content">${displayMessage}</div>
                    ${showExpandButton ? `
                        <button class="ai-bubble-expand-btn" onclick="window.aiCurrentInstance?.toggleBubbleText('${bubbleId}', \`${bubbleData.message.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
                            <span class="expand-icon">↓</span> ver más
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        <div class="ai-bubble-arrow"></div>
    `;

    // ✅ POSICIONAMIENTO MEJORADO
    bubbleElement.style.cssText += `
        position: absolute;
        left: ${position.x}px;
        top: ${position.y}px;
        opacity: 0;
        transform: translateY(15px) scale(0.9);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: auto;
        cursor: move;
        z-index: 201;
    `;

    this.bubbleContainer.appendChild(bubbleElement);

    // ✅ HACER LA BURBUJA ARRASTRABLE
    this.makeBubbleDraggable(bubbleElement, bubbleId);

    // ✅ ANIMACIÓN DE ENTRADA MEJORADA
    setTimeout(() => {
        bubbleElement.style.opacity = '1';
        bubbleElement.style.transform = 'translateY(0) scale(1)';
    }, 10);

    // ✅ GUARDAR REFERENCIA CON DATOS COMPLETOS
    this.activeBubbles.set(bubbleId, {
        element: bubbleElement,
        data: bubbleData,
        timestamp: Date.now(),
        isExpanded: false,
        originalMessage: bubbleData.message,
        truncatedMessage: displayMessage,
        showExpandButton: showExpandButton
    });

    // Hacer disponible globalmente
    window.aiCurrentInstance = this;

    console.log(`💬 Burbuja "${bubbleData.type}" creada con mensaje de ${bubbleData.message.length} caracteres`);
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
        bubbleElement.style.transform += ' scale(1.02)'; // Efecto de "levantado"

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const containerRect = this.bubbleContainer.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - dragOffset.x;
        let newY = e.clientY - containerRect.top - dragOffset.y;

        // Limitar dentro del container con márgenes
        const bubbleRect = bubbleElement.getBoundingClientRect();
        const margin = 10;
        newX = Math.max(margin, Math.min(newX, containerRect.width - bubbleRect.width - margin));
        newY = Math.max(margin, Math.min(newY, containerRect.height - bubbleRect.height - margin));

        bubbleElement.style.left = newX + 'px';
        bubbleElement.style.top = newY + 'px';
        bubbleElement.style.transition = 'none'; // Disable transition while dragging
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            bubbleElement.style.cursor = 'move';
            bubbleElement.style.zIndex = '201';
            bubbleElement.style.transform = bubbleElement.style.transform.replace(' scale(1.02)', '');
            bubbleElement.style.transition = 'all 0.3s ease'; // Re-enable transition
        }
    });
}

toggleBubbleText(bubbleId, fullMessage) {
    const bubble = this.activeBubbles.get(bubbleId);
    if (!bubble) return;

    const textElement = document.querySelector(`#text-${bubbleId} .ai-bubble-text-content`);
    const expandBtn = document.querySelector(`#text-${bubbleId} .ai-bubble-expand-btn`);
    const expandIcon = expandBtn?.querySelector('.expand-icon');

    if (!textElement || !expandBtn) return;

    bubble.isExpanded = !bubble.isExpanded;

    textElement.style.transition = 'all 0.3s ease';

    if (bubble.isExpanded) {
        textElement.textContent = fullMessage;
        expandBtn.innerHTML = '<span class="expand-icon">↑</span> ver menos';
        bubble.element.classList.add('ai-bubble-expanded');

        // Efecto visual de expansión
        setTimeout(() => {
            bubble.element.style.transform = 'scale(1.02)';
            setTimeout(() => {
                bubble.element.style.transform = 'scale(1)';
            }, 150);
        }, 10);

    } else {
        textElement.textContent = bubble.truncatedMessage;
        expandBtn.innerHTML = '<span class="expand-icon">↓</span> ver más';
        bubble.element.classList.remove('ai-bubble-expanded');
    }

    console.log(`🔄 Burbuja ${bubbleId} ${bubble.isExpanded ? 'expandida' : 'contraída'}`);
}

    removeBubbleReference(bubbleId) {
        console.log(`🗑️ Eliminando referencia de burbuja: ${bubbleId}`);
        this.activeBubbles.delete(bubbleId);
    }

    // ==================== POSICIONAMIENTO INTELIGENTE ====================

    calculateBubblePosition(bubbleData) {
        const paperRect = this.editor.paper.el.getBoundingClientRect();
        let targetElement = null;

        // Intentar encontrar elemento relacionado
        if (bubbleData.targetClass) {
            const elements = this.editor.graph.getElements();
            targetElement = elements.find(element => {
                const attrs = element.attributes;
                return attrs.className === bubbleData.targetClass ||
                       (attrs.name && attrs.name.includes(bubbleData.targetClass));
            });
        }

        if (targetElement) {
            // Posicionar cerca del elemento objetivo
            const targetBBox = targetElement.getBBox();
            return {
                x: targetBBox.x + targetBBox.width + 20,
                y: targetBBox.y - 10
            };
        }

        // Posición inteligente por defecto
        return this.findOptimalPosition();
    }

    findOptimalPosition() {
        const containerRect = this.bubbleContainer.getBoundingClientRect();
        const elements = this.editor.graph.getElements();

        if (elements.length === 0) {
            // Canvas vacío - posición central-derecha
            return {
                x: Math.max(200, containerRect.width * 0.6),
                y: Math.max(100, containerRect.height * 0.3)
            };
        }

        const positions = elements.map(element => element.position());

        // Calcular centro de gravedad de las clases existentes
        const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
        const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;

        // Encontrar área libre cerca del centro
        const gridSize = 250; // Más espacio entre elementos
        const maxAttempts = 16;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Buscar en espiral alrededor del centro
            const angle = (attempt * 45) % 360;
            const distance = Math.ceil(attempt / 8) * gridSize;

            const testX = centerX + Math.cos(angle * Math.PI / 180) * distance;
            const testY = centerY + Math.sin(angle * Math.PI / 180) * distance;

            // Verificar si esta posición está libre
            const isFree = elements.every(element => {
                const pos = element.position();
                const distance = Math.sqrt(Math.pow(pos.x - testX, 2) + Math.pow(pos.y - testY, 2));
                return distance > 180; // Más separación
            });

            if (isFree) {
                return {
                    x: Math.max(60, Math.min(testX, containerRect.width - 300)),
                    y: Math.max(60, Math.min(testY, containerRect.height - 200))
                };
            }
        }

        // Fallback: posición segura a la derecha
        const rightmostElement = elements.reduce((max, element) => {
            const pos = element.position();
            return pos.x > max.x ? pos : max;
        }, { x: 0, y: 0 });

        return {
            x: Math.min(rightmostElement.x + 280, containerRect.width - 300),
            y: Math.max(60, rightmostElement.y)
        };
    }

    // ==================== ÍCONOS DE BURBUJAS ====================

    getBubbleIcon(type) {
        const icons = {
            info: '💡',
            suggestion: '🔧',
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

        // Animar salida mejorada
        element.style.opacity = '0';
        element.style.transform = 'translateY(-15px) scale(0.9)';

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
                element.style.transform = 'translateY(-15px) scale(0.9)';

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

    async showSequentialBubbles(bubbles, delay = 400) {
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

    // ==================== ESTILOS CSS MEJORADOS ====================

    static addBubbleStyles() {
        if (document.getElementById('ai-bubble-styles-improved')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-bubble-styles-improved';
        styles.textContent = `
            /* ✅ ESTILOS BASE MEJORADOS PARA BURBUJAS */
            .ai-bubble-draggable {
                max-width: 380px;
                min-width: 250px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                border: 1px solid #e5e7eb;
                position: relative;
                z-index: 201;
                cursor: move;
                user-select: none;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                backdrop-filter: blur(10px);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .ai-bubble-draggable:hover {
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
                transform: translateY(-2px);
            }

            /* ✅ HEADER CON DRAG HANDLE MEJORADO */
            .ai-bubble-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px 6px 14px;
                border-bottom: 1px solid #f1f5f9;
                cursor: grab;
                background: linear-gradient(135deg, #fafafa 0%, #f8fafc 100%);
                border-radius: 16px 16px 0 0;
            }

            .ai-bubble-header:active {
                cursor: grabbing;
            }

            .ai-bubble-drag-handle {
                color: #94a3b8;
                font-size: 14px;
                cursor: grab;
                padding: 4px 6px;
                border-radius: 6px;
                transition: all 0.2s;
                font-weight: bold;
                letter-spacing: 1px;
            }

            .ai-bubble-drag-handle:hover {
                background: #e2e8f0;
                color: #64748b;
                transform: scale(1.1);
            }

            /* ✅ CONTENIDO MEJORADO */
            .ai-bubble-content {
                padding: 16px 18px 18px 18px;
                display: flex;
                align-items: flex-start;
                gap: 14px;
            }

            .ai-bubble-icon {
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 1px;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
            }

            .ai-bubble-text-container {
                flex: 1;
                min-width: 0;
            }

            .ai-bubble-text {
                font-size: 14px;
                line-height: 1.6;
                color: #374151;
                word-wrap: break-word;
            }

            .ai-bubble-text-content {
                display: block;
                margin-bottom: 8px;
            }

            /* ✅ BOTÓN EXPANDIR COMPLETAMENTE REDISEÑADO */
            .ai-bubble-expand-btn {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                border: 1px solid #cbd5e1;
                color: #4f46e5;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                padding: 6px 12px;
                border-radius: 20px;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-top: 8px;
                text-transform: lowercase;
                letter-spacing: 0.5px;
            }

            .ai-bubble-expand-btn:hover {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                border-color: #6366f1;
            }

            .ai-bubble-expand-btn .expand-icon {
                font-size: 10px;
                transition: transform 0.3s ease;
            }

            .ai-bubble-expand-btn:hover .expand-icon {
                transform: scale(1.2);
            }

            /* ✅ ESTADO EXPANDIDO MEJORADO */
            .ai-bubble-expanded {
                max-width: 480px;
                min-width: 400px;
                transform: scale(1.02);
                box-shadow: 0 16px 50px rgba(0, 0, 0, 0.15);
            }

            .ai-bubble-expanded .ai-bubble-text {
                max-height: 300px;
                overflow-y: auto;
                padding-right: 8px;
            }

            /* ✅ SCROLLBAR PERSONALIZADA */
            .ai-bubble-expanded .ai-bubble-text::-webkit-scrollbar {
                width: 6px;
            }

            .ai-bubble-expanded .ai-bubble-text::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
            }

            .ai-bubble-expanded .ai-bubble-text::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }

            .ai-bubble-expanded .ai-bubble-text::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }

            /* ✅ BOTÓN CERRAR MEJORADO */
            .ai-bubble-close {
                background: rgba(239, 68, 68, 0.1);
                border: none;
                color: #ef4444;
                cursor: pointer;
                font-size: 16px;
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
                font-weight: bold;
            }

            .ai-bubble-close:hover {
                background: #ef4444;
                color: white;
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            /* ✅ TIPOS DE BURBUJAS CON GRADIENTES MEJORADOS */
            .ai-bubble-info {
                border-left: 5px solid #3b82f6;
                background: linear-gradient(135deg, #fff 0%, #eff6ff 100%);
            }

            .ai-bubble-suggestion {
                border-left: 5px solid #f59e0b;
                background: linear-gradient(135deg, #fff 0%, #fffbeb 100%);
            }

            .ai-bubble-warning {
                border-left: 5px solid #ef4444;
                background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);
            }

            .ai-bubble-success {
                border-left: 5px solid #10b981;
                background: linear-gradient(135deg, #fff 0%, #ecfdf5 100%);
            }

            .ai-bubble-change {
                border-left: 5px solid #8b5cf6;
                background: linear-gradient(135deg, #fff 0%, #f3f4f6 100%);
            }

            /* ✅ ANIMACIONES MEJORADAS */
            .ai-bubble-highlighted {
                animation: aiBubbleHighlightImproved 0.8s ease-in-out;
            }

            @keyframes aiBubbleHighlightImproved {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 20px 60px rgba(99, 102, 241, 0.4);
                }
            }

            /* ✅ FLECHA MEJORADA */
            .ai-bubble-arrow {
                position: absolute;
                left: 20px;
                bottom: -9px;
                width: 0;
                height: 0;
                border-left: 9px solid transparent;
                border-right: 9px solid transparent;
                border-top: 9px solid white;
                filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.1));
            }

            /* ✅ RESPONSIVE MEJORADO */
            @media (max-width: 768px) {
                .ai-bubble-draggable {
                    max-width: 280px;
                    min-width: 200px;
                }

                .ai-bubble-expanded {
                    max-width: 300px;
                    min-width: 250px;
                }

                .ai-bubble-text {
                    font-size: 13px;
                    line-height: 1.5;
                }

                .ai-bubble-content {
                    padding: 12px 14px;
                    gap: 10px;
                }

                .ai-bubble-icon {
                    font-size: 18px;
                }
            }

            /* ✅ EFECTOS DE ENTRADA Y SALIDA */
            .ai-bubble-enter {
                animation: aiBubbleEnterImproved 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes aiBubbleEnterImproved {
                0% {
                    opacity: 0;
                    transform: translateY(20px) scale(0.8);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;

        document.head.appendChild(styles);
        console.log('✅ Estilos mejorados de burbujas cargados');
    }
}
