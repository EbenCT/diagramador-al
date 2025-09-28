// resources/js/diagram/modules-ai/AIAnimationManager.js
// Maneja todas las animaciones de escaneo del canvas durante el análisis con IA

export class AIAnimationManager {
    constructor(editor) {
        this.editor = editor;
        this.scanOverlay = null;
        this.scanLine = null;
        this.isScanning = false;
        this.scanAnimationId = null;
        this.pulseElements = new Set();
    }

    // ==================== ANIMACIÓN DE ESCANEO PRINCIPAL ====================

    async startScanAnimation() {
        if (this.isScanning) return;

        console.log('🔍 Iniciando animación de escaneo...');
        this.isScanning = true;

        // Crear overlay de escaneo
        this.createScanOverlay();

        // Crear línea de escaneo
        this.createScanLine();

        // Iniciar pulso en elementos
        this.startElementPulse();

        // Programar animaciones
        await this.runScanSequence();
    }

    async runScanSequence() {
        return new Promise((resolve) => {
            let progress = 0;
            const duration = 2000; // 2 segundos
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                progress = Math.min(elapsed / duration, 1);

                // Actualizar posición de línea de escaneo
                this.updateScanLinePosition(progress);

                // Pulso secuencial en elementos
                this.updateElementPulse(progress);

                if (progress < 1) {
                    this.scanAnimationId = requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            this.scanAnimationId = requestAnimationFrame(animate);
        });
    }

    stopScanAnimation() {
        if (!this.isScanning) return;

        console.log('⏹️ Deteniendo animación de escaneo...');

        // Cancelar animaciones
        if (this.scanAnimationId) {
            cancelAnimationFrame(this.scanAnimationId);
            this.scanAnimationId = null;
        }

        // Limpiar elementos visuales
        this.cleanupScanElements();

        // Detener pulso en elementos
        this.stopElementPulse();

        this.isScanning = false;
    }

    // ==================== OVERLAY DE ESCANEO ====================

    createScanOverlay() {
        // Evitar duplicados
        if (this.scanOverlay) {
            this.scanOverlay.remove();
        }

        const paperContainer = this.editor.paper.el;
        const rect = paperContainer.getBoundingClientRect();

        this.scanOverlay = document.createElement('div');
        this.scanOverlay.className = 'ai-scan-overlay';
        this.scanOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(99, 102, 241, 0.05);
            pointer-events: none;
            z-index: 100;
            border-radius: 8px;
            transition: opacity 0.3s ease;
        `;

        // Agregar al contenedor del paper
        paperContainer.style.position = 'relative';
        paperContainer.appendChild(this.scanOverlay);
    }

    // ==================== LÍNEA DE ESCANEO ====================

    createScanLine() {
        if (this.scanLine) {
            this.scanLine.remove();
        }

        this.scanLine = document.createElement('div');
        this.scanLine.className = 'ai-scan-line';
        this.scanLine.style.cssText = `
            position: absolute;
            top: -3px;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(99, 102, 241, 0.3) 25%,
                rgba(99, 102, 241, 0.8) 50%,
                rgba(99, 102, 241, 0.3) 75%,
                transparent 100%
            );
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
            pointer-events: none;
            z-index: 101;
        `;

        this.scanOverlay.appendChild(this.scanLine);
    }

    updateScanLinePosition(progress) {
        if (!this.scanLine || !this.scanOverlay) return;

        const overlayHeight = this.scanOverlay.offsetHeight;
        const yPosition = (overlayHeight + 6) * progress - 3; // +6 para que salga completamente

        this.scanLine.style.top = `${yPosition}px`;

        // Efecto de desvanecimiento al final
        if (progress > 0.9) {
            const fadeProgress = (progress - 0.9) / 0.1;
            this.scanLine.style.opacity = 1 - fadeProgress;
        }
    }

    // ==================== PULSO EN ELEMENTOS UML ====================

    startElementPulse() {
        const elements = this.editor.graph.getElements();

        elements.forEach((element, index) => {
            const elementView = this.editor.paper.findViewByModel(element);
            if (!elementView) return;

            const elementNode = elementView.el;
            if (!elementNode) return;

            // Agregar clase CSS para animación
            elementNode.classList.add('ai-scanning-element');
            this.pulseElements.add(elementNode);

            // Pulso escalonado
            setTimeout(() => {
                if (elementNode.classList.contains('ai-scanning-element')) {
                    elementNode.classList.add('ai-element-active-pulse');
                }
            }, index * 100); // Escalonar por 100ms
        });
    }

    updateElementPulse(progress) {
        // Activar/desactivar pulso basado en la posición de la línea de escaneo
        const elements = this.editor.graph.getElements();

        elements.forEach((element) => {
            const elementView = this.editor.paper.findViewByModel(element);
            if (!elementView) return;

            const elementNode = elementView.el;
            const elementRect = elementNode.getBoundingClientRect();
            const overlayRect = this.scanOverlay.getBoundingClientRect();

            // Calcular si la línea de escaneo está pasando por el elemento
            const relativeElementTop = elementRect.top - overlayRect.top;
            const scanLinePosition = overlayRect.height * progress;

            const isBeingScanned = scanLinePosition >= relativeElementTop &&
                                 scanLinePosition <= (relativeElementTop + elementRect.height);

            if (isBeingScanned) {
                elementNode.classList.add('ai-element-scanning-now');
            } else {
                elementNode.classList.remove('ai-element-scanning-now');
            }
        });
    }

    stopElementPulse() {
        this.pulseElements.forEach(elementNode => {
            elementNode.classList.remove('ai-scanning-element');
            elementNode.classList.remove('ai-element-active-pulse');
            elementNode.classList.remove('ai-element-scanning-now');
        });

        this.pulseElements.clear();
    }

    // ==================== LIMPIEZA ====================

    cleanupScanElements() {
        // Remover overlay
        if (this.scanOverlay) {
            this.scanOverlay.remove();
            this.scanOverlay = null;
        }

        // Limpiar referencia a línea
        this.scanLine = null;
    }

    // ==================== ESTILOS CSS ESPECÍFICOS ====================

    static addAnimationStyles() {
        if (document.getElementById('ai-animation-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-animation-styles';
        styles.textContent = `
            /* Animaciones para elementos durante escaneo */
            .ai-scanning-element {
                transition: all 0.3s ease;
            }

            .ai-element-active-pulse {
                animation: aiElementPulse 1.5s ease-in-out infinite;
            }

            .ai-element-scanning-now {
                animation: aiElementHighlight 0.5s ease-in-out;
                filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
            }

            @keyframes aiElementPulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.02);
                    opacity: 0.9;
                }
            }

            @keyframes aiElementHighlight {
                0% {
                    filter: drop-shadow(0 0 0px rgba(99, 102, 241, 0));
                }
                50% {
                    filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.8));
                }
                100% {
                    filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
                }
            }

            /* Efecto de escaneo en el overlay */
            .ai-scan-overlay {
                animation: aiScanOverlayPulse 3s ease-in-out infinite;
            }

            @keyframes aiScanOverlayPulse {
                0%, 100% {
                    background: rgba(99, 102, 241, 0.05);
                }
                50% {
                    background: rgba(99, 102, 241, 0.08);
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // ==================== EFECTOS ADICIONALES ====================

    // Efecto de destello cuando se completa el escaneo
    async flashCompleteEffect() {
        if (!this.scanOverlay) return;

        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(16, 185, 129, 0.2);
            pointer-events: none;
            z-index: 102;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        this.scanOverlay.appendChild(flash);

        // Animar destello
        setTimeout(() => flash.style.opacity = '1', 10);
        setTimeout(() => flash.style.opacity = '0', 300);
        setTimeout(() => flash.remove(), 500);
    }

    // Efecto de error si el análisis falla
    async flashErrorEffect() {
        if (!this.scanOverlay) return;

        const errorFlash = document.createElement('div');
        errorFlash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(239, 68, 68, 0.2);
            pointer-events: none;
            z-index: 102;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        this.scanOverlay.appendChild(errorFlash);

        // Animar destello de error
        setTimeout(() => errorFlash.style.opacity = '1', 10);
        setTimeout(() => errorFlash.style.opacity = '0', 500);
        setTimeout(() => errorFlash.remove(), 700);
    }
}

// Agregar estilos al cargar el módulo
AIAnimationManager.addAnimationStyles();
