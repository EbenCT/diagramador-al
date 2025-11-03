// resources/js/diagram/modules-ai/DiagramAIEditor.js
import { AICommandExecutor } from './AICommandExecutor.js';
import { EditorAIResponseParser } from './EditorAIResponseParser.js';
import { EditorAIVisualEnhancer } from './EditorAIVisualEnhancer.js';

export class DiagramAIEditor {
    constructor(diagramEditor) {
        this.diagramEditor = diagramEditor;
        this.commandExecutor = new AICommandExecutor(diagramEditor);
        this.responseParser = new EditorAIResponseParser();
        this.visualEnhancer = new EditorAIVisualEnhancer(diagramEditor);

        // Estados del editor
        this.currentState = 'ready';
        this.pendingCommands = null;
        this.previewData = null;

        // Componentes de UI
        this.editorPanel = null;
        this.voiceHandler = null;

        // Configuración de Groq - IGUAL QUE EL ANALIZADOR
        this.groqApiKey = window.AI_CONFIG?.GROQ_API_KEY ||
                         window.GROQ_API_KEY ||
                         null;

        this.groqModel = 'llama-3.1-8b-instant';

        // DEBUG: Verificar configuración
        console.log('🔑 DiagramAIEditor - Groq API Key configurada:', this.groqApiKey ? 'SÍ' : 'NO');
        console.log('🤖 Groq Model:', this.groqModel);

        this.initializeUI();
        this.initializeVoiceHandler();
        this.addEditorStyles();
    }

    initializeUI() {
        this.createEditorPanel();
        this.attachEventListeners();
    }

    createEditorPanel() {
        // Crear botón flotante al estilo del analizador
        const editButton = document.createElement('button');
        editButton.className = 'ai-floating-button-editor';
        editButton.innerHTML = `
            <span class="ai-icon">✏️</span>
            <span class="ai-text">Editar con IA</span>
        `;

        // Añadir al body como botón flotante
        document.body.appendChild(editButton);

        editButton.addEventListener('click', () => this.openEditor());

        // Crear mini panel del editor
        this.createEditorModal();

        console.log('✅ Botón flotante "Editar con IA" creado');
    }

