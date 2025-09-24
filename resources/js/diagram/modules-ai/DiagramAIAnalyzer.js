// resources/js/diagram/modules-ai/DiagramAIAnalyzer.js
// Módulo de análisis de diagramas UML con IA (Groq)

export class DiagramAIAnalyzer {
    constructor(editor) {
        this.editor = editor;
        this.apiKey = null;
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.1-8b-instant';

        // UI Referencias
        this.floatingButton = null;
        this.sidebarContainer = null;
        this.isVisible = false;
        this.isAnalyzing = false;

        this.initializeAI();
    }

    initializeAI() {
        console.log('🤖 Inicializando módulo de IA...');

        // Obtener API key de configuración
        this.apiKey = window.GROQ_API_KEY;

        if (!this.apiKey) {
            console.warn('⚠️ API key de Groq no configurada');
            return;
        }

        this.createFloatingButton();
        this.createSidebar();

        console.log('✅ Módulo de IA inicializado correctamente');
    }

    // ==================== INTERFAZ DE USUARIO ====================

    createFloatingButton() {
        this.floatingButton = document.createElement('button');
        this.floatingButton.innerHTML = `
            <span class="ai-icon">🤖</span>
            <span class="ai-text">Analizar con IA</span>
        `;
        this.floatingButton.className = 'ai-floating-button';
        this.floatingButton.onclick = () => this.toggleSidebar();

        // Estilos
        this.floatingButton.style.cssText = `
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
        `;

        // Hover effects
        this.floatingButton.addEventListener('mouseenter', () => {
            this.floatingButton.style.transform = 'translateY(-2px)';
            this.floatingButton.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
        });

        this.floatingButton.addEventListener('mouseleave', () => {
            this.floatingButton.style.transform = 'translateY(0)';
            this.floatingButton.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
        });

        document.body.appendChild(this.floatingButton);
    }

    createSidebar() {
        this.sidebarContainer = document.createElement('div');
        this.sidebarContainer.className = 'ai-sidebar';
        this.sidebarContainer.innerHTML = `
            <div class="ai-sidebar-header">
                <h3>
                    <span class="ai-header-icon">🤖</span>
                    Análisis IA
                </h3>
                <button class="ai-close-btn" id="ai-close-btn">
                    ✕
                </button>
            </div>
            <div class="ai-sidebar-content">
                <div class="ai-welcome">
                    <p>👋 Analiza tu diagrama UML con inteligencia artificial</p>

                    <!-- Campo de contexto opcional -->
                    <div class="ai-context-section">
                        <label for="ai-context-input" class="ai-context-label">
                            📝 Contexto (opcional)
                        </label>
                        <textarea
                            id="ai-context-input"
                            class="ai-context-input"
                            placeholder="Ej: Sistema de gestión universitaria, necesito validar las relaciones entre estudiantes y cursos..."
                            maxlength="300"
                        ></textarea>
                        <div class="ai-context-counter">
                            <span id="context-char-count">0</span>/300 caracteres
                        </div>
                    </div>

                    <button class="ai-analyze-btn" id="ai-analyze-btn">
                        🚀 Analizar Diagrama
                    </button>
                </div>
                <div class="ai-result" style="display: none;">
                    <!-- Aquí aparecerá el resultado del análisis -->
                </div>
                <div class="ai-loading" style="display: none;">
                    <div class="ai-spinner"></div>
                    <p>🔄 Analizando con IA...</p>
                </div>
            </div>
        `;

        // Estilos CSS
        this.sidebarContainer.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: white;
            border-left: 1px solid #e5e7eb;
            box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
            z-index: 999;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        this.addSidebarStyles();
        document.body.appendChild(this.sidebarContainer);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botón cerrar sidebar
        const closeBtn = this.sidebarContainer.querySelector('#ai-close-btn');
        closeBtn.addEventListener('click', () => this.toggleSidebar());

        // Botón analizar
        const analyzeBtn = this.sidebarContainer.querySelector('#ai-analyze-btn');
        analyzeBtn.addEventListener('click', () => this.analyzeCurrentDiagram());

        // Contador de caracteres del contexto
        const contextInput = this.sidebarContainer.querySelector('#ai-context-input');
        const charCounter = this.sidebarContainer.querySelector('#context-char-count');

        contextInput.addEventListener('input', () => {
            const count = contextInput.value.length;
            charCounter.textContent = count;

            // Cambiar color si se acerca al límite
            if (count > 250) {
                charCounter.style.color = '#ef4444';
            } else if (count > 200) {
                charCounter.style.color = '#f59e0b';
            } else {
                charCounter.style.color = '#9ca3af';
            }
        });
    }

