// resources/js/diagram/editor.js - VERSIÓN REFACTORIZADA CON MÓDULOS
// Mantiene exactamente la misma funcionalidad, pero dividida en módulos

import * as joint from 'jointjs';
import { DiagramSaveManager } from './DiagramSaveManager.js';
import { DiagramZoomManager } from './DiagramZoomManager.js';
import { DiagramClassManager } from './DiagramClassManager.js';
import { DiagramRelationshipManager } from './DiagramRelationshipManager.js';
import { DiagramWebSocketManager } from './DiagramWebSocketManager.js';
import { DiagramCollaborationManager } from './DiagramCollaborationManager.js';
import { DiagramCursorManager } from './DiagramCursorManager.js';
import { SimpleImageExporter } from './utils/simpleImageExport.js';
import { SimpleXMIExporter } from './utils/simpleXMIExport.js';
import { SimpleXMIImporter } from './utils/simpleXMIImport.js';
import { SimpleImageImporter } from './utils/simpleImageImport.js';
import { SimpleSQLGenerator } from './utils/simpleSQLGenerator.js';
import { SimpleJavaGenerator } from './utils/simpleJavaGenerator.js';
import { SimplePostmanGenerator } from './utils/simplePostmanGenerator.js';
import { SimpleFlutterGenerator } from './utils/simpleFlutterGenerator.js';
import { DiagramAIAnalyzer } from './modules-ai/DiagramAIAnalyzer.js';
import { DiagramAIEditor } from './modules-ai/DiagramAIEditor.js';
// Configurar JointJS correctamente
joint.config.useCSSSelectors = false;

class UMLDiagramEditor {
    constructor() {
        console.log('🚀 Inicializando UMLDiagramEditor...');

        this.graph = new joint.dia.Graph();
        this.paper = null;
        this.selectedTool = 'select';
        this.selectedElement = null;
        this.currentZoom = 1;

        // Estados para relaciones
        this.relationshipMode = false;
        this.firstElementSelected = null;

        // Templates UML mejorados
        this.umlTemplates = {
            visibility: {
                '+': 'public',
                '-': 'private',
                '#': 'protected',
                '~': 'package'
            },
            commonTypes: [
                'String', 'int', 'boolean', 'double', 'float', 'long', 'char',
                'Date', 'LocalDateTime', 'BigDecimal', 'List<>', 'Set<>', 'Map<,>'
            ]
        };

        // Inicializar módulos
        this.saveManager = new DiagramSaveManager(this);
        this.zoomManager = new DiagramZoomManager(this);
        this.classManager = new DiagramClassManager(this);
        this.relationshipManager = new DiagramRelationshipManager(this);
        //this.aiAnalyzer = new DiagramAIAnalyzer(this);

        this.init();
    }

