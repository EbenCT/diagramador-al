// resources/js/diagram/DiagramWebSocketManager.js
// Módulo especializado para gestión de WebSockets
// Integra con la arquitectura modular existente

export class DiagramWebSocketManager {
    constructor(editor) {
        this.editor = editor;
        this.echo = null;
        this.channel = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.sessionId = null;
        this.userId = null;

        console.log('🔌 DiagramWebSocketManager inicializado');
    }

    // ==================== INICIALIZACIÓN ====================

    async initialize() {
        try {
            // Obtener datos de sesión
            this.sessionId = window.diagramSessionId || 'default';
            this.userId = window.authUser?.id || 'anonymous_' + Date.now();

            console.log(`🔗 Conectando a sesión: ${this.sessionId}`);

            // Configurar Laravel Echo
            this.setupLaravelEcho();

            // Conectar al canal del diagrama
            await this.connectToChannel();

            // Configurar eventos
            this.setupChannelEvents();

            console.log('✅ WebSocket Manager inicializado correctamente');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando WebSockets:', error);
            this.showConnectionError(error);
            return false;
        }
    }

    setupLaravelEcho() {
        if (!window.Echo) {
            throw new Error('Laravel Echo no está disponible');
        }

        this.echo = window.Echo;
        console.log('📡 Laravel Echo configurado');
    }

