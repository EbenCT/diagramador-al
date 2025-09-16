// resources/js/diagram/editor.js - VERSIÓN SIN SHAPES PERSONALIZADAS
import * as joint from 'jointjs';

// Usar las shapes que YA VIENEN con JointJS
// No definir nuestras propias shapes

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

        this.init();
    }

    init() {
        this.createPaper();
        this.setupEventListeners();
        this.loadDiagramData();

        console.log('✅ UMLDiagramEditor inicializado correctamente');
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
            gridSize: 20,
            drawGrid: true,
            background: { color: '#f9fafb' },

            // Interactividad basada en herramienta
            interactive: function(elementView) {
                return this.selectedTool === 'select';
            }.bind(this),

            mouseWheelZoom: true,
        });

        // Eventos del paper
        this.paper.on('element:pointerdown', this.onElementClick.bind(this));
        this.paper.on('blank:pointerdown', this.onBlankClick.bind(this));
        this.paper.on('element:pointermove', this.updateCanvasInfo.bind(this));
        this.paper.on('link:pointerdown', this.onLinkClick.bind(this));
        this.paper.on('element:pointerdblclick', this.onElementDoubleClick.bind(this));

        console.log('✅ Paper creado correctamente');
    }

    setupEventListeners() {
        // Zoom controls
        var zoomIn = document.getElementById('zoom-in');
        var zoomOut = document.getElementById('zoom-out');
        var zoomFit = document.getElementById('zoom-fit');

        if (zoomIn) zoomIn.addEventListener('click', () => this.zoomIn());
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoomOut());
        if (zoomFit) zoomFit.addEventListener('click', () => this.zoomToFit());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDiagram();
            }

            // Herramientas rápidas sin modificadores
            if (!e.ctrlKey && !e.altKey && !e.metaKey) {
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

        console.log('✅ Event listeners configurados');
    }

    selectTool(tool) {
        console.log('🔧 Herramienta seleccionada:', tool);

        this.selectedTool = tool;
        this.relationshipMode = ['association', 'inheritance', 'aggregation', 'composition'].includes(tool);
        this.firstElementSelected = null;

        // Actualizar interactividad
        this.paper.setInteractivity(tool === 'select');

        // Mostrar instrucciones
        this.showToolInstructions(tool);

        console.log('✅ Tool cambiado a:', tool);
    }

    showToolInstructions(tool) {
        var instructions = {
            'select': 'Haz clic para seleccionar • Arrastra para mover • Doble clic para editar',
            'class': 'Haz clic en el canvas para crear una nueva clase',
            'association': 'Selecciona dos clases para crear una asociación',
            'inheritance': 'Selecciona clase hijo, luego clase padre',
            'aggregation': 'Selecciona contenedor, luego contenido',
            'composition': 'Selecciona todo, luego parte'
        };

        var instructionsEl = document.getElementById('tool-instructions');
        if (instructionsEl) {
            instructionsEl.textContent = instructions[tool] || '';
        }
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
            this.selectElement(null);
        }
    }

    onLinkClick(linkView, evt, x, y) {
        if (this.selectedTool === 'select') {
            this.selectElement(linkView.model);
        }
    }

    onElementDoubleClick(elementView, evt) {
        // Editar cualquier shape estándar como si fuera una clase
        if (elementView.model.get('type') === 'standard.Rectangle') {
            this.editClass(elementView.model);
        }
    }

    handleRelationshipClick(element) {
        if (!this.firstElementSelected) {
            this.firstElementSelected = element;
            this.highlightElement(element, true, 'orange');
            console.log('Primera clase seleccionada para', this.selectedTool);
        } else {
            if (this.firstElementSelected.id !== element.id) {
                this.createRelationship(this.firstElementSelected, element);
            }

            this.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
        }
    }

    createClass(x, y) {
        var className = prompt('Nombre de la clase:', 'MiClase');
        if (!className) return;

        // Usar shape básica de JointJS en lugar de UML personalizada
        var classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - 100, y: y - 60 },
            size: { width: 200, height: 120 },
            attrs: {
                body: {
                    fill: '#dbeafe',
                    stroke: '#2563eb',
                    strokeWidth: 2
                },
                label: {
                    text: className + '\n\n- id: int\n- name: String\n\n+ getId(): int\n+ getName(): String',
                    fontSize: 11,
                    fontFamily: 'Arial, sans-serif',
                    fill: '#1e40af'
                }
            }
        });

        this.graph.addCell(classElement);
        this.updateCanvasInfo();

        // Volver a select
        this.selectTool('select');

        console.log('✅ Clase creada:', className);
    }

    createRelationship(source, target) {
        var link;

        // Usar shapes estándar de JointJS en lugar de UML personalizadas
        switch(this.selectedTool) {
            case 'association':
                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#2563eb',
                            strokeWidth: 2
                        }
                    },
                    labels: [{
                        attrs: { text: { text: '1' } },
                        position: { distance: 0.1 }
                    }, {
                        attrs: { text: { text: '*' } },
                        position: { distance: 0.9 }
                    }]
                });
                break;

            case 'inheritance':
                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#2563eb',
                            strokeWidth: 2,
                            targetMarker: {
                                type: 'path',
                                d: 'M 10 -5 0 0 10 5 z',
                                fill: 'white',
                                stroke: '#2563eb'
                            }
                        }
                    }
                });
                break;

            case 'aggregation':
                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#2563eb',
                            strokeWidth: 2,
                            sourceMarker: {
                                type: 'path',
                                d: 'M 10 -5 5 0 10 5 15 0 z',
                                fill: 'white',
                                stroke: '#2563eb'
                            }
                        }
                    },
                    labels: [{
                        attrs: { text: { text: '1' } },
                        position: { distance: 0.1 }
                    }, {
                        attrs: { text: { text: '*' } },
                        position: { distance: 0.9 }
                    }]
                });
                break;

            case 'composition':
                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#2563eb',
                            strokeWidth: 2,
                            sourceMarker: {
                                type: 'path',
                                d: 'M 10 -5 5 0 10 5 15 0 z',
                                fill: '#2563eb',
                                stroke: '#2563eb'
                            }
                        }
                    },
                    labels: [{
                        attrs: { text: { text: '1' } },
                        position: { distance: 0.1 }
                    }, {
                        attrs: { text: { text: '*' } },
                        position: { distance: 0.9 }
                    }]
                });
                break;

            default:
                console.error('Tipo de relación no soportado:', this.selectedTool);
                return;
        }

        this.graph.addCell(link);

        // Configurar multiplicidad para relaciones que no son herencia
        if (this.selectedTool !== 'inheritance') {
            setTimeout(() => {
                this.promptForMultiplicity(link);
            }, 100);
        }

        console.log('✅ Relación', this.selectedTool, 'creada');
    }

    promptForMultiplicity(link) {
        var sourceMultiplicity = prompt('Multiplicidad origen (1, 0..1, 1..*, *):', '1');
        if (sourceMultiplicity === null) return;

        var targetMultiplicity = prompt('Multiplicidad destino (1, 0..1, 1..*, *):', '*');
        if (targetMultiplicity === null) return;

        // Actualizar las etiquetas
        this.updateLinkLabels(link, sourceMultiplicity.trim(), targetMultiplicity.trim());
    }

    updateLinkLabels(link, sourceText, targetText) {
        var labels = link.get('labels') || [];

        if (labels.length >= 2) {
            labels[0].attrs.text.text = sourceText;
            labels[1].attrs.text.text = targetText;

            link.set('labels', labels);
            console.log('✅ Multiplicidad actualizada:', sourceText, targetText);
        }
    }

    editClass(classElement) {
        // Obtener texto actual del label
        var currentText = classElement.attr('label/text') || '';
        var lines = currentText.split('\n');

        var currentName = lines[0] || 'MiClase';

        var newName = prompt('Nombre de la clase:', currentName);
        if (newName === null) return;

        // Crear nuevo texto para la clase
        var newText = newName + '\n\n- id: int\n- name: String\n\n+ getId(): int\n+ getName(): String';

        // Actualizar el elemento
        classElement.attr('label/text', newText);

        console.log('✅ Clase editada:', newName);
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement, false);
        }

        this.selectedElement = element;
        if (element) {
            this.highlightElement(element, true);
        }
    }

    highlightElement(element, highlight, color) {
        color = color || 'blue';
        var elementView = this.paper.findViewByModel(element);
        if (elementView) {
            if (highlight) {
                elementView.highlight();
            } else {
                elementView.unhighlight();
            }
        }
    }

    // Métodos de zoom
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
        var elementCount = this.graph.getElements().length;
        var zoomPercent = Math.round(this.currentZoom * 100);

        var infoElement = document.getElementById('canvas-info');
        if (infoElement) {
            infoElement.textContent = 'Elementos: ' + elementCount + ' | Zoom: ' + zoomPercent + '%';
        }
    }

    // Persistencia
    saveDiagram() {
        try {
            var diagramData = JSON.stringify(this.graph.toJSON());

            if (window.Livewire) {
                console.log('💾 Guardando diagrama...');
                window.Livewire.dispatch('save-diagram', [diagramData]);
                console.log('✅ Datos enviados a Livewire');
            } else {
                console.error('❌ Livewire no disponible');
                alert('Error: Sistema de guardado no disponible');
            }
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            alert('Error al guardar el diagrama');
        }
    }

    loadDiagramData() {
        if (window.diagramData && window.diagramData !== '[]') {
            try {
                var data = JSON.parse(window.diagramData);
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

// Hacer disponible globalmente
window.UMLDiagramEditor = UMLDiagramEditor;

export { UMLDiagramEditor };