    createEditorModal() {
        // Crear mini panel flotante (similar al analizador)
        this.editorPanel = document.createElement('div');
        this.editorPanel.id = 'ai-editor-mini-panel';
        this.editorPanel.className = 'ai-editor-mini-panel';
        this.editorPanel.innerHTML = `
            <div class="ai-mini-header">
                <div class="ai-header-left">
                    <span class="ai-header-icon">✏️</span>
                    <span class="ai-header-title">Editor IA</span>
                </div>
                <button class="ai-close-btn" id="ai-editor-close">✕</button>
            </div>
            <div class="ai-mini-content">
                <!-- Estado inicial: Métodos de input -->
                <div class="ai-form-state" id="ai-editor-form-state">
                    <!-- Input de texto compacto -->
                    <div class="ai-input-section">
                        <label class="ai-input-label">💬 Comando</label>
                        <textarea
                            id="ai-editor-text-input"
                            class="ai-command-input"
                            placeholder="Ej: Crea clase Usuario con email..."
                            maxlength="150"
                        ></textarea>
                        <div class="ai-char-counter">
                            <span id="ai-editor-char-count">0</span>/150
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="ai-action-buttons">
                        <button class="ai-voice-btn" id="ai-editor-voice-btn" title="Comando de voz">
                            🎤
                        </button>
                        <button class="ai-process-btn" id="ai-editor-process-btn">
                            ⚡ Procesar
                        </button>
                    </div>

                    <!-- Estado de voz -->
                    <div id="ai-voice-status" class="ai-voice-status">
                        Listo para comando
                    </div>
                </div>

                <!-- Estado de carga -->
                <div class="ai-loading-state" id="ai-editor-loading-state" style="display: none;">
                    <div class="ai-loading-icon">🔄</div>
                    <p class="ai-loading-text">Procesando comando...</p>
                    <div class="ai-progress-bar">
                        <div class="ai-progress-fill"></div>
                    </div>
                </div>

                <!-- Estado resultado -->
                <div class="ai-result-state" id="ai-editor-result-state" style="display: none;">
                    <div class="ai-result-summary">
                        <span class="ai-result-icon">✅</span>
                        <span class="ai-result-text">Comando procesado</span>
                    </div>
                    <div class="ai-changes-control">
                        <button class="ai-btn ai-btn-success" id="ai-editor-apply">
                            ✓ Aplicar
                        </button>
                        <button class="ai-btn ai-btn-danger" id="ai-editor-cancel">
                            ✗ Cancelar
                        </button>
                    </div>
                    <button class="ai-btn ai-btn-secondary" id="ai-editor-new-command">
                        🔄 Nuevo Comando
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.editorPanel);

        console.log('✅ Mini panel del editor creado');
    }

    attachEventListeners() {
        // Botón cerrar
        document.addEventListener('click', (e) => {
            if (e.target.id === 'ai-editor-close') {
                this.closeEditor();
            }
        });

        // Contador de caracteres y eventos de texto
        document.addEventListener('input', (e) => {
            if (e.target.id === 'ai-editor-text-input') {
                const count = e.target.value.length;
                const charCount = document.getElementById('ai-editor-char-count');
                if (charCount) {
                    charCount.textContent = count;
                    charCount.style.color = count > 120 ? '#ef4444' : '#6b7280';
                }
            }
        });

        // Botón procesar
        document.addEventListener('click', (e) => {
            if (e.target.id === 'ai-editor-process-btn') {
                this.processTextInput();
            }
        });

        // Botón voz (toggle)
        let isListening = false;
        document.addEventListener('click', (e) => {
            if (e.target.id === 'ai-editor-voice-btn') {
                if (!isListening) {
                    this.startVoiceInput();
                    isListening = true;
                    e.target.textContent = '🔴';
                    e.target.title = 'Detener grabación';
                } else {
                    this.stopVoiceInput();
                    isListening = false;
                    e.target.textContent = '🎤';
                    e.target.title = 'Comando de voz';
                }
            }
        });

        // Controles de resultado
        document.addEventListener('click', (e) => {
            if (e.target.id === 'ai-editor-apply') {
                this.applyChanges();
            } else if (e.target.id === 'ai-editor-cancel') {
                this.cancelPreview();
            } else if (e.target.id === 'ai-editor-new-command') {
                this.resetToForm();
            }
        });

        // Enter para procesar
        document.addEventListener('keydown', (e) => {
            if (e.target.id === 'ai-editor-text-input' && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processTextInput();
            }
        });

        console.log('✅ Eventos del editor configurados');
    }

    initializeVoiceHandler() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceHandler = new SpeechRecognition();

        this.voiceHandler.continuous = false;
        this.voiceHandler.interimResults = true;
        this.voiceHandler.lang = 'es-ES';

        this.voiceHandler.onstart = () => {
            this.updateVoiceStatus('Escuchando...', 'listening');
        };

        this.voiceHandler.onresult = (event) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                const textInput = document.getElementById('ai-editor-text-input');
                if (textInput) {
                    textInput.value = finalTranscript;
                    textInput.dispatchEvent(new Event('input'));
                }
                this.processCommand(finalTranscript);
            }
        };

        this.voiceHandler.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateVoiceStatus('Error en reconocimiento de voz', 'error');
        };

        this.voiceHandler.onend = () => {
            this.updateVoiceStatus('Listo para comando', 'ready');
        };
    }

    // ==================== CONTROL DEL EDITOR ====================

    openEditor() {
        this.editorPanel?.classList.add('ai-editor-mini-panel-visible');
        this.currentState = 'ready';
        this.resetToForm();
    }

    closeEditor() {
        this.editorPanel?.classList.remove('ai-editor-mini-panel-visible');
        this.resetToForm();
        this.pendingCommands = null;
        this.currentState = 'ready';
        this.visualEnhancer.clearPreviews();
    }

    resetToForm() {
        const formState = document.getElementById('ai-editor-form-state');
        const loadingState = document.getElementById('ai-editor-loading-state');
        const resultState = document.getElementById('ai-editor-result-state');

        if (formState) formState.style.display = 'block';
        if (loadingState) loadingState.style.display = 'none';
        if (resultState) resultState.style.display = 'none';

        // Limpiar campos
        const textInput = document.getElementById('ai-editor-text-input');
        if (textInput) {
            textInput.value = '';
            textInput.focus();
        }

        // Resetear contador
        const charCount = document.getElementById('ai-editor-char-count');
        if (charCount) charCount.textContent = '0';

        // Limpiar comandos pendientes
        this.pendingCommands = null;
        this.currentState = 'ready';
    }

    showLoadingState() {
        const formState = document.getElementById('ai-editor-form-state');
        const loadingState = document.getElementById('ai-editor-loading-state');
        const resultState = document.getElementById('ai-editor-result-state');

        if (formState) formState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'block';
        if (resultState) resultState.style.display = 'none';

        this.startProgressAnimation();
    }

    showResultState() {
        const formState = document.getElementById('ai-editor-form-state');
        const loadingState = document.getElementById('ai-editor-loading-state');
        const resultState = document.getElementById('ai-editor-result-state');

        if (formState) formState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'none';
        if (resultState) resultState.style.display = 'block';
    }

    startProgressAnimation() {
        const progressFill = document.querySelector('#ai-editor-mini-panel .ai-progress-fill');
        if (!progressFill) return;

        progressFill.style.width = '0%';
        progressFill.style.transition = 'width 2s ease-out';

        setTimeout(() => {
            progressFill.style.width = '100%';
        }, 100);
    }

    // ==================== PROCESAMIENTO DE COMANDOS ====================

    processTextInput() {
        const textInput = document.getElementById('ai-editor-text-input');
        const command = textInput?.value.trim();

        if (!command) return;

        this.processCommand(command);
    }

    async processCommand(command) {
        try {
            this.currentState = 'processing';
            this.showLoadingState();

            // Obtener contexto del diagrama
            const diagramContext = this.getDiagramContext();

            // Enviar a Groq
            const response = await this.sendToGroq(command, diagramContext);

            console.log('🔍 DEBUG - Respuesta cruda de Groq:', response);

            // USAR PARSER ESPECÍFICO PARA EDITOR
            const commands = this.responseParser.parseResponse(response);

            console.log('🔍 DEBUG - Comandos parseados:', commands);
            console.log('🔍 DEBUG - Número de comandos:', commands ? commands.length : 0);

            if (commands && commands.length > 0) {
                this.pendingCommands = commands;

                // ✨ MOSTRAR PREVIEW VISUAL MEJORADO
                this.visualEnhancer.showPreview(commands);

                this.showResultState();
            } else {
                this.showError('No se pudieron generar comandos válidos para tu solicitud.');
                this.resetToForm();
            }

        } catch (error) {
            console.error('Error processing command:', error);
            this.showError('Error procesando el comando: ' + error.message);
            this.resetToForm();
        }
    }

    async sendToGroq(command, diagramContext) {
        if (!this.groqApiKey) {
            throw new Error('API Key de Groq no está configurada');
        }

        const prompt = this.buildEditPrompt(command, diagramContext);

        console.log('📤 DiagramAIEditor enviando a Groq:', {
            model: this.groqModel,
            hasApiKey: !!this.groqApiKey,
            promptLength: prompt.length
        });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.groqModel,
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente experto en diagramas UML que convierte comandos en acciones específicas. Responde ÚNICAMENTE con JSON válido.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        console.log('📥 Respuesta de Groq (Editor):', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error de Groq (Editor):', errorData);
            throw new Error(`Groq API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos de Groq (Editor):', data);

        return data.choices[0]?.message?.content || '';
    }