    async connectToChannel() {
        const channelName = `diagram.${this.sessionId}`;

        this.channel = this.echo.private(channelName);

        // Verificar conexión
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout conectando al canal'));
            }, 10000);

            this.channel.subscribed(() => {
                clearTimeout(timeout);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log(`✅ Conectado al canal: ${channelName}`);
                resolve();
            });

            this.channel.error((error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    // ==================== EVENTOS DEL CANAL ====================

    setupChannelEvents() {
        // Evento: Diagrama actualizado
        this.channel.listen('DiagramUpdated', (event) => {
            this.handleDiagramUpdate(event);
        });

        // Evento: Usuario se unió
        this.channel.listen('UserJoinedSession', (event) => {
            this.handleUserJoined(event);
        });

        // Evento: Usuario salió
        this.channel.listen('UserLeftSession', (event) => {
            this.handleUserLeft(event);
        });

        // Evento: Cursor movido
        this.channel.listen('CursorMoved', (event) => {
            this.handleCursorMoved(event);
        });

        // Evento: Elemento seleccionado
        this.channel.listen('ElementSelected', (event) => {
            this.handleElementSelected(event);
        });

        // Eventos de presencia del usuario
        this.channel.here((users) => {
            this.handleUsersHere(users);
        });

        this.channel.joining((user) => {
            this.handleUserJoining(user);
        });

        this.channel.leaving((user) => {
            this.handleUserLeaving(user);
        });

        console.log('🎧 Event listeners configurados');
    }

    // ==================== MANEJADORES DE EVENTOS ====================

    handleDiagramUpdate(event) {
        if (event.userId === this.userId) {
            return; // Ignorar nuestros propios cambios
        }

        console.log('📊 Actualización de diagrama recibida:', event);

        // Delegar al CollaborationManager
        if (this.editor.collaborationManager) {
            this.editor.collaborationManager.applyRemoteUpdate(event);
        }
    }

    handleUserJoined(event) {
        console.log(`👤 Usuario se unió: ${event.user.name}`);

        if (this.editor.collaborationManager) {
            this.editor.collaborationManager.addCollaborator(event.user);
        }

        this.showNotification(`${event.user.name} se unió al diagrama`, 'info');
    }

    handleUserLeft(event) {
        console.log(`👤 Usuario salió: ${event.user.name}`);

        if (this.editor.collaborationManager) {
            this.editor.collaborationManager.removeCollaborator(event.user);
        }

        this.showNotification(`${event.user.name} salió del diagrama`, 'info');
    }

    handleCursorMoved(event) {
        if (event.userId === this.userId) {
            return; // Ignorar nuestro propio cursor
        }

        if (this.editor.cursorManager) {
            this.editor.cursorManager.updateRemoteCursor(event.userId, event.position, event.user);
        }
    }

    handleElementSelected(event) {
        if (event.userId === this.userId) {
            return;
        }

        if (this.editor.collaborationManager) {
            this.editor.collaborationManager.highlightRemoteSelection(event.elementId, event.user);
        }
    }

    handleUsersHere(users) {
        console.log('👥 Usuarios presentes:', users);

        if (this.editor.collaborationManager) {
            this.editor.collaborationManager.updateCollaboratorsList(users);
        }
    }

    handleUserJoining(user) {
        this.handleUserJoined({ user });
    }

    handleUserLeaving(user) {
        this.handleUserLeft({ user });
    }

    // ==================== ENVÍO DE EVENTOS ====================

    broadcastDiagramUpdate(updateData) {
        if (!this.isConnected) {
            console.warn('⚠️ No conectado - no se puede enviar actualización');
            return;
        }

        const payload = {
            sessionId: this.sessionId,
            userId: this.userId,
            updateType: updateData.type,
            data: updateData.data,
            timestamp: Date.now()
        };

        this.channel.whisper('diagram.update', payload);
        console.log('📤 Actualización enviada:', payload);
    }

    broadcastCursorMove(position) {
        if (!this.isConnected) return;

        this.channel.whisper('cursor.move', {
            userId: this.userId,
            position: position,
            timestamp: Date.now()
        });
    }

    broadcastElementSelection(elementId) {
        if (!this.isConnected) return;

        this.channel.whisper('element.select', {
            userId: this.userId,
            elementId: elementId,
            timestamp: Date.now()
        });
    }

    // ==================== GESTIÓN DE CONEXIÓN ====================

    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo de intentos de reconexión alcanzado');
            this.showConnectionError('No se pudo reconectar al servidor');
            return false;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        try {
            await this.connectToChannel();
            this.setupChannelEvents();
            console.log('✅ Reconectado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error en reconexión:', error);

            // Esperar antes del siguiente intento
            setTimeout(() => {
                this.reconnect();
            }, 2000 * this.reconnectAttempts);

            return false;
        }
    }

    disconnect() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }

        this.isConnected = false;
        console.log('🔌 WebSocket desconectado');
    }

    // ==================== UTILIDADES ====================

    showNotification(message, type = 'info') {
        // Integrar con el sistema de notificaciones existente
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        }
    }

    showConnectionError(error) {
        const message = typeof error === 'string' ? error : 'Error de conexión WebSocket';
        this.showNotification(message, 'error');
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            sessionId: this.sessionId,
            userId: this.userId,
            reconnectAttempts: this.reconnectAttempts,
            channelName: this.channel ? `diagram.${this.sessionId}` : null
        };
    }

    // ==================== INTEGRACIÓN CON MÓDULOS EXISTENTES ====================

    integrateWithSaveManager() {
        if (!this.editor.saveManager) return;

        // Interceptar guardado para broadcast
        const originalSave = this.editor.saveManager.saveDiagram.bind(this.editor.saveManager);

        this.editor.saveManager.saveDiagram = () => {
            const result = originalSave();

            // Broadcast cambio después del guardado
            this.broadcastDiagramUpdate({
                type: 'diagram_saved',
                data: this.editor.graph.toJSON()
            });

            return result;
        };

        console.log('🔗 Integrado con SaveManager');
    }

    integrateWithClassManager() {
        if (!this.editor.classManager) return;

        // Interceptar creación/actualización de clases
        const originalUpdate = this.editor.classManager.updateClassElement.bind(this.editor.classManager);

        this.editor.classManager.updateClassElement = (element, className, attributes, methods, type, uml25Config) => {
            const result = originalUpdate(element, className, attributes, methods, type, uml25Config);

            // Broadcast cambio de clase
            this.broadcastDiagramUpdate({
                type: 'class_updated',
                data: {
                    elementId: element.id,
                    umlData: {
                        className,
                        attributes,
                        methods,
                        type,
                        uml25: uml25Config
                    }
                }
            });

            return result;
        };

        console.log('🔗 Integrado con ClassManager');
    }

    integrateWithRelationshipManager() {
        if (!this.editor.relationshipManager) return;

        // Interceptar creación de relaciones
        const originalCreate = this.editor.relationshipManager.createRelationshipImproved.bind(this.editor.relationshipManager);

        this.editor.relationshipManager.createRelationshipImproved = (source, target) => {
            const result = originalCreate(source, target);

            // Broadcast nueva relación
            this.broadcastDiagramUpdate({
                type: 'relationship_created',
                data: {
                    sourceId: source.id,
                    targetId: target.id,
                    relationshipType: this.editor.selectedTool
                }
            });

            return result;
        };

        console.log('🔗 Integrado con RelationshipManager');
    }
}