    init() {
        this.createPaper();
        this.aiAnalyzer = new DiagramAIAnalyzer(this);
        this.aiEditor = new DiagramAIEditor(this);
        this.xmiImporter = new SimpleXMIImporter(this);
        this.imageImporter = new SimpleImageImporter(this);
        this.setupEventListeners();
        this.zoomManager.setupZoomButtons();
        this.zoomManager.setupPanNavigation();
        this.saveManager.loadDiagramData();
    // NUEVO: Inicializar colaboración si está disponible
    this.initializeCollaboration()
        console.log('✅ UMLDiagramEditor inicializado correctamente');
    }
// NUEVO: Método para inicializar colaboración opcional
async initializeCollaboration() {
    // Solo inicializar colaboración si hay datos de sesión
    const hasSessionData = window.diagramSessionId !== undefined;
    const hasEcho = window.Echo !== undefined;

    if (hasEcho && hasSessionData) {
        console.log('🤝 Iniciando modo colaborativo...');

        // Inicializar módulos de colaboración
        this.webSocketManager = new DiagramWebSocketManager(this);
        this.collaborationManager = new DiagramCollaborationManager(this);
        this.cursorManager = new DiagramCursorManager(this);

        // Intentar conectar
        try {
            const connected = await this.webSocketManager.initialize();
            if (connected) {
                console.log('✅ Colaboración activada');
            } else {
                console.warn('⚠️ Colaboración no disponible');
            }
        } catch (error) {
            console.error('❌ Error en colaboración:', error);
        }
    } else {
        console.log('📝 Modo individual (sin colaboración)');
        // Inicializar variables nulas para evitar errores
        this.webSocketManager = null;
        this.collaborationManager = null;
        this.cursorManager = null;
    }
}
    createPaper() {
        var container = document.getElementById('paper-container');
        if (!container) {
            console.error('❌ Container #paper-container no encontrado');
            return;
        }

        console.log('📋 Creando paper...');

        this.paper = new joint.dia.Paper({
            el: container,
            model: this.graph,
            width: '100%',
            height: '100%',
            gridSize: 10,
            drawGrid: {
                name: 'mesh',
                args: {
                    color: '#e5e7eb',
                    thickness: 1,
                    scaleFactor: 5
                }
            },
            background: {
                color: 'transparent',
               // image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjAuNSIgZmlsbD0iI2Q2ZDNkMSIvPgo8L3N2Zz4K'
            },

            // Configuración para interactividad con pan
            interactive: function(elementView) {
                // Los elementos son interactivos solo en modo select
                return this.selectedTool === 'select';
            }.bind(this),

            // DESHABILITAR zoom con rueda nativo para usar el personalizado
            mouseWheelZoom: false,
            restrictTranslate: false, // Permitir movimiento libre
            snapLabels: true,
            markAvailable: true,

            // Permitir que el paper se mueva fuera de los límites
            defaultRouter: { name: 'orthogonal' },
            defaultConnector: { name: 'rounded' },

            // Configuración de viewport
            async: true,
            frozen: false,
            sorting: joint.dia.Paper.sorting.APPROX
        });

        // Eventos del paper
        this.paper.on('element:pointerdown', this.onElementClick.bind(this));
        this.paper.on('blank:pointerdown', this.onBlankClick.bind(this));
        this.paper.on('element:pointermove', this.updateCanvasInfo.bind(this));
        this.paper.on('link:pointerdown', this.onLinkClick.bind(this));
        this.paper.on('element:pointerdblclick', this.onElementDoubleClick.bind(this));
        this.paper.on('link:pointerdblclick', this.onLinkDoubleClick.bind(this));

        // Configurar zoom personalizado con rueda del mouse
        this.zoomManager.setupMouseWheelZoom();

        console.log('✅ Paper creado correctamente con pan support');
    }