    buildEditPrompt(command, diagramContext) {
        return `
SISTEMA: Convertir comando de usuario en acciones UML específicas.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido usando estos formatos EXACTOS:

=== CREAR CLASE ===
{
    "commands": [
        {
            "action": "CREATE_CLASS",
            "className": "NombreDeLaClase",
            "position": {"x": 100, "y": 100},
            "attributes": ["- email: String", "+ nombre: String"],
            "methods": ["+ login(): void"]
        }
    ]
}

=== ELIMINAR CLASE ===
{
    "commands": [
        {
            "action": "DELETE_CLASS",
            "className": "NombreDeLaClase"
        }
    ]
}

=== RENOMBRAR CLASE ===
{
    "commands": [
        {
            "action": "RENAME_CLASS",
            "oldName": "NombreViejo",
            "newName": "NombreNuevo"
        }
    ]
}

=== AGREGAR ATRIBUTO ===
{
    "commands": [
        {
            "action": "ADD_ATTRIBUTE",
            "className": "Usuario",
            "attribute": {
                "name": "email",
                "type": "String",
                "visibility": "private"
            }
        }
    ]
}

=== ELIMINAR ATRIBUTO ===
{
    "commands": [
        {
            "action": "DELETE_ATTRIBUTE",
            "className": "Usuario",
            "attributeName": "email"
        }
    ]
}

=== CREAR RELACIÓN ===
{
    "commands": [
        {
            "action": "CREATE_RELATION",
            "sourceClass": "Usuario",
            "targetClass": "Pedido",
            "relationType": "association",
            "sourceMultiplicity": "1",
            "targetMultiplicity": "0..*",
            "relationName": "realiza"
        }
    ]
}

=== ELIMINAR RELACIÓN ===
{
    "commands": [
        {
            "action": "DELETE_RELATION",
            "sourceClass": "Usuario",
            "targetClass": "Pedido"
        }
    ]
}

=== CAMBIAR MULTIPLICIDAD ===
{
    "commands": [
        {
            "action": "EDIT_MULTIPLICITY",
            "sourceClass": "Usuario",
            "targetClass": "Pedido",
            "sourceMultiplicity": "1..*",
            "targetMultiplicity": "0..5"
        }
    ]
}

TIPOS DE RELACIÓN:
- "association": Relación general (conoce/usa) - línea simple
- "composition": Relación "parte de" fuerte (rombo negro) - las partes no existen sin el todo
- "aggregation": Relación "tiene un" débil (rombo blanco) - las partes pueden existir independientemente
- "inheritance": Relación "es un" (flecha triangular) - herencia de clase

MULTIPLICIDADES: "1", "0..1", "0..*", "1..*", "1..5", "*"
VISIBILIDADES: "public" (+), "private" (-), "protected" (#)

EJEMPLOS DE RELACIONES:
- "crear herencia entre Animal y Perro" -> relationType: "inheritance"
- "crear composición entre Casa y Habitación" -> relationType: "composition"
- "crear agregación entre Universidad y Estudiante" -> relationType: "aggregation"
- "crear asociación entre Cliente y Pedido" -> relationType: "association"

DIAGRAMA ACTUAL:
${diagramContext}

COMANDO DEL USUARIO: "${command}"

Analiza el comando y devuelve SOLO el JSON correspondiente, sin explicaciones.
        `.trim();
    }

