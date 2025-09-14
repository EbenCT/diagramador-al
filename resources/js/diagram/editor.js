import * as joint from 'jointjs';
import $ from 'jquery';

// Namespace para el editor
window.DiagramEditor = {};

class UMLDiagramEditor {
    constructor() {
        this.graph = new joint.dia.Graph();
        this.paper = null;
        this.selectedTool = 'select';
        this.selectedElement = null;
        this.currentZoom = 1;

        this.init();
    }

    init() {
        this.createPaper();
        this.setupEventListeners();
        this.setupLivewireListeners();
        this.loadDiagramData();
    }

    createPaper() {
        const container = document.getElementById('paper-container');

        this.paper = new joint.dia.Paper({
            el: container,
            model: this.graph,
            width: '100%',
            height: '100%',
            gridSize: 20,
            drawGrid: true,
            background: {
                color: '#f9fafb'
            },
            interactive: (element) => {
                // Solo interactivo si la herramienta de selección está activa
                return this.selectedTool === 'select';
            },
            defaultLink: new joint.shapes.standard.Link(),
            linkPinning: false,
            snapLabels: true
        });

        // Configurar zoom con mouse wheel
        this.paper.on('blank:mousewheel', (evt, x, y, delta) => {
            evt.preventDefault();
            this.zoom(x, y, delta);
        });

        // Manejar clicks en el canvas vacío
        this.paper.on('blank:pointerdown', (evt, x, y) => {
            this.handleCanvasClick(x, y);
        });

        // Manejar selección de elementos
        this.paper.on('element:pointerdown', (elementView) => {
            this.selectElement(elementView.model);
        });
    }

    setupEventListeners() {
        // Botones de zoom
        document.getElementById('zoom-in')?.addEventListener('click', () => {
            this.zoomIn();
        });

        document.getElementById('zoom-out')?.addEventListener('click', () => {
            this.zoomOut();
        });

        document.getElementById('zoom-fit')?.addEventListener('click', () => {
            this.zoomToFit();
        });

        // Guardar con Ctrl+S
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDiagram();
            }
        });
    }

    setupLivewireListeners() {
        // Escuchar cambios de herramienta desde Livewire
        window.addEventListener('tool-selected', (event) => {
            this.selectedTool = event.detail;
            this.paper.setInteractivity(this.selectedTool === 'select');
        });

        // Escuchar comando de limpiar diagrama
        window.addEventListener('clear-diagram', () => {
            this.clearDiagram();
        });
    }

    handleCanvasClick(x, y) {
        if (this.selectedTool === 'select') return;

        switch (this.selectedTool) {
            case 'class':
                this.createClass(x, y);
                break;
        }
    }

    createClass(x, y) {
        const className = prompt('Nombre de la clase:', 'MiClase') || 'MiClase';

        // Usar la nueva función factory para evitar errores
        const classElement = window.UMLShapes.createClass({
            position: { x: x - 75, y: y - 60 },
            size: { width: 150, height: 120 },
            name: className,
            attributes: [
                '- id: int',
                '- nombre: String',
                '- email: String'
            ],
            methods: [
                '+ getId(): int',
                '+ getNombre(): String',
                '+ setNombre(nombre: String): void'
            ]
        });

        this.graph.addCell(classElement);
        this.updateCanvasInfo();
    }

    selectElement(element) {
        // Deseleccionar elemento anterior
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement, false);
        }

        // Seleccionar nuevo elemento
        this.selectedElement = element;
        this.highlightElement(element, true);
    }

    highlightElement(element, highlight) {
        const elementView = this.paper.findViewByModel(element);
        if (elementView) {
            if (highlight) {
                elementView.highlight();
            } else {
                elementView.unhighlight();
            }
        }
    }

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

    loadDiagramData() {
        if (window.diagramData) {
            try {
                const data = JSON.parse(window.diagramData);
                if (data.cells && data.cells.length > 0) {
                    this.graph.fromJSON(data);
                    this.updateCanvasInfo();
                }
            } catch (e) {
                console.error('Error al cargar datos del diagrama:', e);
            }
        }
    }

    saveDiagram() {
        const diagramData = JSON.stringify(this.graph.toJSON());

        // Enviar a Livewire
        if (window.Livewire) {
            window.Livewire.dispatch('saveDiagram', diagramData);
        }
    }

    clearDiagram() {
        this.graph.clear();
        this.selectedElement = null;
        this.updateCanvasInfo();
    }

    getDiagramData() {
        return this.graph.toJSON();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('paper-container')) {
        window.DiagramEditor.instance = new UMLDiagramEditor();
    }
});

export { UMLDiagramEditor };
