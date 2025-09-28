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
import { SimpleSQLGenerator } from './utils/simpleSQLGenerator.js';
import { SimpleJavaGenerator } from './utils/simpleJavaGenerator.js';
import { SimplePostmanGenerator } from './utils/simplePostmanGenerator.js';
import { DiagramAIAnalyzer } from './modules-ai/DiagramAIAnalyzer.js';
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

        generateSQL() {
            SimpleSQLGenerator.quickGenerateSQL(this);
        }
}

// Hacer disponible globalmente
window.UMLDiagramEditor = UMLDiagramEditor;

export { UMLDiagramEditor };
