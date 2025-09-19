// =============================================================================
// resources/js/diagram/DiagramCursorManager.js
// Módulo especializado para gestión de cursores en tiempo real
// =============================================================================

export class DiagramCursorManager {
    constructor(editor) {
        this.editor = editor;
        this.remoteCursors = new Map();
        this.localCursorPosition = { x: 0, y: 0 };
        this.isTrackingEnabled = true;
        this.throttleDelay = 100; // ms

        this.setupCursorTracking();
        console.log('👆 DiagramCursorManager inicializado');
    }

    // ==================== CONFIGURACIÓN ====================

    setupCursorTracking() {
        const paperEl = this.editor.paper.el;

        // Throttle para optimizar envío de posiciones
        let lastSent = 0;

        paperEl.addEventListener('mousemove', (event) => {
            if (!this.isTrackingEnabled) return;

            const now = Date.now();
            if (now - lastSent < this.throttleDelay) return;

            const rect = paperEl.getBoundingClientRect();
            const position = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                zoom: this.editor.zoomManager.getCurrentZoom()
            };

            this.localCursorPosition = position;

            // Enviar posición via WebSocket
            if (this.editor.webSocketManager) {
                this.editor.webSocketManager.broadcastCursorMove(position);
            }

            lastSent = now;
        });

        // Ocultar cursor cuando sale del área
        paperEl.addEventListener('mouseleave', () => {
            if (this.editor.webSocketManager) {
                this.editor.webSocketManager.broadcastCursorMove({ x: -1, y: -1 });
            }
        });

        console.log('👆 Tracking de cursor configurado');
    }

    // ==================== CURSORES REMOTOS ====================

    updateRemoteCursor(userId, position, user) {
        if (position.x < 0 || position.y < 0) {
            this.removeRemoteCursor(userId);
            return;
        }

        let cursor = this.remoteCursors.get(userId);

        if (!cursor) {
            cursor = this.createRemoteCursor(userId, user);
            this.remoteCursors.set(userId, cursor);
        }

        // Actualizar posición
        cursor.element.style.left = `${position.x}px`;
        cursor.element.style.top = `${position.y}px`;
        cursor.element.style.display = 'block';

        // Actualizar timestamp para auto-cleanup
        cursor.lastUpdate = Date.now();

        // Auto-hide después de 3 segundos sin movimiento
        clearTimeout(cursor.hideTimeout);
        cursor.hideTimeout = setTimeout(() => {
            cursor.element.style.display = 'none';
        }, 3000);
    }

    createRemoteCursor(userId, user) {
        const collaborator = this.editor.collaborationManager?.getCollaboratorByUserId(userId);
        const color = collaborator ? collaborator.color : '#6b7280';

        const cursorElement = document.createElement('div');
        cursorElement.className = 'remote-cursor';
        cursorElement.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 9999;
            transition: all 0.1s ease-out;
            display: none;
        `;

        // SVG del cursor
        cursorElement.innerHTML = `
            <div class="flex items-start">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" class="drop-shadow-sm">
                    <path d="M7.6 21.4L3.4 6.5l15.9 6.1-4.3 1.1-2.5 5.3z"/>
                </svg>
                <div class="ml-1 px-2 py-1 bg-white rounded shadow-lg border text-xs font-medium"
                     style="color: ${color}; border-color: ${color}">
                    ${user.name}
                </div>
            </div>
        `;

        // Agregar al DOM
        this.editor.paper.el.parentElement.appendChild(cursorElement);

        return {
            element: cursorElement,
            userId: userId,
            user: user,
            color: color,
            lastUpdate: Date.now(),
            hideTimeout: null
        };
    }

    removeRemoteCursor(userId) {
        const cursor = this.remoteCursors.get(userId);
        if (!cursor) return;

        clearTimeout(cursor.hideTimeout);
        cursor.element.remove();
        this.remoteCursors.delete(userId);

        console.log(`👆 Cursor remoto removido: ${userId}`);
    }

    // ==================== CONTROL DE TRACKING ====================

    enableTracking() {
        this.isTrackingEnabled = true;
        console.log('👆 Tracking de cursor habilitado');
    }

    disableTracking() {
        this.isTrackingEnabled = false;
        console.log('👆 Tracking de cursor deshabilitado');
    }

    // ==================== LIMPIEZA ====================

    cleanup() {
        // Remover todos los cursores remotos
        this.remoteCursors.forEach((cursor) => {
            clearTimeout(cursor.hideTimeout);
            cursor.element.remove();
        });

        this.remoteCursors.clear();
        console.log('🧹 Cursores remotos limpiados');
    }

    // ==================== UTILIDADES ====================

    getCursorStats() {
        return {
            remoteCursorsCount: this.remoteCursors.size,
            localPosition: this.localCursorPosition,
            trackingEnabled: this.isTrackingEnabled,
            throttleDelay: this.throttleDelay
        };
    }

    setThrottleDelay(delay) {
        this.throttleDelay = Math.max(50, Math.min(500, delay));
        console.log(`👆 Throttle delay actualizado: ${this.throttleDelay}ms`);
    }
}
