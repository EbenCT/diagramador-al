// resources/js/diagram/modules-ai/DiagramAIAnalyzer.js
// Módulo de análisis de diagramas UML con IA - VERSIÓN REFACTORIZADA
// Implementa mini-panel flotante, animaciones y modificaciones inteligentes

import { AIAnimationManager } from './AIAnimationManager.js';
import { AIBubbleRenderer } from './AIBubbleRenderer.js';
import { AIResponseParser } from './AIResponseParser.js';
import { AIChangePreview } from './AIChangePreview.js';
import { AICommandExecutor } from './AICommandExecutor.js';

export class DiagramAIAnalyzer {
    constructor(editor) {
        this.editor = editor;
        this.apiKey = null;
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.1-8b-instant';

        // Estados
        this.isVisible = false;
        this.isAnalyzing = false;
        this.currentAnalysis = null;
        this.pendingChanges = [];

        // UI Referencias
        this.floatingButton = null;
        this.miniPanel = null;

        // Módulos especializados
        this.animationManager = new AIAnimationManager(editor);
        this.bubbleRenderer = new AIBubbleRenderer(editor);
        this.responseParser = new AIResponseParser(editor);
        this.changePreview = new AIChangePreview(editor);
        this.commandExecutor = new AICommandExecutor(editor);

        this.initializeAI();
    }

    // ==================== INICIALIZACIÓN ====================

    initializeAI() {
        console.log('🤖 Inicializando módulo de IA refactorizado...');

        // Obtener API key
        this.apiKey = window.AI_CONFIG?.GROQ_API_KEY ||
                     window.GROQ_API_KEY ||
                     null;

        if (!this.apiKey) {
            console.warn('⚠️ API key de Groq no configurada');
        }

        this.createFloatingButton();
        this.createMiniPanel();
        this.addStyles();

        console.log('✅ Módulo de IA refactorizado inicializado');
    }

    // ==================== INTERFAZ DE USUARIO ====================

    createFloatingButton() {
        this.floatingButton = document.createElement('button');
        this.floatingButton.innerHTML = `
            <span class="ai-icon">🤖</span>
            <span class="ai-text">Analizar con IA</span>
        `;
        this.floatingButton.className = 'ai-floating-button-v2';
        this.floatingButton.onclick = () => this.toggleMiniPanel();

        document.body.appendChild(this.floatingButton);
        console.log('✅ Botón flotante creado');
    }