    setupEventListeners() {
        // Shortcuts de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveManager.saveDiagram();
            } else if (e.key === 'Delete' && this.selectedElement) {
                this.deleteElement();
            } else if (e.key === 'Escape') {
                this.cancelOperation();
            }
            // Shortcuts de zoom
            else if (e.ctrlKey && e.key === '+') {
                e.preventDefault();
                this.zoomManager.zoomIn();
            } else if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                this.zoomManager.zoomOut();
            } else if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                this.zoomManager.setZoom(1); // Reset a 100%
            } else if (e.ctrlKey && e.key === '9') {
                e.preventDefault();
                this.zoomManager.zoomToFit();
            }
            // Shortcuts de navegación
            else if (e.key === 'Home') {
                e.preventDefault();
                this.zoomManager.centerView();
            } else if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.zoomManager.resetViewport();
            }
            // Shortcuts de herramientas (solo si no hay input focus)
            else if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
                switch(e.key) {
                    case '1': e.preventDefault(); this.selectTool('select'); break;
                    case '2': e.preventDefault(); this.selectTool('class'); break;
                    case '3': e.preventDefault(); this.selectTool('interface'); break;
                    case '4': e.preventDefault(); this.selectTool('association'); break;
                    case '5': e.preventDefault(); this.selectTool('inheritance'); break;
                    case '6': e.preventDefault(); this.selectTool('aggregation'); break;
                    case '7': e.preventDefault(); this.selectTool('composition'); break;
                }
            }
        });

        console.log('✅ Event listeners configurados (incluyendo zoom shortcuts y pan)');
        const exportPNGBtn = document.getElementById('export-png-btn');
        const exportJPGBtn = document.getElementById('export-jpg-btn');

        if (exportPNGBtn) {
            exportPNGBtn.addEventListener('click', () => this.exportToPNG());
        }

        if (exportJPGBtn) {
            exportJPGBtn.addEventListener('click', () => this.exportToJPG());
        }

        // Botón de exportación XMI
        const exportXMIBtn = document.getElementById('export-xmi-btn');
        if (exportXMIBtn) {
            exportXMIBtn.addEventListener('click', () => this.exportToXMI());
        }

        // Botón de importación XMI
        const importXMIBtn = document.getElementById('import-xmi-btn');
        if (importXMIBtn) {
            importXMIBtn.addEventListener('click', () => this.importFromXMI());
        }

        // Botón de importación desde imagen
        const importImageBtn = document.getElementById('import-image-btn');
        if (importImageBtn) {
            importImageBtn.addEventListener('click', () => this.importFromImage());
        }

        // Botón de generación SQL
        const generateSQLBtn = document.getElementById('generate-sql-btn');
        if (generateSQLBtn) {
            generateSQLBtn.addEventListener('click', () => this.generateSQL());
        }

        const generateJavaBtn = document.getElementById('generate-java-btn');
        if (generateJavaBtn) {
            generateJavaBtn.addEventListener('click', () => this.generateJavaProject());
        }

        const generatePostmanBtn = document.getElementById('generate-postman-btn');
        if (generatePostmanBtn) {
            generatePostmanBtn.addEventListener('click', () => this.generatePostmanCollection());
        }

        // Botón de generación Flutter
        const generateFlutterBtn = document.getElementById('generate-flutter-btn');
        if (generateFlutterBtn) {
            generateFlutterBtn.addEventListener('click', () => this.generateFlutterProject());
        }
    }

    // ==================== SELECCIÓN DE HERRAMIENTAS ====================

    selectTool(tool) {
        this.selectedTool = tool;

        // Resetear estados
        if (this.relationshipManager.getFirstElementSelected()) {
            this.highlightElement(this.relationshipManager.getFirstElementSelected(), false);
            this.relationshipManager.resetFirstElementSelected();
        }

        // Cambiar cursor del paper
        var paperEl = this.paper.el;
        paperEl.style.cursor = 'default';

        if (tool === 'class' || tool === 'interface') {
            paperEl.style.cursor = 'crosshair';
        }

        // Actualizar UI de herramientas
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');

        console.log('🔧 Herramienta seleccionada:', tool);
    }

    // ==================== EVENTOS DEL PAPER ====================

    onElementClick(elementView, evt) {
        evt.stopPropagation();

        if (this.selectedTool === 'select') {
            this.selectElement(elementView.model);
        } else if (['association', 'aggregation', 'composition', 'inheritance'].includes(this.selectedTool)) {
            this.relationshipManager.handleRelationshipClick(elementView.model);
        }
    }

    onBlankClick(evt) {
        if (this.selectedTool === 'class') {
            var point = this.paper.clientToLocalPoint(evt.clientX, evt.clientY);
            this.classManager.createClassImproved(point.x, point.y);
        } else if (this.selectedTool === 'interface') {
            var point = this.paper.clientToLocalPoint(evt.clientX, evt.clientY);
            this.classManager.createInterface(point.x, point.y);
        }

        // Deseleccionar elemento
        this.selectElement(null);
    }

    onElementDoubleClick(elementView, evt) {
        // Editar clase/interface
        if (elementView.model.get('type') === 'standard.Rectangle') {
            this.classManager.editClassImproved(elementView.model);
        }
    }

    onLinkClick(linkView, evt) {
        evt.stopPropagation();
        if (this.selectedTool === 'select') {
            this.selectElement(linkView.model);
        }
    }

    onLinkDoubleClick(linkView, evt) {
        // Editar relación
        this.relationshipManager.editRelationship(linkView.model);
    }

    // ==================== UTILIDADES Y RESTO DE FUNCIONES ====================

    selectElement(element) {
        // Remover selección anterior
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement, false);
        }

        this.selectedElement = element;

        if (element) {
            this.highlightElement(element, true, '#4f46e5');
            console.log('Elemento seleccionado:', element.get('type'));
        }
    }

    highlightElement(element, highlight, color = '#4f46e5') {
        if (element.isLink && element.isLink()) {
            // Resaltar enlaces
            element.attr('line/strokeWidth', highlight ? 3 : 2);
            element.attr('line/stroke', highlight ? color : '#1e40af');
        } else {
            // Resaltar elementos con animación
            element.attr('body/strokeWidth', highlight ? 3 : 2);
            element.attr('body/stroke', highlight ? color : '#1e40af');
        }
    }

    deleteElement() {
        if (!this.selectedElement) {
            console.log('⚠️ No hay elemento seleccionado para eliminar');
            return;
        }

        var elementType = this.selectedElement.isLink() ? 'relación' : 'clase';
        if (confirm(`¿Eliminar esta ${elementType}?`)) {
            this.selectedElement.remove();
            this.selectedElement = null;
            this.updateCanvasInfo();
            console.log('🗑️ Elemento eliminado');
        }
    }

    cancelOperation() {
        this.selectElement(null);
        this.relationshipManager.resetFirstElementSelected();
        this.selectTool('select');
        console.log('❌ Operación cancelada');
    }

    // Delegar métodos de zoom al ZoomManager
    updateCanvasInfo() {
        this.zoomManager.updateCanvasInfo();
    }

    zoomIn() {
        this.zoomManager.zoomIn();
    }

    zoomOut() {
        this.zoomManager.zoomOut();
    }

    zoomToFit() {
        this.zoomManager.zoomToFit();
    }

    setZoom(zoom) {
        this.zoomManager.setZoom(zoom);
    }

    // Delegar métodos de guardado al SaveManager
    saveDiagram() {
        this.saveManager.saveDiagram();
    }

    clearDiagram() {
        this.saveManager.clearDiagram();
    }

    exportToPNG() {
        this.saveManager.exportToPNG();
    }

    generateJavaProject() {
        SimpleJavaGenerator.quickGenerateJava(this);
    }

    generatePostmanCollection() {
        SimplePostmanGenerator.quickGeneratePostman(this);
    }

    async generateFlutterProject() {
        console.log('📱 Generando proyecto Flutter...');

        try {
            const result = await SimpleFlutterGenerator.quickGenerateFlutter(this);

            if (result.success) {
                console.log('✅ Proyecto Flutter generado exitosamente');
                alert(`✅ Proyecto Flutter generado exitosamente!\n\n` +
                      `📊 ${result.entitiesCount} entidades procesadas\n` +
                      `🔐 Autenticación: ${result.hasAuth ? 'Incluida' : 'No detectada'}\n\n` +
                      `El proyecto Flutter completo se ha descargado como ZIP.`);
            } else {
                console.error('❌ Error generando proyecto Flutter:', result.error);
                alert(`❌ Error generando proyecto Flutter:\n${result.error}`);
            }
        } catch (error) {
            console.error('❌ Error generando proyecto Flutter:', error);
            alert(`❌ Error generando proyecto Flutter:\n${error.message}`);
        }
    }

    getState() {
        return {
            selectedTool: this.selectedTool,
            elementCount: this.graph.getElements().length,
            linkCount: this.graph.getLinks().length,
            zoom: this.zoomManager.getCurrentZoom(),
            relationshipMode: this.relationshipMode,
            hasSelection: !!this.selectedElement
        };
    }

    // ==================== DEBUG Y DESARROLLO ====================

    debug() {
        console.log('🔧 Estado del editor:', {
            selectedTool: this.selectedTool,
            elements: this.graph.getElements().length,
            links: this.graph.getLinks().length,
            zoom: this.zoomManager.getCurrentZoom(),
            selectedElement: this.selectedElement?.id || 'ninguno',
            firstElementSelected: this.relationshipManager.getFirstElementSelected()?.id || 'ninguno'
        });

        console.log('📊 Elementos en el graph:', this.graph.toJSON());
        return this.getState();
    }
        exportToPNG() {
            SimpleImageExporter.quickExportPNG(this);
        }

        exportToJPG() {
            SimpleImageExporter.quickExportJPG(this);
        }

        exportToXMI() {
            SimpleXMIExporter.quickExportXMI(this);
        }

        // ==================== MÉTODOS DE IMPORTACIÓN ====================

        importFromXMI() {
            this.showXMIImportModal();
        }

        importFromImage() {
            this.showImageImportModal();
        }

        showXMIImportModal() {
            // Crear modal de importación con CSS inline simple y funcional
            const modalHtml = `
                <div id="xmiImportModal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                ">
                    <div style="
                        background: white;
                        border-radius: 8px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    ">
                        <!-- Header -->
                        <div style="
                            padding: 20px;
                            border-bottom: 1px solid #e5e5e5;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                                📁 Importar Diagrama UML
                            </h3>
                            <button id="closeModalBtn" style="
                                background: none;
                                border: none;
                                font-size: 24px;
                                cursor: pointer;
                                color: #666;
                                padding: 0;
                                width: 30px;
                                height: 30px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">×</button>
                        </div>

                        <!-- Body -->
                        <div style="padding: 20px;">
                            <div style="margin-bottom: 20px;">
                                <label for="xmiFileInput" style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-weight: 500;
                                    color: #555;
                                ">
                                    Seleccionar archivo XML/XMI/UML:
                                </label>
                                <input type="file" id="xmiFileInput" accept=".xml,.xmi,.uml" style="
                                    width: 100%;
                                    padding: 10px;
                                    border: 2px dashed #ddd;
                                    border-radius: 4px;
                                    background: #f9f9f9;
                                    cursor: pointer;
                                ">
                                <p style="
                                    margin-top: 8px;
                                    font-size: 12px;
                                    color: #666;
                                    margin-bottom: 0;
                                ">
                                    Formatos soportados: XML, XMI, UML (Enterprise Architect, StarUML, etc.)
                                </p>
                            </div>

                            <div style="
                                margin-bottom: 20px;
                                padding: 15px;
                                background: #e3f2fd;
                                border: 1px solid #bbdefb;
                                border-radius: 4px;
                            ">
                                <p style="margin: 0; font-size: 14px; color: #1565c0;">
                                    ℹ️ <strong>Información:</strong> La importación reemplazará el diagrama actual.
                                    Se recomienda guardar el trabajo actual antes de proceder.
                                </p>
                            </div>

                            <!-- Progress -->
                            <div id="importProgress" style="display: none; margin-bottom: 20px;">
                                <div style="
                                    width: 100%;
                                    height: 6px;
                                    background: #f0f0f0;
                                    border-radius: 3px;
                                    overflow: hidden;
                                    margin-bottom: 10px;
                                ">
                                    <div style="
                                        width: 100%;
                                        height: 100%;
                                        background: linear-gradient(90deg, #007bff, #0056b3);
                                        animation: pulse 1.5s ease-in-out infinite alternate;
                                    "></div>
                                </div>
                                <p style="text-align: center; margin: 0; color: #666;">Procesando archivo...</p>
                            </div>

                            <!-- Result -->
                            <div id="importResult" style="display: none;"></div>
                        </div>

                        <!-- Footer -->
                        <div style="
                            padding: 20px;
                            border-top: 1px solid #e5e5e5;
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                        ">
                            <button id="cancelImportBtn" style="
                                padding: 10px 20px;
                                border: 1px solid #ddd;
                                background: #f8f9fa;
                                color: #666;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                            ">Cancelar</button>
                            <button id="startImportBtn" style="
                                padding: 10px 20px;
                                border: none;
                                background: #007bff;
                                color: white;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                📤 Importar
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        100% { opacity: 1; }
                    }

                    #cancelImportBtn:hover {
                        background: #e9ecef !important;
                    }

                    #startImportBtn:hover {
                        background: #0056b3 !important;
                    }

                    #startImportBtn:disabled {
                        background: #6c757d !important;
                        cursor: not-allowed !important;
                    }
                </style>
            `;

            // Remover modal anterior si existe
            const existingModal = document.getElementById('xmiImportModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Configurar eventos
            this.setupXMIImportEvents();

            // Focus en el input de archivo
            setTimeout(() => {
                const fileInput = document.getElementById('xmiFileInput');
                if (fileInput) fileInput.focus();
            }, 100);
        }        setupXMIImportEvents() {
            const modal = document.getElementById('xmiImportModal');
            const fileInput = document.getElementById('xmiFileInput');
            const startImportBtn = document.getElementById('startImportBtn');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const cancelImportBtn = document.getElementById('cancelImportBtn');
            const progressDiv = document.getElementById('importProgress');
            const resultDiv = document.getElementById('importResult');

            if (!fileInput || !startImportBtn) {
                console.error('Elementos del modal de importación no encontrados');
                return;
            }

            // Función para cerrar el modal
            const closeModal = () => {
                if (modal) {
                    modal.remove();
                }
            };

            // Eventos de cierre
            closeModalBtn.addEventListener('click', closeModal);
            cancelImportBtn.addEventListener('click', closeModal);

            // Cerrar al hacer clic fuera del modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Cerrar con tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal) {
                    closeModal();
                }
            });

            startImportBtn.addEventListener('click', async () => {
                const file = fileInput.files[0];
                if (!file) {
                    this.showAlert('Por favor selecciona un archivo XML/XMI', 'warning');
                    return;
                }

                try {
                    // Mostrar progreso
                    progressDiv.style.display = 'block';
                    resultDiv.style.display = 'none';
                    startImportBtn.disabled = true;
                    startImportBtn.style.background = '#6c757d';
                    startImportBtn.style.cursor = 'not-allowed';

                    // Leer archivo
                    const xmlContent = await this.readFileAsText(file);

                    // Importar diagrama
                    const result = await this.xmiImporter.importFromXML(xmlContent, this.paper);

                    // Ocultar progreso
                    progressDiv.style.display = 'none';

                    // Mostrar resultado
                    let resultHtml = '';
                    if (result.success) {
                        resultHtml = `
                            <div style="
                                padding: 15px;
                                background: #d4edda;
                                border: 1px solid #c3e6cb;
                                border-left: 4px solid #28a745;
                                border-radius: 4px;
                                color: #155724;
                            ">
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="margin-right: 10px; color: #28a745; font-size: 18px;">✅</span>
                                    <div>
                                        <p style="margin: 0 0 8px 0; font-weight: 600;">¡Importación exitosa!</p>
                                        <div style="font-size: 14px;">
                                            <p style="margin: 0;">Clases creadas: ${result.classesCreated || 0}</p>
                                            <p style="margin: 0;">Relaciones creadas: ${result.relationshipsCreated || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        // Cerrar modal después de 2 segundos
                        setTimeout(() => {
                            closeModal();
                        }, 2000);
                    } else {
                        resultHtml = `
                            <div style="
                                padding: 15px;
                                background: #f8d7da;
                                border: 1px solid #f5c6cb;
                                border-left: 4px solid #dc3545;
                                border-radius: 4px;
                                color: #721c24;
                            ">
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="margin-right: 10px; color: #dc3545; font-size: 18px;">❌</span>
                                    <div>
                                        <p style="margin: 0 0 5px 0; font-weight: 600;">Error en la importación</p>
                                        <p style="margin: 0; font-size: 14px;">${result.error || 'Error desconocido'}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    resultDiv.innerHTML = resultHtml;
                    resultDiv.style.display = 'block';

                } catch (error) {
                    console.error('Error durante la importación:', error);

                    // Ocultar progreso
                    progressDiv.style.display = 'none';

                    // Mostrar error
                    resultDiv.innerHTML = `
                        <div style="
                            padding: 15px;
                            background: #f8d7da;
                            border: 1px solid #f5c6cb;
                            border-left: 4px solid #dc3545;
                            border-radius: 4px;
                            color: #721c24;
                        ">
                            <div style="display: flex; align-items: flex-start;">
                                <span style="margin-right: 10px; color: #dc3545; font-size: 18px;">❌</span>
                                <div>
                                    <p style="margin: 0 0 5px 0; font-weight: 600;">Error:</p>
                                    <p style="margin: 0; font-size: 14px;">${error.message}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    resultDiv.style.display = 'block';
                } finally {
                    startImportBtn.disabled = false;
                    startImportBtn.style.background = '#007bff';
                    startImportBtn.style.cursor = 'pointer';
                }
            });
        }

        showImageImportModal() {
            // Crear modal de importación de imágenes con CSS inline
            const modalHtml = `
                <div id="imageImportModal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                ">
                    <div style="
                        background: white;
                        border-radius: 8px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    ">
                        <!-- Header -->
                        <div style="
                            padding: 20px;
                            border-bottom: 1px solid #e5e5e5;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                                📷 Importar desde Imagen
                            </h3>
                            <button id="closeImageModalBtn" style="
                                background: none;
                                border: none;
                                font-size: 24px;
                                cursor: pointer;
                                color: #666;
                                padding: 0;
                                width: 30px;
                                height: 30px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">×</button>
                        </div>

                        <!-- Body -->
                        <div style="padding: 20px;">
                            <div style="margin-bottom: 20px;">
                                <label for="imageFileInput" style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-weight: 500;
                                    color: #555;
                                ">
                                    Seleccionar imagen de diagrama UML:
                                </label>
                                <input type="file" id="imageFileInput" accept=".jpg,.jpeg,.png,.webp" style="
                                    width: 100%;
                                    padding: 10px;
                                    border: 2px dashed #ddd;
                                    border-radius: 4px;
                                    background: #f9f9f9;
                                    cursor: pointer;
                                ">
                                <p style="
                                    margin-top: 8px;
                                    font-size: 12px;
                                    color: #666;
                                    margin-bottom: 0;
                                ">
                                    Formatos soportados: JPG, PNG, WebP • Tamaño máximo: 5MB
                                </p>
                            </div>

                            <div style="
                                margin-bottom: 20px;
                                padding: 15px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border-radius: 8px;
                            ">
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="margin-right: 10px; font-size: 24px;">🤖</span>
                                    <div>
                                        <p style="margin: 0 0 8px 0; font-weight: 600;">Powered by Groq AI + Llama Vision</p>
                                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                                            La IA analizará tu diagrama UML y recreará automáticamente las clases y relaciones.
                                            Funciona con diagramas dibujados a mano, digitales, fotografías, etc.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style="
                                margin-bottom: 20px;
                                padding: 15px;
                                background: #fff3cd;
                                border: 1px solid #ffeaa7;
                                border-radius: 4px;
                            ">
                                <p style="margin: 0; font-size: 14px; color: #856404;">
                                    💡 <strong>Consejos para mejores resultados:</strong><br>
                                    • Asegúrate de que el texto sea legible<br>
                                    • Usa imágenes con buen contraste<br>
                                    • Incluye nombres de clases y métodos claros
                                </p>
                            </div>

                            <!-- Progress -->
                            <div id="imageImportProgress" style="display: none; margin-bottom: 20px;">
                                <div style="
                                    width: 100%;
                                    height: 6px;
                                    background: #f0f0f0;
                                    border-radius: 3px;
                                    overflow: hidden;
                                    margin-bottom: 10px;
                                ">
                                    <div style="
                                        width: 100%;
                                        height: 100%;
                                        background: linear-gradient(90deg, #667eea, #764ba2);
                                        animation: pulse 1.5s ease-in-out infinite alternate;
                                    "></div>
                                </div>
                                <p style="text-align: center; margin: 0; color: #666;">
                                    🤖 Analizando imagen con IA...
                                </p>
                            </div>

                            <!-- Result -->
                            <div id="imageImportResult" style="display: none;"></div>
                        </div>

                        <!-- Footer -->
                        <div style="
                            padding: 20px;
                            border-top: 1px solid #e5e5e5;
                            display: flex;
                            justify-content: flex-end;
                            gap: 10px;
                        ">
                            <button id="cancelImageImportBtn" style="
                                padding: 10px 20px;
                                border: 1px solid #ddd;
                                background: #f8f9fa;
                                color: #666;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                            ">Cancelar</button>
                            <button id="startImageImportBtn" style="
                                padding: 10px 20px;
                                border: none;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                🤖 Analizar con IA
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        100% { opacity: 1; }
                    }

                    #cancelImageImportBtn:hover {
                        background: #e9ecef !important;
                    }

                    #startImageImportBtn:hover {
                        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
                    }

                    #startImageImportBtn:disabled {
                        background: #6c757d !important;
                        cursor: not-allowed !important;
                    }
                </style>
            `;

            // Remover modal anterior si existe
            const existingModal = document.getElementById('imageImportModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Configurar eventos
            this.setupImageImportEvents();

            // Focus en el input de archivo
            setTimeout(() => {
                const fileInput = document.getElementById('imageFileInput');
                if (fileInput) fileInput.focus();
            }, 100);
        }

        setupImageImportEvents() {
            const modal = document.getElementById('imageImportModal');
            const fileInput = document.getElementById('imageFileInput');
            const startImportBtn = document.getElementById('startImageImportBtn');
            const closeModalBtn = document.getElementById('closeImageModalBtn');
            const cancelImportBtn = document.getElementById('cancelImageImportBtn');
            const progressDiv = document.getElementById('imageImportProgress');
            const resultDiv = document.getElementById('imageImportResult');

            if (!fileInput || !startImportBtn) {
                console.error('Elementos del modal de importación de imagen no encontrados');
                return;
            }

            // Función para cerrar el modal
            const closeModal = () => {
                if (modal) {
                    modal.remove();
                }
            };

            // Eventos de cierre
            closeModalBtn.addEventListener('click', closeModal);
            cancelImportBtn.addEventListener('click', closeModal);

            // Cerrar al hacer clic fuera del modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Cerrar con tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal) {
                    closeModal();
                }
            });

            startImportBtn.addEventListener('click', async () => {
                const file = fileInput.files[0];
                if (!file) {
                    this.showAlert('Por favor selecciona una imagen', 'warning');
                    return;
                }

                try {
                    // Mostrar progreso
                    progressDiv.style.display = 'block';
                    resultDiv.style.display = 'none';
                    startImportBtn.disabled = true;
                    startImportBtn.style.background = '#6c757d';
                    startImportBtn.style.cursor = 'not-allowed';

                    // Importar desde imagen usando el ImageImporter
                    const result = await this.imageImporter.importFromImage(file);

                    // Ocultar progreso
                    progressDiv.style.display = 'none';

                    // Mostrar resultado
                    let resultHtml = '';
                    if (result.success) {
                        resultHtml = `
                            <div style="
                                padding: 15px;
                                background: #d4edda;
                                border: 1px solid #c3e6cb;
                                border-left: 4px solid #28a745;
                                border-radius: 4px;
                                color: #155724;
                            ">
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="margin-right: 10px; color: #28a745; font-size: 18px;">✅</span>
                                    <div>
                                        <p style="margin: 0 0 8px 0; font-weight: 600;">¡Análisis de imagen exitoso!</p>
                                        <div style="font-size: 14px;">
                                            <p style="margin: 0;">Clases detectadas: ${result.classesCreated || 0}</p>
                                            <p style="margin: 0;">Relaciones detectadas: ${result.relationshipsCreated || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        // Cerrar modal después de 3 segundos
                        setTimeout(() => {
                            closeModal();
                        }, 3000);
                    } else {
                        resultHtml = `
                            <div style="
                                padding: 15px;
                                background: #f8d7da;
                                border: 1px solid #f5c6cb;
                                border-left: 4px solid #dc3545;
                                border-radius: 4px;
                                color: #721c24;
                            ">
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="margin-right: 10px; color: #dc3545; font-size: 18px;">❌</span>
                                    <div>
                                        <p style="margin: 0 0 5px 0; font-weight: 600;">Error en el análisis</p>
                                        <p style="margin: 0; font-size: 14px;">${result.error || 'Error desconocido'}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    resultDiv.innerHTML = resultHtml;
                    resultDiv.style.display = 'block';

                } catch (error) {
                    console.error('Error durante la importación de imagen:', error);

                    // Ocultar progreso
                    progressDiv.style.display = 'none';

                    // Mostrar error
                    resultDiv.innerHTML = `
                        <div style="
                            padding: 15px;
                            background: #f8d7da;
                            border: 1px solid #f5c6cb;
                            border-left: 4px solid #dc3545;
                            border-radius: 4px;
                            color: #721c24;
                        ">
                            <div style="display: flex; align-items: flex-start;">
                                <span style="margin-right: 10px; color: #dc3545; font-size: 18px;">❌</span>
                                <div>
                                    <p style="margin: 0 0 5px 0; font-weight: 600;">Error:</p>
                                    <p style="margin: 0; font-size: 14px;">${error.message}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    resultDiv.style.display = 'block';
                } finally {
                    startImportBtn.disabled = false;
                    startImportBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    startImportBtn.style.cursor = 'pointer';
                }
            });
        }

        showImportAlert(message, type) {
            const importResult = document.getElementById('importResult');
            importResult.innerHTML = `
                <div class="alert alert-${type}" role="alert">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'x-circle'}"></i>
                    ${message}
                </div>
            `;
            importResult.classList.remove('d-none');
        }

        showImportResult(result, type) {
            let message;
            let icon;

            if (result.success) {
                message = result.message;
                icon = 'check-circle';
            } else {
                message = `Error: ${result.error}`;
                icon = 'x-circle';
            }

            const importResult = document.getElementById('importResult');
            importResult.innerHTML = `
                <div class="alert alert-${type}" role="alert">
                    <i class="bi bi-${icon}"></i>
                    <strong>${result.success ? 'Importación exitosa' : 'Error de importación'}</strong><br>
                    ${message}
                </div>
            `;
            importResult.classList.remove('d-none');
        }

        generateSQL() {
            SimpleSQLGenerator.quickGenerateSQL(this);
        }

        // Método para leer archivos como texto
        readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);
                reader.readAsText(file);
            });
        }
}

// Hacer disponible globalmente
window.UMLDiagramEditor = UMLDiagramEditor;

export { UMLDiagramEditor };
