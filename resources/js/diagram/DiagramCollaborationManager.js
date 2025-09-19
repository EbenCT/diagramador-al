// =============================================================================
// resources/js/diagram/DiagramCollaborationManager.js
// Módulo especializado para gestión de colaboradores y cambios remotos
// =============================================================================

export class DiagramCollaborationManager {
    constructor(editor) {
        this.editor = editor;
        this.collaborators = new Map();
        this.remoteSelections = new Map();
        this.updateQueue = [];
        this.isProcessingUpdates = false;

        // Colores para colaboradores
        this.collaboratorColors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
        ];
        this.colorIndex = 0;

        console.log('🤝 DiagramCollaborationManager inicializado');
    }

    // ==================== GESTIÓN DE COLABORADORES ====================

    addCollaborator(user) {
        if (this.collaborators.has(user.id)) {
            return; // Ya existe
        }

        const color = this.collaboratorColors[this.colorIndex % this.collaboratorColors.length];
        this.colorIndex++;

        const collaborator = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            color: color,
            isOnline: true,
            joinedAt: Date.now(),
            lastActivity: Date.now()
        };

        this.collaborators.set(user.id, collaborator);
        this.updateCollaboratorsUI();

        console.log(`➕ Colaborador agregado: ${user.name}`, collaborator);
    }

    removeCollaborator(user) {
        if (!this.collaborators.has(user.id)) {
            return;
        }

        this.collaborators.delete(user.id);
        this.remoteSelections.delete(user.id);
        this.updateCollaboratorsUI();

        // Limpiar cursor remoto
        if (this.editor.cursorManager) {
            this.editor.cursorManager.removeRemoteCursor(user.id);
        }

        console.log(`➖ Colaborador removido: ${user.name}`);
    }

    updateCollaboratorsList(users) {
        // Limpiar colaboradores antiguos
        this.collaborators.clear();
        this.remoteSelections.clear();

        // Agregar usuarios actuales
        users.forEach(user => {
            if (user.id !== this.editor.webSocketManager?.userId) {
                this.addCollaborator(user);
            }
        });

        console.log(`👥 Lista de colaboradores actualizada: ${users.length} usuarios`);
    }

    updateCollaboratorsUI() {
        const collaboratorsElement = document.getElementById('collaborators-list');
        if (!collaboratorsElement) return;

        const html = Array.from(this.collaborators.values()).map(collaborator => `
            <div class="collaborator-item flex items-center space-x-2 p-2" data-user-id="${collaborator.id}">
                <div class="w-3 h-3 rounded-full" style="background-color: ${collaborator.color}"></div>
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">${collaborator.name}</div>
                    <div class="text-xs text-gray-500">En línea</div>
                </div>
                <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
        `).join('');

        collaboratorsElement.innerHTML = html || '<p class="text-gray-500 text-sm p-2">No hay colaboradores</p>';

        // Actualizar contador
        const countElement = document.getElementById('collaborators-count');
        if (countElement) {
            countElement.textContent = this.collaborators.size;
        }
    }

    // ==================== APLICACIÓN DE CAMBIOS REMOTOS ====================

    applyRemoteUpdate(event) {
        this.updateQueue.push(event);

        if (!this.isProcessingUpdates) {
            this.processUpdateQueue();
        }
    }

    async processUpdateQueue() {
        this.isProcessingUpdates = true;

        while (this.updateQueue.length > 0) {
            const event = this.updateQueue.shift();
            await this.processRemoteUpdate(event);
        }

        this.isProcessingUpdates = false;
    }

    async processRemoteUpdate(event) {
        try {
            switch (event.updateType) {
                case 'diagram_saved':
                    await this.applyDiagramUpdate(event.data);
                    break;

                case 'class_updated':
                    await this.applyClassUpdate(event.data);
                    break;

                case 'relationship_created':
                    await this.applyRelationshipCreation(event.data);
                    break;

                case 'element_deleted':
                    await this.applyElementDeletion(event.data);
                    break;

                default:
                    console.warn(`🤷 Tipo de actualización desconocido: ${event.updateType}`);
            }

            // Actualizar actividad del colaborador
            if (this.collaborators.has(event.userId)) {
                const collaborator = this.collaborators.get(event.userId);
                collaborator.lastActivity = Date.now();
            }

        } catch (error) {
            console.error('❌ Error procesando actualización remota:', error);
        }
    }

    async applyDiagramUpdate(diagramData) {
        // Aplicar cambios completos del diagrama
        if (this.editor.saveManager) {
            // Temporalmente deshabilitar broadcasting para evitar loops
            const originalBroadcast = this.editor.webSocketManager?.broadcastDiagramUpdate;
            if (originalBroadcast) {
                this.editor.webSocketManager.broadcastDiagramUpdate = () => {};
            }

            this.editor.saveManager.recreateElementsFromData(diagramData.cells);

            // Restaurar broadcasting
            if (originalBroadcast) {
                this.editor.webSocketManager.broadcastDiagramUpdate = originalBroadcast;
            }
        }

        console.log('🔄 Diagrama actualizado remotamente');
    }

    async applyClassUpdate(data) {
        const element = this.editor.graph.getCell(data.elementId);
        if (!element) return;

        // Aplicar actualización usando ClassManager
        if (this.editor.classManager && this.editor.classManager.elementFactory) {
            this.editor.classManager.elementFactory.updateClassElement(
                element,
                data.umlData.className,
                data.umlData.attributes,
                data.umlData.methods,
                data.umlData.type,
                data.umlData.uml25
            );
        }

        console.log('🏷️ Clase actualizada remotamente:', data.umlData.className);
    }

    async applyRelationshipCreation(data) {
        const source = this.editor.graph.getCell(data.sourceId);
        const target = this.editor.graph.getCell(data.targetId);

        if (!source || !target) return;

        // Crear relación usando RelationshipManager
        if (this.editor.relationshipManager) {
            // Temporalmente cambiar herramienta seleccionada
            const originalTool = this.editor.selectedTool;
            this.editor.selectedTool = data.relationshipType;

            // Crear relación sin modal (usar valores por defecto)
            this.editor.relationshipManager.createRelationshipDirect(source, target, data.relationshipType);

            // Restaurar herramienta
            this.editor.selectedTool = originalTool;
        }

        console.log('🔗 Relación creada remotamente:', data.relationshipType);
    }

    async applyElementDeletion(data) {
        const element = this.editor.graph.getCell(data.elementId);
        if (element) {
            element.remove();
            console.log('🗑️ Elemento eliminado remotamente');
        }
    }

    // ==================== SELECCIONES REMOTAS ====================

    highlightRemoteSelection(elementId, user) {
        const element = this.editor.graph.getCell(elementId);
        if (!element) return;

        const collaborator = this.collaborators.get(user.id);
        if (!collaborator) return;

        // Limpiar selección anterior de este usuario
        this.clearRemoteSelection(user.id);

        // Aplicar nuevo highlight
        if (element.isLink && element.isLink()) {
            element.attr('line/stroke', collaborator.color);
            element.attr('line/strokeWidth', 3);
        } else {
            element.attr('body/stroke', collaborator.color);
            element.attr('body/strokeWidth', 3);
            element.attr('body/strokeDasharray', '5,5');
        }

        // Guardar selección
        this.remoteSelections.set(user.id, {
            elementId: elementId,
            element: element,
            user: user,
            timestamp: Date.now()
        });

        // Auto-limpiar después de 5 segundos
        setTimeout(() => {
            this.clearRemoteSelection(user.id);
        }, 5000);

        console.log(`🎯 Selección remota de ${user.name} en elemento ${elementId}`);
    }

    clearRemoteSelection(userId) {
        const selection = this.remoteSelections.get(userId);
        if (!selection) return;

        const element = selection.element;

        // Restaurar estilos originales
        if (element.isLink && element.isLink()) {
            element.attr('line/stroke', '#1e40af');
            element.attr('line/strokeWidth', 2);
        } else {
            element.attr('body/stroke', '#1e40af');
            element.attr('body/strokeWidth', 2);
            element.attr('body/strokeDasharray', 'none');
        }

        this.remoteSelections.delete(userId);
    }

    // ==================== UTILIDADES ====================

    getCollaboratorByUserId(userId) {
        return this.collaborators.get(userId);
    }

    getActiveCollaborators() {
        return Array.from(this.collaborators.values())
            .filter(collaborator => collaborator.isOnline);
    }

    getCollaborationStats() {
        return {
            totalCollaborators: this.collaborators.size,
            activeSelections: this.remoteSelections.size,
            updateQueueLength: this.updateQueue.length,
            isProcessingUpdates: this.isProcessingUpdates
        };
    }
}

