// resources/js/diagram/editor.js - VERSIÓN MEJORADA
import * as joint from 'jointjs';

export class UMLDiagramEditor {
    constructor() {
        this.graph = new joint.dia.Graph();
        this.paper = null;
        this.selectedTool = 'select';
        this.selectedElement = null;
        this.currentZoom = 1;

        // Estados para relaciones
        this.relationshipMode = false;
        this.firstElementSelected = null;

        this.init();
    }

    init() {
        this.createPaper();
        this.setupEventListeners();
        this.setupToolbar();
        this.loadDiagramData();

        console.log('✅ UMLDiagramEditor inicializado');
    }

    createPaper() {
        const container = document.getElementById('paper-container');
        if (!container) {
            console.error('❌ Container #paper-container no encontrado');
            return;
        }

        this.paper = new joint.dia.Paper({
            el: container,
            model: this.graph,
            width: '100%',
            height: '100%',
            gridSize: 20,
            drawGrid: true,
            background: { color: '#f9fafb' },

            // Interactividad dinámica basada en herramienta seleccionada
            interactive: (elementView) => {
                return this.selectedTool === 'select';
            },

            // Configuración de zoom con mouse wheel
            mouseWheelZoom: true,
        });

        // Eventos del paper
        this.paper.on('element:pointerdown', this.onElementClick.bind(this));
        this.paper.on('blank:pointerdown', this.onBlankClick.bind(this));
        this.paper.on('element:pointermove', this.updateCanvasInfo.bind(this));
        this.paper.on('link:pointerdown', this.onLinkClick.bind(this));
        this.paper.on('element:pointerdblclick', this.onElementDoubleClick.bind(this));
        this.paper.on('link:pointerdblclick', this.onLinkDoubleClick.bind(this));
    }

    setupEventListeners() {
        // Zoom controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit')?.addEventListener('click', () => this.zoomToFit());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDiagram();
            }

