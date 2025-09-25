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
       // console.log('📝 Cambio registrado:', change);
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
    if (!changes || changes.length === 0) return;

    changes.forEach(change => {
        // Ignorar nuestros propios cambios para evitar loops
        if (change.user_id === this.userId) return;

        try {
            const { type, element_id, data } = change;
/*
            console.log('🔄 Aplicando cambio remoto:', {
                type,
                element_id,
                user_id: change.user_id,
                data
            });*/

            switch (type) {
                case 'change:position':
                    this.applyPositionChange(element_id, data);
                    break;

                case 'change:size':
                    this.applySizeChange(element_id, data);
                    break;

                case 'change:attrs':
                    this.applyAttrsChange(element_id, data);
                    break;

                case 'add':
                    this.applyAddElement(data);
                    break;

                case 'remove':
                    this.applyRemoveElement(element_id);
                    break;

                case 'change:umlData':
                    this.applyUMLDataChange(element_id, data);
                    break;

                // Ignorar eventos batch y change genéricos para evitar redundancia
                case 'batch:start':
                case 'batch:stop':
                case 'change':
                    break;

                default:
                    console.warn('🤷 Tipo de cambio remoto desconocido:', type);
            }

        } catch (error) {
            console.error('❌ Error aplicando cambio remoto:', error, change);
        }
    });
}

applyUMLDataChange(elementId, data) {
    const element = this.editor.graph.getCell(elementId);
    if (element && data.umlData && this.editor.classManager) {
        // Actualizar datos UML sin triggear eventos
        element.set('umlData', data.umlData, { silent: true });

        // Regenerar markup si es necesario
        if (this.editor.classManager.elementFactory) {
            this.editor.classManager.elementFactory.updateClassMarkup(element);
        }

        console.log('🏷️ Datos UML actualizados remotamente:', elementId);
    }
}

applyPositionChange(elementId, data) {
    const element = this.editor.graph.getCell(elementId);

    if (element && data.position) {
        // Actualizar posición con silent para evitar eventos
        element.set('position', data.position, { silent: true });

        // FORZAR render visual
        const view = this.editor.paper.findViewByModel(element);
        if (view) {
            view.update();
        }

        console.log('📍 Posición actualizada remotamente:', elementId, data.position);
    }
}

applySizeChange(elementId, data) {
    const element = this.editor.graph.getCell(elementId);
    if (element && data.size) {
        element.set('size', data.size, { silent: true });
        console.log('📏 Tamaño actualizado remotamente:', elementId, data.size);
    }
}

applyAttrsChange(elementId, data) {
    const element = this.editor.graph.getCell(elementId);
    if (element && data.attrs) {
        // Para attrs, hacer merge inteligente
        const currentAttrs = element.get('attrs') || {};
        const newAttrs = { ...currentAttrs, ...data.attrs };

        element.set('attrs', newAttrs, { silent: true });
        console.log('🎨 Atributos actualizados remotamente:', elementId);
    }
}

applyAddElement(data) {
    if (data.cell) {
        try {
            // Verificar que el elemento no existe ya
            const existingElement = this.editor.graph.getCell(data.cell.id);
            if (!existingElement) {
                // Agregar el elemento sin triggear eventos
                this.editor.graph.addCell(data.cell, { silent: true });
                console.log('➕ Elemento agregado remotamente:', data.cell.id);
            }
        } catch (error) {
            console.error('❌ Error agregando elemento remoto:', error);
        }
    }
}

applyRemoveElement(elementId) {
    const element = this.editor.graph.getCell(elementId);
    if (element) {
        element.remove({ silent: true });
        console.log('🗑️ Elemento eliminado remotamente:', elementId);
    }
}

applyUMLDataChange(elementId, data) {
    const element = this.editor.graph.getCell(elementId);
    if (element && data.umlData && this.editor.classManager) {
        // Actualizar datos UML sin triggear eventos
        element.set('umlData', data.umlData, { silent: true });

        // Regenerar markup si es necesario
        if (this.editor.classManager.elementFactory) {
            this.editor.classManager.elementFactory.updateClassMarkup(element);
        }

        console.log('🏷️ Datos UML actualizados remotamente:', elementId);
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