    createMiniPanel() {
        this.miniPanel = document.createElement('div');
        this.miniPanel.className = 'ai-mini-panel';
        this.miniPanel.innerHTML = `
            <div class="ai-mini-header">
                <div class="ai-header-left">
                    <span class="ai-header-icon">🤖</span>
                    <span class="ai-header-title">Análisis IA</span>
                </div>
                <button class="ai-close-btn" id="ai-mini-close">✕</button>
            </div>
            <div class="ai-mini-content">
                <!-- Estado inicial: Formulario -->
                <div class="ai-form-state" id="ai-form-state">
                    <div class="ai-context-section">
                        <label class="ai-context-label">📝 Contexto (opcional)</label>
                        <textarea
                            id="ai-context-input-v2"
                            class="ai-context-input-v2"
                            placeholder="Ej: Sistema de e-commerce, validar relaciones producto-pedido..."
                            maxlength="200"
                        ></textarea>
                        <div class="ai-char-counter">
                            <span id="ai-char-count">0</span>/200
                        </div>
                    </div>
                    <button class="ai-analyze-btn-v2" id="ai-analyze-btn-v2">
                        🚀 Analizar Diagrama
                    </button>
                </div>

                <!-- Estado de carga: Animación -->
                <div class="ai-loading-state" id="ai-loading-state" style="display: none;">
                    <div class="ai-loading-icon">🔄</div>
                    <p class="ai-loading-text">Analizando diagrama...</p>
                    <div class="ai-progress-bar">
                        <div class="ai-progress-fill"></div>
                    </div>
                </div>

                <!-- Estado resultado: Control de cambios -->
                <div class="ai-result-state" id="ai-result-state" style="display: none;">
                    <div class="ai-result-summary">
                        <span class="ai-result-icon">✅</span>
                        <span class="ai-result-text">Análisis completado</span>
                    </div>
                    <div class="ai-changes-control">
                        <button class="ai-btn ai-btn-success" id="ai-apply-all">
                            ✓ Aplicar Todo
                        </button>
                        <button class="ai-btn ai-btn-danger" id="ai-discard-all">
                            ✗ Descartar Todo
                        </button>
                    </div>
                    <button class="ai-btn ai-btn-secondary" id="ai-analyze-again">
                        🔄 Analizar Nuevamente
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.miniPanel);
        this.setupMiniPanelEvents();
        console.log('✅ Mini panel creado');
    }

    setupMiniPanelEvents() {
        // Cerrar panel
        document.getElementById('ai-mini-close').onclick = () => this.hideMiniPanel();

        // Contador de caracteres
        const contextInput = document.getElementById('ai-context-input-v2');
        const charCount = document.getElementById('ai-char-count');
        contextInput.oninput = () => {
            const count = contextInput.value.length;
            charCount.textContent = count;
            charCount.style.color = count > 150 ? '#ef4444' : '#6b7280';
        };

        // Botón analizar
        document.getElementById('ai-analyze-btn-v2').onclick = () => this.startAnalysis();

        // Controles de cambios
        document.getElementById('ai-apply-all').onclick = () => this.applyAllChanges();
        document.getElementById('ai-discard-all').onclick = () => this.discardAllChanges();
        document.getElementById('ai-analyze-again').onclick = () => this.resetToForm();

        console.log('✅ Eventos del mini panel configurados');
    }

    // ==================== ESTADOS DEL PANEL ====================

    toggleMiniPanel() {
        if (this.isVisible) {
            this.hideMiniPanel();
        } else {
            this.showMiniPanel();
        }
    }

    showMiniPanel() {
        this.miniPanel.classList.add('ai-mini-panel-visible');
        this.floatingButton.querySelector('.ai-text').textContent = 'Cerrar IA';
        this.isVisible = true;
    }

    hideMiniPanel() {
        this.miniPanel.classList.remove('ai-mini-panel-visible');
        this.floatingButton.querySelector('.ai-text').textContent = 'Analizar con IA';
        this.isVisible = false;

        // Limpiar elementos visuales si el panel se cierra
        this.clearAllVisualElements();
    }

    showFormState() {
        document.getElementById('ai-form-state').style.display = 'block';
        document.getElementById('ai-loading-state').style.display = 'none';
        document.getElementById('ai-result-state').style.display = 'none';
    }

    showLoadingState() {
        document.getElementById('ai-form-state').style.display = 'none';
        document.getElementById('ai-loading-state').style.display = 'block';
        document.getElementById('ai-result-state').style.display = 'none';

        // Iniciar animación de progreso
        this.startProgressAnimation();
    }

    showResultState() {
        document.getElementById('ai-form-state').style.display = 'none';
        document.getElementById('ai-loading-state').style.display = 'none';
        document.getElementById('ai-result-state').style.display = 'block';
    }

    resetToForm() {
        this.showFormState();
        this.clearAllVisualElements();
        this.pendingChanges = [];

        // Focus en textarea para nuevo análisis
        const contextInput = document.getElementById('ai-context-input-v2');
        if (contextInput) {
            contextInput.focus();
        }
    }

    startProgressAnimation() {
        const progressFill = document.querySelector('.ai-progress-fill');
        if (!progressFill) return;

        progressFill.style.width = '0%';
        progressFill.style.transition = 'width 2s ease-out';

        setTimeout(() => {
            progressFill.style.width = '100%';
        }, 100);
    }

    // ==================== ANÁLISIS PRINCIPAL ====================

    async startAnalysis() {
        if (this.isAnalyzing) return;

        try {
            this.isAnalyzing = true;
            this.showLoadingState();

            // Iniciar animación de escaneo del canvas
            await this.animationManager.startScanAnimation();

            // Extraer datos del diagrama
            const diagramData = this.extractDiagramData();

            if (diagramData.classes.length === 0) {
                this.showError('⚠️ No hay clases en el diagrama para analizar');
                return;
            }

            // Obtener contexto del usuario
            const userContext = document.getElementById('ai-context-input-v2').value.trim();

            // Enviar a IA
            const response = await this.sendToAI(diagramData, userContext);

            // Procesar respuesta
            await this.processAIResponse(response);

        } catch (error) {
            console.error('❌ Error en análisis:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            this.isAnalyzing = false;
            this.animationManager.stopScanAnimation();
        }
    }

async processAIResponse(response) {
    try {
        // Parsear respuesta para extraer comandos
        const parsedResponse = this.responseParser.parseResponse(response);

        // Validar cambios antes de mostrar preview
        if (parsedResponse.changes) {
            parsedResponse.changes = this.responseParser.validateChanges(parsedResponse.changes);
        }

        // Solo continuar si hay cambios válidos
        if (parsedResponse.changes && parsedResponse.changes.length > 0) {
            this.pendingChanges = parsedResponse.changes;

            // Mostrar burbujas con información general
            if (parsedResponse.bubbles && parsedResponse.bubbles.length > 0) {
                this.bubbleRenderer.showBubbles(parsedResponse.bubbles);
            }

            // Mostrar preview de cambios
            await this.changePreview.showChangesPreview(this.pendingChanges);

            // Cambiar a estado de resultado
            this.showResultState();
        } else {
            // No hay cambios válidos, mostrar mensaje
            this.bubbleRenderer.showBubbles([{
                type: 'info',
                message: '✅ El diagrama está bien diseñado, no se encontraron mejoras necesarias.',
                targetClass: null
            }]);

            this.resetToForm();
        }

        this.currentAnalysis = parsedResponse;

    } catch (error) {
        console.error('❌ Error procesando respuesta de IA:', error);
        this.showError(`Error procesando respuesta: ${error.message}`);
    }
}

    // ==================== GESTIÓN DE CAMBIOS ====================

    async applyAllChanges() {
        if (!this.pendingChanges || this.pendingChanges.length === 0) return;

        try {
            console.log('🔄 Aplicando todos los cambios...');

            // Ocultar preview
            this.changePreview.hidePreview();

            // Ejecutar cambios
            await this.commandExecutor.executeChanges(this.pendingChanges);

            // Limpiar estado
            this.pendingChanges = [];
            this.resetToForm();

            // Mostrar confirmación
            this.showSuccess('✅ Cambios aplicados correctamente');

        } catch (error) {
            console.error('❌ Error aplicando cambios:', error);
            this.showError(`Error aplicando cambios: ${error.message}`);
        }
    }

    async discardAllChanges() {
        console.log('🗑️ Descartando todos los cambios...');

        // Ocultar preview
        this.changePreview.hidePreview();

        // Limpiar burbujas
        this.bubbleRenderer.clearBubbles();

        // Limpiar estado
        this.pendingChanges = [];
        this.resetToForm();
    }

    // ==================== EXTRACCIÓN DE DATOS ====================

    extractDiagramData() {
        const elements = this.editor.graph.getElements();
        const links = this.editor.graph.getLinks();

        const classes = elements.map(element => {
            const umlData = element.get('umlData') || {};
            return {
                id: element.id,
                name: umlData.className || 'UnnamedClass',
                type: umlData.type || 'class',
                attributes: umlData.attributes || [],
                methods: umlData.methods || [],
                position: element.position(),
                uml25: umlData.uml25 || null
            };
        });

        const relationships = links.map(link => {
            const linkData = link.get('linkData') || {};
            return {
                id: link.id,
                type: linkData.type || 'association',
                source: link.getSourceElement()?.get('umlData')?.className || 'Unknown',
                target: link.getTargetElement()?.get('umlData')?.className || 'Unknown',
                sourceMultiplicity: linkData.sourceMultiplicity,
                targetMultiplicity: linkData.targetMultiplicity,
                name: linkData.name
            };
        });

        return { classes, relationships };
    }

    // ==================== COMUNICACIÓN CON IA ====================

    async sendToAI(diagramData, userContext) {
        if (!this.apiKey) {
            throw new Error('API key de Groq no configurada');
        }

        const prompt = this.buildOptimizedPrompt(diagramData, userContext);

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`Error API: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'Sin respuesta';
    }

buildOptimizedPrompt(diagramData, userContext) {
    const diagramText = this.formatDiagramForAI(diagramData);

    return `Eres un experto en diseño UML. Analiza este diagrama existente y SOLO sugiere mejoras que NO dupliquen lo que ya existe.

DIAGRAMA ACTUAL:
${diagramText}

CONTEXTO: ${userContext || 'Análisis general del diagrama'}

REGLAS IMPORTANTES:
- NO crear clases que ya existen
- NO agregar atributos que ya están en las clases
- NO agregar métodos que ya existen
- SOLO sugerir mejoras reales y nuevas funcionalidades
- REVISAR cuidadosamente qué ya existe antes de sugerir

RESPONDE EN ESTE FORMATO EXACTO:
ANÁLISIS: [tu análisis corto sobre la calidad del diagrama]

COMANDOS:
- CREAR_CLASE: [nombre] | ATRIBUTOS: [lista] | MÉTODOS: [lista] (SOLO si la clase NO existe)
- AGREGAR_ATRIBUTO: [clase] | [atributo] (SOLO si el atributo NO existe en esa clase)
- AGREGAR_MÉTODO: [clase] | [método] (SOLO si el método NO existe en esa clase)
- CREAR_RELACIÓN: [tipo] | [clase1] -> [clase2] | [multiplicidad] (SOLO si la relación NO existe)

Máximo 4 comandos. Si el diagrama está completo, di "COMANDOS: NINGUNO"`;
}

formatDiagramForAI(diagramData) {
    let text = `=== DIAGRAMA EXISTENTE ===\n\n`;

    // Formatear clases con TODOS sus detalles
    text += `CLASES EXISTENTES (${diagramData.classes.length}):\n`;
    diagramData.classes.forEach(cls => {
        text += `\n📦 CLASE: ${cls.name} (${cls.type})\n`;

        if (cls.attributes && cls.attributes.length > 0) {
            text += `   ATRIBUTOS EXISTENTES:\n`;
            cls.attributes.forEach(attr => {
                text += `   ✓ ${attr}\n`;
            });
        } else {
            text += `   ATRIBUTOS: ninguno\n`;
        }

        if (cls.methods && cls.methods.length > 0) {
            text += `   MÉTODOS EXISTENTES:\n`;
            cls.methods.forEach(method => {
                text += `   ✓ ${method}\n`;
            });
        } else {
            text += `   MÉTODOS: ninguno\n`;
        }
        text += `\n`;
    });

    // Formatear relaciones existentes
    if (diagramData.relationships && diagramData.relationships.length > 0) {
        text += `RELACIONES EXISTENTES (${diagramData.relationships.length}):\n`;
        diagramData.relationships.forEach(rel => {
            text += `🔗 ${rel.source} ---(${rel.type})---> ${rel.target}\n`;
        });
    } else {
        text += `RELACIONES EXISTENTES: ninguna\n`;
    }

    text += `\n=== FIN DEL DIAGRAMA EXISTENTE ===\n`;

    return text;
}