            // Herramientas rápidas
            if (!e.ctrlKey && !e.altKey) {
                switch(e.key) {
                    case '1': this.selectTool('select'); break;
                    case '2': this.selectTool('class'); break;
                    case '3': this.selectTool('association'); break;
                    case '4': this.selectTool('inheritance'); break;
                    case '5': this.selectTool('aggregation'); break;
                    case '6': this.selectTool('composition'); break;
                }
            }
        });
    }

    setupToolbar() {
        // Crear toolbar nativo en JavaScript (más confiable)
        const toolbar = this.createNativeToolbar();

        // Si hay un container específico para toolbar, usarlo
        const toolbarContainer = document.getElementById('js-toolbar');
        if (toolbarContainer) {
            toolbarContainer.innerHTML = '';
            toolbarContainer.appendChild(toolbar);
        }
    }

    createNativeToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'flex flex-col space-y-2 p-4';

        const tools = [
            { id: 'select', icon: '👆', label: 'Seleccionar', shortcut: '1' },
            { id: 'class', icon: '📦', label: 'Clase', shortcut: '2' },
            { id: 'association', icon: '↔️', label: 'Asociación', shortcut: '3' },
            { id: 'inheritance', icon: '⬆️', label: 'Herencia', shortcut: '4' },
            { id: 'aggregation', icon: '◇', label: 'Agregación', shortcut: '5' },
            { id: 'composition', icon: '♦️', label: 'Composición', shortcut: '6' },
        ];

        tools.forEach(tool => {
            const button = document.createElement('button');
            button.className = `flex items-center space-x-3 p-3 rounded-md border transition-all w-full text-left ${
                this.selectedTool === tool.id ?
                'border-blue-500 bg-blue-50 text-blue-700' :
                'border-gray-200 hover:bg-gray-50'
            }`;

            button.innerHTML = `
                <span class="text-lg">${tool.icon}</span>
                <span class="flex-1">${tool.label}</span>
                <code class="text-xs bg-gray-100 px-1 rounded">${tool.shortcut}</code>
            `;

            button.addEventListener('click', () => this.selectTool(tool.id));
            button.dataset.tool = tool.id;

            toolbar.appendChild(button);
        });

        return toolbar;
    }

    selectTool(tool) {
        console.log(`🔧 Herramienta seleccionada: ${tool}`);

        this.selectedTool = tool;
        this.relationshipMode = ['association', 'inheritance', 'aggregation', 'composition'].includes(tool);
        this.firstElementSelected = null;

        // Actualizar interactividad del paper
        this.paper.setInteractivity(tool === 'select');

        // Actualizar botones del toolbar
        this.updateToolbarButtons();

        // Mostrar instrucciones
        this.showToolInstructions(tool);
    }

    updateToolbarButtons() {
        const buttons = document.querySelectorAll('button[data-tool]');
        buttons.forEach(button => {
            const isActive = button.dataset.tool === this.selectedTool;
            button.className = `flex items-center space-x-3 p-3 rounded-md border transition-all w-full text-left ${
                isActive ?
                'border-blue-500 bg-blue-50 text-blue-700' :
                'border-gray-200 hover:bg-gray-50'
            }`;
        });
    }

    onLinkClick(linkView, evt, x, y) {
        if (this.selectedTool === 'select') {
            this.selectElement(linkView.model);
        } else if (this.relationshipMode) {
            // Los links no participan en creación de relaciones
            return;
        }
    }

    onElementDoubleClick(elementView, evt) {
        if (elementView.model.get('type') === 'uml.Class') {
            this.editClass(elementView.model);
        }
    }

    onLinkDoubleClick(linkView, evt) {
        this.editRelationship(linkView.model);
    }

    editClass(classElement) {
        const currentName = classElement.get('className');
        const currentAttrs = classElement.get('attributes') || [];
        const currentMethods = classElement.get('methods') || [];

        // Diálogo simplificado para editar clase
        const newName = prompt('Nombre de la clase:', currentName);
        if (newName === null) return;

        const attrsString = prompt(
            'Atributos (uno por línea, formato: visibilidad nombre: tipo):\nEjemplo: - id: int',
            currentAttrs.join('\n')
        );
        if (attrsString === null) return;

        const methodsString = prompt(
            'Métodos (uno por línea, formato: visibilidad nombre(params): retorno):\nEjemplo: + getId(): int',
            currentMethods.join('\n')
        );
        if (methodsString === null) return;

        // Actualizar la clase
        const newAttrs = attrsString.split('\n')
            .map(attr => attr.trim())
            .filter(attr => attr.length > 0);

        const newMethods = methodsString.split('\n')
            .map(method => method.trim())
            .filter(method => method.length > 0);

        classElement.set({
            className: newName.trim() || currentName,
            attributes: newAttrs,
            methods: newMethods
        });

        console.log('✅ Clase editada:', newName);
    }

    editRelationship(linkElement) {
        const relationshipType = linkElement.get('relationshipType');

        if (relationshipType === 'inheritance') {
            // Solo permitir editar nombre para herencia
            const currentName = linkElement.get('relationshipName') || '';
            const newName = prompt('Nombre de la relación de herencia (opcional):', currentName);

            if (newName !== null && linkElement.setRelationshipName) {
                linkElement.setRelationshipName(newName.trim());
            }
        } else {
            // Editar multiplicidad y nombre para otras relaciones
            const currentSourceMult = linkElement.get('sourceMultiplicity') || '1';
            const currentTargetMult = linkElement.get('targetMultiplicity') || '*';
            const currentName = linkElement.get('relationshipName') || '';

            const sourceMultiplicity = prompt('Multiplicidad origen:', currentSourceMult);
            if (sourceMultiplicity === null) return;

            const targetMultiplicity = prompt('Multiplicidad destino:', currentTargetMult);
            if (targetMultiplicity === null) return;

            const name = prompt('Nombre de la relación (opcional):', currentName);
            if (name === null) return;

            // Actualizar la relación
            if (linkElement.setMultiplicity) {
                linkElement.setMultiplicity(
                    sourceMultiplicity.trim() || '1',
                    targetMultiplicity.trim() || '*'
                );
            }

            if (name.trim() && linkElement.setRelationshipName) {
                linkElement.setRelationshipName(name.trim());
            }
        }

        console.log('✅ Relación editada:', relationshipType);
    }

    onElementClick(elementView, evt, x, y) {
        if (this.selectedTool === 'select') {
            this.selectElement(elementView.model);
            return;
        }

        if (this.relationshipMode) {
            this.handleRelationshipClick(elementView.model);
        }
    }

    onBlankClick(evt, x, y) {
        if (this.selectedTool === 'class') {
            this.createClass(x, y);
        } else if (this.selectedTool === 'select' && this.selectedElement) {
            // Deseleccionar
            this.selectElement(null);
        }
    }

    handleRelationshipClick(element) {
        if (!this.firstElementSelected) {
            this.firstElementSelected = element;
            this.highlightElement(element, true, 'orange');
            console.log(`Primera clase seleccionada para ${this.selectedTool}`);
        } else {
            if (this.firstElementSelected.id !== element.id) {
                this.createRelationship(this.firstElementSelected, element);
            }

            // Reset
            this.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
        }
    }

    createClass(x, y) {
        const className = prompt('Nombre de la clase:', 'MiClase');
        if (!className) return;

        // Prompt para atributos básicos
        const attrsPrompt = `Atributos iniciales para "${className}" (opcional, uno por línea):
Formato: visibilidad nombre: tipo
Ejemplo: - id: int
         + nombre: String`;

        const attrsString = prompt(attrsPrompt, `- id: int\n- ${className.toLowerCase()}Name: String`);
        const attributes = attrsString ?
            attrsString.split('\n').map(attr => attr.trim()).filter(attr => attr) :
            [`- id: int`, `- ${className.toLowerCase()}Name: String`];

        // Prompt para métodos básicos
        const methodsPrompt = `Métodos iniciales para "${className}" (opcional, uno por línea):
Formato: visibilidad nombre(parámetros): tipoRetorno
Ejemplo: + getId(): int
         + setNombre(nombre: String): void`;

        const methodsString = prompt(methodsPrompt, `+ getId(): int\n+ get${className}Name(): String\n+ set${className}Name(name: String): void`);
        const methods = methodsString ?
            methodsString.split('\n').map(method => method.trim()).filter(method => method) :
            [`+ getId(): int`, `+ get${className}Name(): String`, `+ set${className}Name(name: String): void`];

        const classElement = new joint.shapes.uml.Class({
            position: { x: x - 100, y: y - 60 },
            size: { width: 200, height: 120 },
            className: className,
            attributes: attributes,
            methods: methods
        });

        this.graph.addCell(classElement);
        this.updateCanvasInfo();

        // Volver a select después de crear
        this.selectTool('select');

        console.log('✅ Clase creada:', className);
    }

    showToolInstructions(tool) {
        const instructions = {
            'select': 'Haz clic para seleccionar • Arrastra para mover • Doble clic para editar',
            'class': 'Haz clic en el canvas para crear una nueva clase',
            'association': 'Selecciona dos clases para crear una asociación',
            'inheritance': 'Selecciona clase hijo, luego clase padre',
            'aggregation': 'Selecciona contenedor, luego contenido (diamante vacío)',
            'composition': 'Selecciona todo, luego parte (diamante lleno)'
        };

        // Mostrar en un elemento de instrucciones si existe
        const instructionsEl = document.getElementById('tool-instructions');
        if (instructionsEl) {
            instructionsEl.textContent = instructions[tool] || '';
        }
    }

    createRelationship(source, target) {
        const relationships = {
            'association': joint.shapes.uml.Association,
            'inheritance': joint.shapes.uml.Inheritance,
            'aggregation': joint.shapes.uml.Aggregation,
            'composition': joint.shapes.uml.Composition
        };

        const RelationshipClass = relationships[this.selectedTool];
        if (!RelationshipClass) return;

        const link = new RelationshipClass({
            source: { id: source.id },
            target: { id: target.id }
        });

        this.graph.addCell(link);

        // Mostrar diálogo de configuración para relaciones con multiplicidad
        if (this.selectedTool !== 'inheritance') {
            setTimeout(() => {
                this.showRelationshipConfigDialog(link);
            }, 100);
        }

        console.log(`✅ Relación ${this.selectedTool} creada`);
    }

    showRelationshipConfigDialog(link) {
        const config = this.promptRelationshipConfig(link.get('relationshipType'));

        if (config) {
            // Configurar multiplicidad si aplica
            if (config.sourceMultiplicity && config.targetMultiplicity && link.setMultiplicity) {
                link.setMultiplicity(config.sourceMultiplicity, config.targetMultiplicity);
            }

            // Configurar nombre de relación si se proporcionó
            if (config.name && link.setRelationshipName) {
                link.setRelationshipName(config.name);
            }
        }
    }

    promptRelationshipConfig(type) {
        let sourcePrompt, targetPrompt;

        switch(type) {
            case 'association':
                sourcePrompt = 'Multiplicidad origen (1, 0..1, 1..*, *):';
                targetPrompt = 'Multiplicidad destino (1, 0..1, 1..*, *):';
                break;
            case 'aggregation':
                sourcePrompt = 'Multiplicidad contenedor (típicamente 1):';
                targetPrompt = 'Multiplicidad contenido (1, *, etc.):';
                break;
            case 'composition':
                sourcePrompt = 'Multiplicidad todo (típicamente 1):';
                targetPrompt = 'Multiplicidad parte (1, *, etc.):';
                break;
            default:
                return null;
        }

        const sourceMultiplicity = prompt(sourcePrompt, '1');
        if (sourceMultiplicity === null) return null;

        const targetMultiplicity = prompt(targetPrompt, '*');
        if (targetMultiplicity === null) return null;

        const name = prompt('Nombre de la relación (opcional):');

        return {
            sourceMultiplicity: sourceMultiplicity.trim() || '1',
            targetMultiplicity: targetMultiplicity.trim() || '*',
            name: name ? name.trim() : null
        };
    }

    selectElement(element) {
        // Deseleccionar anterior
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement, false);
        }

        // Seleccionar nuevo
        this.selectedElement = element;
        if (element) {
            this.highlightElement(element, true);
        }
    }

    highlightElement(element, highlight, color = 'blue') {
        const elementView = this.paper.findViewByModel(element);
        if (elementView) {
            if (highlight) {
                elementView.highlight(null, {
                    highlighter: {
                        name: 'stroke',
                        options: {
                            attrs: {
                                'stroke': color,
                                'stroke-width': 3
                            }
                        }
                    }
                });
            } else {
                elementView.unhighlight();
            }
        }
    }

    // Métodos de zoom (mantener los que ya tienes)
    zoom(x, y, delta) {
        const oldZoom = this.currentZoom;
        const newZoom = Math.max(0.2, Math.min(3, oldZoom + delta * 0.1));

        if (newZoom !== oldZoom) {
            this.currentZoom = newZoom;
            this.paper.scale(newZoom, newZoom);
            this.updateCanvasInfo();
        }
    }

    zoomIn() {
        this.currentZoom = Math.min(3, this.currentZoom + 0.1);
        this.paper.scale(this.currentZoom, this.currentZoom);
        this.updateCanvasInfo();
    }

    zoomOut() {
        this.currentZoom = Math.max(0.2, this.currentZoom - 0.1);
        this.paper.scale(this.currentZoom, this.currentZoom);
        this.updateCanvasInfo();
    }

    zoomToFit() {
        this.paper.scaleContentToFit({ padding: 20 });
        this.currentZoom = this.paper.scale().sx;
        this.updateCanvasInfo();
    }

    updateCanvasInfo() {
        const elementCount = this.graph.getElements().length;
        const zoomPercent = Math.round(this.currentZoom * 100);

        const infoElement = document.getElementById('canvas-info');
        if (infoElement) {
            infoElement.textContent = `Elementos: ${elementCount} | Zoom: ${zoomPercent}%`;
        }
    }

    // Integración con Livewire para persistencia
    saveDiagram() {
        try {
            const diagramData = JSON.stringify(this.graph.toJSON());

            // Enviar a Livewire
            if (window.Livewire) {
                window.Livewire.dispatch('save-diagram', [diagramData]);
                console.log('✅ Diagrama enviado a Livewire para guardar');
            }
        } catch (error) {
            console.error('❌ Error al guardar:', error);
        }
    }

    loadDiagramData() {
        if (window.diagramData && window.diagramData !== '[]') {
            try {
                const data = JSON.parse(window.diagramData);
                if (data.cells && data.cells.length > 0) {
                    this.graph.fromJSON(data);
                    this.updateCanvasInfo();
                    console.log('✅ Diagrama cargado desde Livewire');
                }
            } catch (e) {
                console.error('❌ Error cargando diagrama:', e);
            }
        }
    }

    clearDiagram() {
        this.graph.clear();
        this.selectedElement = null;
        this.firstElementSelected = null;
        this.updateCanvasInfo();
    }

    // Método público para debugging
    getState() {
        return {
            selectedTool: this.selectedTool,
            elementCount: this.graph.getElements().length,
            zoom: this.currentZoom,
            relationshipMode: this.relationshipMode,
            hasSelection: !!this.selectedElement
        };
    }
}

// Inicialización global
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('paper-container');
    if (container) {
        const editor = new UMLDiagramEditor();

        // Hacer accesible globalmente para debugging
        window.DiagramEditor = {
            instance: editor,
            debug: () => editor.getState()
        };

        console.log('🎯 UML Diagram Editor listo! Usa window.DiagramEditor.debug() para ver estado');
    }
});