    addSidebarStyles() {
        if (document.getElementById('ai-sidebar-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ai-sidebar-styles';
        styles.textContent = `
            .ai-sidebar-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8fafc;
            }

            .ai-sidebar-header h3 {
                margin: 0;
                color: #1f2937;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ai-close-btn {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #6b7280;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .ai-close-btn:hover {
                background: #e5e7eb;
            }

            .ai-sidebar-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }

            .ai-welcome {
                text-align: center;
                margin-bottom: 20px;
            }

            .ai-welcome p {
                color: #6b7280;
                margin-bottom: 16px;
            }

            .ai-context-section {
                margin-bottom: 20px;
            }

            .ai-context-label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 6px;
            }

            .ai-context-input {
                width: 100%;
                min-height: 80px;
                padding: 10px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 13px;
                font-family: system-ui, -apple-system, sans-serif;
                resize: vertical;
                transition: border-color 0.2s;
            }

            .ai-context-input:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }

            .ai-context-counter {
                text-align: right;
                font-size: 11px;
                color: #9ca3af;
                margin-top: 4px;
            }

            .ai-analyze-btn {
                background: linear-gradient(45deg, #10b981, #059669);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
            }

            .ai-analyze-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }

            .ai-analyze-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .ai-reanalyze-btn {
                background: linear-gradient(45deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .ai-reanalyze-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 3px 8px rgba(99, 102, 241, 0.3);
            }

            .ai-reanalyze-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .ai-result {
                background: #f8fafc;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                border-left: 4px solid #6366f1;
            }

            .ai-result h4 {
                margin: 0 0 12px 0;
                color: #1f2937;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ai-analysis-content {
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                line-height: 1.7;
                color: #374151;
                padding: 8px 0;
            }

            .ai-analysis-content strong {
                color: #1f2937;
                font-weight: 600;
            }

            .ai-loading {
                text-align: center;
                padding: 40px 20px;
            }

            .ai-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #6366f1;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .ai-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                color: #991b1b;
                margin-top: 16px;
            }
        `;
        document.head.appendChild(styles);
    }

    toggleSidebar() {
        this.isVisible = !this.isVisible;

        if (this.isVisible) {
            this.sidebarContainer.style.right = '0';
            this.floatingButton.querySelector('.ai-text').textContent = 'Cerrar IA';
        } else {
            this.sidebarContainer.style.right = '-400px';
            this.floatingButton.querySelector('.ai-text').textContent = 'Analizar con IA';
        }
    }

    // ==================== EXTRACCIÓN DE DATOS ====================

    extractClasses() {
        const classes = [];
        const elements = this.editor.graph.getElements();

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData && (umlData.type === 'class' || umlData.type === 'interface')) {
                const className = umlData.className || 'UnnamedClass';
                const stereotype = umlData.uml25?.stereotype || null;

                classes.push({
                    id: element.id,
                    name: className,
                    type: umlData.type,
                    stereotype: stereotype,
                    attributes: umlData.attributes || [],
                    methods: umlData.methods || [],
                    position: element.position()
                });
            }
        });