    getDiagramContext() {
        // Obtener estado actual del diagrama
        const elements = this.diagramEditor.graph.getElements();
        const links = this.diagramEditor.graph.getLinks();

        const context = {
            classes: [],
            relations: []
        };

        // Procesar elementos (clases)
        elements.forEach(element => {
            if (element.get('type') === 'uml.Class') {
                const umlData = element.get('umlData') || {};
                context.classes.push({
                    name: umlData.className || element.get('name') || 'Unnamed',
                    attributes: umlData.attributes || [],
                    methods: umlData.methods || []
                });
            }
        });

        // Procesar enlaces (relaciones)
        links.forEach(link => {
            const sourceElement = link.getSourceElement();
            const targetElement = link.getTargetElement();

            if (sourceElement && targetElement) {
                const sourceUML = sourceElement.get('umlData') || {};
                const targetUML = targetElement.get('umlData') || {};
                const linkData = link.get('linkData') || {};

                context.relations.push({
                    source: sourceUML.className || 'Unknown',
                    target: targetUML.className || 'Unknown',
                    type: linkData.type || 'association',
                    sourceMultiplicity: linkData.sourceMultiplicity || '1',
                    targetMultiplicity: linkData.targetMultiplicity || '1',
                    name: linkData.name || ''
                });
            }
        });

        return JSON.stringify(context, null, 2);
    }


async applyChanges() {
    if (!this.pendingCommands) return;

    try {
        this.currentState = 'executing';

        // Limpiar previews
        this.visualEnhancer.clearPreviews();

        // Ejecutar comandos usando el AICommandExecutor existente
        for (const command of this.pendingCommands) {
            console.log(`🔄 Ejecutando comando: ${command.action}`);

            const result = await this.commandExecutor.executeCommand(command);

            console.log(`✅ Resultado del comando:`, result);

            // ✨ MEJORAR VISUAL INMEDIATAMENTE DESPUÉS DE CREAR
            if (result.success && command.action === 'CREATE_CLASS') {
                // DAR TIEMPO PARA QUE SE RENDERICE
                setTimeout(() => {
                    const newElement = this.findElementByClassName(command.className);
                    if (newElement) {
                        console.log(`🎨 Aplicando mejoras visuales a: ${command.className}`);
                        this.visualEnhancer.enhanceNewClass(newElement, false);
                    } else {
                        console.warn(`⚠️ No se encontró elemento creado: ${command.className}`);
                    }
                }, 100);
            }
        }

        this.showSuccess('Cambios aplicados exitosamente');
        this.resetToForm();

    } catch (error) {
        console.error('Error applying changes:', error);
        this.showError('Error aplicando los cambios: ' + error.message);
    }
}

    cancelPreview() {
        this.pendingCommands = null;
        this.currentState = 'ready';
        this.visualEnhancer.clearPreviews();
        this.resetToForm();
    }

    // ==================== UTILIDADES ====================

// En DiagramAIEditor.js - Debug temporal - Case insensitive
findElementByClassName(className) {
    const elements = this.diagramEditor.graph.getElements();
    console.log(`🔍 Buscando clase: ${className}`);
    console.log(`📊 Elementos en el grafo:`, elements.length);

    const found = elements.find(element => {
        const umlData = element.get('umlData');
        const matches = umlData?.className?.toLowerCase() === className?.toLowerCase();
        if (matches) {
            console.log(`✅ Encontrado: ${className}`, element);
        }
        return matches;
    });

    if (!found) {
        console.warn(`❌ No se encontró clase: ${className}`);
        console.log('Clases disponibles:', elements.map(el => el.get('umlData')?.className));
    }

    return found;
}

