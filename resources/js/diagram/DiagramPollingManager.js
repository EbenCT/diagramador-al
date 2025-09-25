// resources/js/diagram/DiagramPollingManager.js
export class DiagramPollingManager {
    constructor(editor) {
        this.editor = editor;
        this.sessionToken = this.getSessionFromURL();
        this.userId = window.authUserId;
        this.lastSync = Date.now();
        this.pollInterval = null;
        this.pendingChanges = [];
        this.isActive = false;

        console.log('🔄 DiagramPollingManager inicializado', {
            sessionToken: this.sessionToken,
            userId: this.userId
        });

        if (this.sessionToken) {
            this.startCollaboration();
        }
    }

    getSessionFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('collab') || window.diagramSessionId;
    }

    startCollaboration() {
        console.log('🤝 Iniciando colaboración por polling');
        this.isActive = true;
        this.showCollabIndicator();
        this.setupChangeTracking();
        this.startPolling();
    }

    showCollabIndicator() {
        // Mostrar indicador visual de modo colaborativo
        const indicator = document.createElement('div');
        indicator.id = 'collab-indicator';
        indicator.innerHTML = `
            <div class="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm shadow-lg z-50">
                🤝 Colaborativo
                <span id="active-users-count">0</span> usuarios
            </div>
        `;
        document.body.appendChild(indicator);
    }

    setupChangeTracking() {
        // Interceptar cambios del graph
        this.editor.graph.on('all', (eventName, cell, graph, opt) => {
            if (opt && opt.silent) return; // Ignorar cambios silenciosos (remotos)
            if (!this.isActive) return;

            this.logChange({
                type: eventName,
                element_id: cell?.id,
                data: this.serializeChange(eventName, cell),
                timestamp: Date.now(),
                user_id: this.userId
            });
        });

        console.log('🎧 Change tracking configurado');
    }

    serializeChange(eventName, cell) {
        if (!cell) return {};

        switch(eventName) {
            case 'change:position':
                return {
                    position: cell.get('position')
                };
            case 'change:size':
                return {
                    size: cell.get('size')
                };
            case 'add':
                return {
                    cellData: cell.toJSON()
                };
            case 'remove':
                return {
                    elementId: cell.id
                };
            case 'change:attrs':
                return {
                    attrs: cell.get('attrs')
                };
            default:
                return {
                    attributes: cell.changedAttributes?.() || {}
                };
        }
    }

    logChange(change) {
        this.pendingChanges.push(change);
        console.log('📝 Cambio registrado:', change);
    }

    startPolling() {
        // Sincronizar cada 3 segundos
        this.pollInterval = setInterval(async () => {
            await this.syncChanges();
        }, 3000);

        console.log('⏰ Polling iniciado (cada 3s)');
    }

    async syncChanges() {
        if (!this.sessionToken || !this.isActive) return;
        let changesToSend = [];

        try {
            changesToSend = [...this.pendingChanges];
            this.pendingChanges = []; // Limpiar cambios pendientes

            const response = await axios.post(`/api/collab/${this.sessionToken}/sync`, {
                changes: changesToSend,
                last_sync: this.lastSync
            });

            // Actualizar timestamp
            this.lastSync = response.data.server_time || Date.now();

            // Aplicar cambios remotos
            if (response.data.changes && response.data.changes.length > 0) {
                console.log('📥 Aplicando', response.data.changes.length, 'cambios remotos');
                this.applyRemoteChanges(response.data.changes);
            }

            // Actualizar usuarios activos
            this.updateActiveUsers(response.data.active_users || []);

        } catch (error) {
            console.error('❌ Error en sync:', error);

            // Re-agregar cambios fallidos
            if (changesToSend && changesToSend.length > 0) {
                this.pendingChanges.unshift(...changesToSend);
            }
        }
    }

    applyRemoteChanges(changes) {
        changes.forEach(change => {
            if (change.user_id === this.userId) return; // Ignorar nuestros cambios

            try {
                this.applyRemoteChange(change);
            } catch (error) {
                console.error('❌ Error aplicando cambio remoto:', change, error);
            }
        });
    }

    applyRemoteChange(change) {
        const { type, element_id, data } = change;

        switch(type) {
            case 'add':
                if (data.cellData && !this.editor.graph.getCell(data.cellData.id)) {
                    this.editor.graph.fromJSON({ cells: [data.cellData] }, { silent: true });
                    console.log('➕ Elemento agregado remotamente:', data.cellData.id);
                }
                break;

            case 'remove':
                const cellToRemove = this.editor.graph.getCell(data.elementId);
                if (cellToRemove) {
                    cellToRemove.remove({ silent: true });
                    console.log('➖ Elemento eliminado remotamente:', data.elementId);
                }
                break;

            case 'change:position':
                const cellToMove = this.editor.graph.getCell(element_id);
                if (cellToMove && data.position) {
                    cellToMove.position(data.position.x, data.position.y, { silent: true });
                    console.log('📍 Elemento movido remotamente:', element_id);
                }
                break;

            case 'change:size':
                const cellToResize = this.editor.graph.getCell(element_id);
                if (cellToResize && data.size) {
                    cellToResize.resize(data.size.width, data.size.height, { silent: true });
                    console.log('📏 Elemento redimensionado remotamente:', element_id);
                }
                break;

            case 'change:attrs':
                const cellToUpdate = this.editor.graph.getCell(element_id);
                if (cellToUpdate && data.attrs) {
                    cellToUpdate.attr(data.attrs, { silent: true });
                    console.log('🎨 Atributos actualizados remotamente:', element_id);
                }
                break;
        }
    }

    updateActiveUsers(activeUsers) {
        const countElement = document.getElementById('active-users-count');
        if (countElement) {
            countElement.textContent = activeUsers.length;
        }

        // Delegar gestión de usuarios a CollaborationManager si existe
        if (this.editor.collaborationManager) {
            this.editor.collaborationManager.updateCollaboratorsList(activeUsers);
        }
    }

    stopCollaboration() {
        this.isActive = false;

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        // Remover indicador
        const indicator = document.getElementById('collab-indicator');
        if (indicator) {
            indicator.remove();
        }

        console.log('🛑 Colaboración detenida');
    }

    // Método para compatibilidad con código existente
    broadcastDiagramUpdate(data) {
        // En polling, los cambios se envían automáticamente
        console.log('📤 Cambio será enviado en próximo poll:', data);
    }

    getConnectionStatus() {
        return {
            active: this.isActive,
            sessionToken: this.sessionToken,
            userId: this.userId,
            pendingChanges: this.pendingChanges.length,
            lastSync: new Date(this.lastSync).toISOString()
        };
    }
}