        console.log('🏗️ Clases extraídas para IA:', classes.length);
        return classes;
    }

    extractRelationships() {
        const relationships = [];
        const links = this.editor.graph.getLinks();

        links.forEach(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();
            const umlData = link.get('umlData') || {};
            const relationData = link.get('relationData') || {};

            if (source && target) {
                const sourceUml = source.get('umlData');
                const targetUml = target.get('umlData');

                if (sourceUml?.type === 'class' && targetUml?.type === 'class') {
                    relationships.push({
                        sourceClass: sourceUml.className || 'Unnamed',
                        targetClass: targetUml.className || 'Unnamed',
                        type: relationData.type || umlData.relationshipType || umlData.type || 'association',
                        sourceMultiplicity: umlData.sourceMultiplicity || relationData.sourceMultiplicity || '',
                        targetMultiplicity: umlData.targetMultiplicity || relationData.targetMultiplicity || ''
                    });
                }
            }
        });

        console.log('🔗 Relaciones extraídas para IA:', relationships.length);
        return relationships;
    }

    // ==================== FORMATEO PARA IA ====================

    formatDiagramForAI(classes, relationships) {
        let diagramText = '';

        // Formatear clases
        if (classes.length > 0) {
            diagramText += 'CLASES UML:\n';
            classes.forEach(cls => {
                diagramText += `\n- ${cls.name}`;
                if (cls.stereotype) {
                    diagramText += ` <<${cls.stereotype}>>`;
                }
                diagramText += ` (${cls.type})\n`;

                if (cls.attributes.length > 0) {
                    diagramText += `  Atributos: ${cls.attributes.join(', ')}\n`;
                }

                if (cls.methods.length > 0) {
                    diagramText += `  Métodos: ${cls.methods.join(', ')}\n`;
                }
            });
            diagramText += '\n';
        }

        // Formatear relaciones
        if (relationships.length > 0) {
            diagramText += 'RELACIONES:\n';
            relationships.forEach(rel => {
                const sourceCard = rel.sourceMultiplicity ? `[${rel.sourceMultiplicity}]` : '';
                const targetCard = rel.targetMultiplicity ? `[${rel.targetMultiplicity}]` : '';

                diagramText += `\n- ${rel.sourceClass} ${sourceCard} ←→ ${rel.targetClass} ${targetCard} (${rel.type})\n`;
            });
        }

        return diagramText || 'Diagrama vacío - no hay clases ni relaciones definidas.';
    }

    // ==================== ANÁLISIS CON IA ====================

    async analyzeCurrentDiagram() {
        if (this.isAnalyzing) return;

        try {
            this.setLoadingState(true);

            // Extraer datos del diagrama
            const classes = this.extractClasses();
            const relationships = this.extractRelationships();

            if (classes.length === 0) {
                this.showError('⚠️ No hay clases en el diagrama para analizar. Agrega al menos una clase UML.');
                return;
            }

            // Obtener contexto del usuario
            const contextInput = this.sidebarContainer.querySelector('#ai-context-input');
            const userContext = contextInput ? contextInput.value.trim() : '';

            // Formatear para IA
            const diagramText = this.formatDiagramForAI(classes, relationships);
            console.log('📋 Diagrama formateado para IA:', diagramText);

            // Enviar a Groq API con contexto
            const analysis = await this.sendToGroqAPI(diagramText, userContext);

            // Mostrar resultado
            this.showAnalysisResult(analysis);

        } catch (error) {
            console.error('❌ Error en análisis de IA:', error);
            this.showError(`❌ Error al analizar: ${error.message}`);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Método para re-analizar (vuelve al formulario inicial)
    reAnalyze() {
        // Mostrar de nuevo el formulario inicial
        const welcomeDiv = this.sidebarContainer.querySelector('.ai-welcome');
        const resultDiv = this.sidebarContainer.querySelector('.ai-result');

        welcomeDiv.style.display = 'block';
        resultDiv.style.display = 'none';

        // Focus en el textarea de contexto para editar
        const contextInput = this.sidebarContainer.querySelector('#ai-context-input');
        if (contextInput) {
            contextInput.focus();
        }

        console.log('🔄 Preparado para re-análisis');
    }

    async sendToGroqAPI(diagramText, userContext = '') {
        // Construir prompt base
        let prompt = `Eres un experto en modelado de datos conceptual. Analiza este DIAGRAMA CONCEPTUAL UML enfocándote en estructura de dominio:

${diagramText}`;

        // Agregar contexto del usuario si existe
        if (userContext) {
            prompt += `

CONTEXTO ADICIONAL DEL USUARIO:
${userContext}

Ten en cuenta este contexto para hacer un análisis más específico y relevante.`;
        }

        prompt += `

IMPORTANTE: Este es un diagrama CONCEPTUAL - NO menciones IDs técnicos, timestamps, o detalles de implementación. Esos se generan automáticamente en código.

Analiza SOLO:

🗃️ **ENTIDADES**
- ¿Los atributos de dominio están completos?
- ¿Los tipos de datos son apropiados para el negocio?
- ¿Los estereotipos <<entity>> representan bien el dominio?

🔗 **RELACIONES DE NEGOCIO**
- ¿Las multiplicidades reflejan las reglas del negocio?
- ¿Faltan relaciones importantes del dominio?
- ¿Las relaciones de composición/agregación son correctas?

⚠️ **PROBLEMAS CONCEPTUALES**
- Máximo 3 problemas de modelado de dominio

💡 **MEJORAS SUGERIDAS**
- Máximo 3 sugerencias para el modelo conceptual

Respuesta máximo 200 palabras. Enfócate en REGLAS DE NEGOCIO y DOMINIO, no en implementación técnica.`;

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "Eres un experto arquitecto de bases de datos especializado en UML 2.5 para modelado de datos."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.3,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`);
        }

        const data = await response.json();
        const analysis = data.choices[0]?.message?.content;

        if (!analysis) {
            throw new Error('No se recibió análisis de la IA');
        }

        return {
            analysis: analysis,
            tokensUsed: data.usage?.total_tokens || 'N/A',
            model: data.model || this.model
        };
    }

    // ==================== UI STATES ====================

    setLoadingState(loading) {
        this.isAnalyzing = loading;

        const welcomeDiv = this.sidebarContainer.querySelector('.ai-welcome');
        const loadingDiv = this.sidebarContainer.querySelector('.ai-loading');
        const resultDiv = this.sidebarContainer.querySelector('.ai-result');
        const analyzeBtn = this.sidebarContainer.querySelector('.ai-analyze-btn');
        const reanalyzeBtn = this.sidebarContainer.querySelector('#ai-reanalyze-btn');

        if (loading) {
            welcomeDiv.style.display = 'none';
            loadingDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            analyzeBtn.disabled = true;
            if (reanalyzeBtn) reanalyzeBtn.disabled = true;
            this.floatingButton.style.opacity = '0.6';
        } else {
            loadingDiv.style.display = 'none';
            analyzeBtn.disabled = false;
            if (reanalyzeBtn) reanalyzeBtn.disabled = false;
            this.floatingButton.style.opacity = '1';
        }
    }

    showAnalysisResult(result) {
        const resultDiv = this.sidebarContainer.querySelector('.ai-result');

        // Convertir markdown básico a HTML
        const formattedAnalysis = this.convertMarkdownToHtml(result.analysis);

        resultDiv.innerHTML = `
            <h4>✅ Análisis Completado</h4>
            <div class="ai-analysis-content">${formattedAnalysis}</div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                💡 Tokens usados: ${result.tokensUsed} | ⚡ Modelo: ${result.model}
            </div>
            <div style="margin-top: 16px; text-align: center;">
                <button class="ai-reanalyze-btn" id="ai-reanalyze-btn">
                    🔄 Analizar Nuevamente
                </button>
            </div>
        `;

        resultDiv.style.display = 'block';

        // Configurar event listener para el botón de re-análisis
        const reanalyzeBtn = resultDiv.querySelector('#ai-reanalyze-btn');
        reanalyzeBtn.addEventListener('click', () => this.reAnalyze());

        // Scroll al resultado
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    convertMarkdownToHtml(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '• $1')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }

    showError(message) {
        const contentDiv = this.sidebarContainer.querySelector('.ai-sidebar-content');

        // Crear o actualizar div de error
        let errorDiv = contentDiv.querySelector('.ai-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'ai-error';
            contentDiv.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }

    // ==================== MÉTODOS PÚBLICOS ====================

    setAPIKey(apiKey) {
        this.apiKey = apiKey;
        console.log('🔑 API key actualizada');
    }

    setModel(model) {
        this.model = model;
        console.log('🤖 Modelo actualizado:', model);
    }

    // Cleanup
    destroy() {
        if (this.floatingButton) {
            this.floatingButton.remove();
        }
        if (this.sidebarContainer) {
            this.sidebarContainer.remove();
        }
        const styles = document.getElementById('ai-sidebar-styles');
        if (styles) {
            styles.remove();
        }
    }
}