    // ==================== UTILIDADES ====================

    clearAllVisualElements() {
        this.bubbleRenderer.clearBubbles();
        this.changePreview.hidePreview();
        this.animationManager.stopScanAnimation();
    }

    showError(message) {
        console.error('❌', message);
        this.bubbleRenderer.showErrorBubble(message);
        this.resetToForm();
    }

    showSuccess(message) {
        console.log('✅', message);
        this.bubbleRenderer.showSuccessBubble(message);
    }

    // ==================== ESTILOS CSS ====================

    addStyles() {
        if (document.getElementById('ai-analyzer-v2-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-analyzer-v2-styles';
        styles.textContent = `
            /* Botón flotante mejorado */
            .ai-floating-button-v2 {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(45deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                border-radius: 50px;
                padding: 12px 20px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                user-select: none;
            }

            .ai-floating-button-v2:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
            }

            /* Mini panel flotante */
            .ai-mini-panel {
                position: fixed;
                bottom: 80px;
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

            .ai-mini-panel-visible {
                transform: translateX(0);
            }

            .ai-mini-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: linear-gradient(45deg, #6366f1, #8b5cf6);
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

            /* Estados del formulario */
            .ai-context-section {
                margin-bottom: 16px;
            }

            .ai-context-label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
            }

            .ai-context-input-v2 {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 12px;
                resize: vertical;
                min-height: 60px;
                max-height: 100px;
                transition: border-color 0.2s;
            }

            .ai-context-input-v2:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
            }

            .ai-char-counter {
                text-align: right;
                font-size: 11px;
                color: #6b7280;
                margin-top: 4px;
            }

            .ai-analyze-btn-v2 {
                width: 100%;
                background: linear-gradient(45deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ai-analyze-btn-v2:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }

            /* Estado de carga */
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
                background: linear-gradient(45deg, #6366f1, #8b5cf6);
                border-radius: 2px;
                transition: width 0.3s ease;
            }

            /* Estado de resultado */
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