    startVoiceInput() {
        if (!this.voiceHandler) return;

        try {
            this.voiceHandler.start();
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    }

    stopVoiceInput() {
        if (!this.voiceHandler) return;

        try {
            this.voiceHandler.stop();
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    }

    updateVoiceStatus(status, state) {
        const statusEl = document.getElementById('ai-voice-status');

        if (statusEl) {
            statusEl.textContent = status;

            switch (state) {
                case 'listening':
                    statusEl.style.color = '#ef4444';
                    statusEl.style.fontWeight = 'bold';
                    break;
                case 'error':
                    statusEl.style.color = '#dc2626';
                    statusEl.style.fontWeight = 'normal';
                    break;
                default:
                    statusEl.style.color = '#6b7280';
                    statusEl.style.fontWeight = 'normal';
            }
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    addEditorStyles() {
        if (document.getElementById('ai-editor-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-editor-styles';
        styles.textContent = `
            /* Botón flotante del editor */
            .ai-floating-button-editor {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: linear-gradient(45deg, #7c3aed, #a855f7);
                color: white;
                border: none;
                border-radius: 50px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                user-select: none;
            }

            .ai-floating-button-editor:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
            }

            /* Mini panel del editor */
            .ai-editor-mini-panel {
                position: fixed;
                bottom: 140px;
                right: 20px;
                width: 280px;
                max-height: 350px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                z-index: 999;
                transform: translateX(320px);
                transition: transform 0.3s ease;
                border: 1px solid #e5e7eb;
                overflow: hidden;
                font-family: system-ui, -apple-system, sans-serif;
            }

            .ai-editor-mini-panel-visible {
                transform: translateX(0);
            }

            .ai-mini-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: linear-gradient(45deg, #7c3aed, #a855f7);
                color: white;
            }

            .ai-header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ai-header-title {
                font-weight: 600;
                font-size: 14px;
            }

            .ai-close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .ai-close-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .ai-mini-content {
                padding: 16px;
            }

            /* Input section */
            .ai-input-section {
                margin-bottom: 12px;
            }

            .ai-input-label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
            }

            .ai-command-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 12px;
                resize: vertical;
                min-height: 50px;
                max-height: 80px;
                transition: border-color 0.2s;
                box-sizing: border-box;
            }

            .ai-command-input:focus {
                outline: none;
                border-color: #7c3aed;
                box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
            }

            .ai-char-counter {
                text-align: right;
                font-size: 11px;
                color: #6b7280;
                margin-top: 4px;
            }

            /* Action buttons */
            .ai-action-buttons {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }

            .ai-voice-btn {
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 44px;
            }

            .ai-voice-btn:hover {
                background: #dc2626;
                transform: scale(1.05);
            }

            .ai-process-btn {
                flex: 1;
                background: linear-gradient(45deg, #7c3aed, #a855f7);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ai-process-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
            }

            .ai-voice-status {
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                padding: 4px;
                background: #f9fafb;
                border-radius: 4px;
            }

            /* Estados (loading, result) */
            .ai-loading-state {
                text-align: center;
            }

            .ai-loading-icon {
                font-size: 24px;
                animation: spin 1s linear infinite;
            }

            .ai-loading-text {
                margin: 8px 0;
                font-size: 12px;
                color: #6b7280;
            }

            .ai-progress-bar {
                width: 100%;
                height: 4px;
                background: #f3f4f6;
                border-radius: 2px;
                overflow: hidden;
                margin: 12px 0;
            }

            .ai-progress-fill {
                height: 100%;
                background: linear-gradient(45deg, #7c3aed, #a855f7);
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            .ai-result-summary {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                font-size: 13px;
                font-weight: 500;
            }

            .ai-changes-control {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }

            .ai-btn {
                flex: 1;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ai-btn-success {
                background: #10b981;
                color: white;
            }

            .ai-btn-success:hover {
                background: #059669;
            }

            .ai-btn-danger {
                background: #ef4444;
                color: white;
            }

            .ai-btn-danger:hover {
                background: #dc2626;
            }

            .ai-btn-secondary {
                width: 100%;
                background: #f3f4f6;
                color: #374151;
            }

            .ai-btn-secondary:hover {
                background: #e5e7eb;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(styles);
    }
}
