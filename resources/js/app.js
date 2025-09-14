// resources/js/app.js - VERSIÓN FINAL COMPLETA
import './bootstrap';
import Alpine from 'alpinejs';
import * as joint from 'jointjs';
import $ from 'jquery';

// Asignar a window
window.$ = window.jQuery = $;
window.joint = joint;
window.Alpine = Alpine;

// Iniciar Alpine
Alpine.start();

// Crear shapes UML personalizadas (sin modificar joint.shapes)
window.UMLShapes = {};

// Clase UML completa
window.UMLShapes.Class = joint.dia.Element.extend({
    markup: [
        '<g class="rotatable">',
        '<rect class="uml-class-name-rect"/>',
        '<rect class="uml-class-attrs-rect"/>',
        '<rect class="uml-class-methods-rect"/>',
        '<text class="uml-class-name-text"/>',
        '<text class="uml-class-attrs-text"/>',
        '<text class="uml-class-methods-text"/>',
        '</g>'
    ].join(''),

    defaults: joint.util.deepSupplement({
        type: 'uml.Class',
        size: { width: 200, height: 120 },
        attrs: {
            '.uml-class-name-rect': {
                stroke: '#2563eb',
                'stroke-width': 2,
                fill: '#dbeafe',
                width: 200,
                height: 35
            },
            '.uml-class-attrs-rect': {
                stroke: '#2563eb',
                'stroke-width': 1,
                fill: '#ffffff',
                width: 200,
                y: 35
            },
            '.uml-class-methods-rect': {
                stroke: '#2563eb',
                'stroke-width': 1,
                fill: '#f8fafc',
                width: 200
            },
            '.uml-class-name-text': {
                ref: '.uml-class-name-rect',
                'ref-x': 0.5,
                'ref-y': 0.5,
                'text-anchor': 'middle',
                'y-alignment': 'middle',
                'font-weight': 'bold',
                fill: '#1e40af',
                'font-size': 14,
                'font-family': 'Arial, helvetica, sans-serif'
            },
            '.uml-class-attrs-text': {
                ref: '.uml-class-attrs-rect',
                'ref-x': 8,
                'ref-y': 5,
                fill: '#374151',
                'font-size': 11,
                'font-family': 'Consolas, monospace'
            },
            '.uml-class-methods-text': {
                ref: '.uml-class-methods-rect',
                'ref-x': 8,
                'ref-y': 5,
                fill: '#374151',
                'font-size': 11,
                'font-family': 'Consolas, monospace'
            }
        },
        className: 'MiClase',
        attributes: ['- id: int', '- nombre: String'],
        methods: ['+ getId(): int', '+ getNombre(): String'],
    }, joint.dia.Element.prototype.defaults),

    initialize: function() {
        this.on('change:className change:attributes change:methods', this.updateRectangles, this);
        this.updateRectangles();
        joint.dia.Element.prototype.initialize.apply(this, arguments);
    },

    updateRectangles: function() {
        const attrs = this.get('attrs');
        const className = this.get('className');
        const attributes = this.get('attributes') || [];
        const methods = this.get('methods') || [];

        const headerHeight = 35;
        const attrHeight = Math.max(25, attributes.length * 16 + 10);
        const methodHeight = Math.max(25, methods.length * 16 + 10);
        const totalHeight = headerHeight + attrHeight + methodHeight;
        const width = 200;

        // Actualizar dimensiones
        attrs['.uml-class-name-rect'].height = headerHeight;
        attrs['.uml-class-attrs-rect'].height = attrHeight;
        attrs['.uml-class-attrs-rect'].y = headerHeight;
        attrs['.uml-class-methods-rect'].height = methodHeight;
        attrs['.uml-class-methods-rect'].y = headerHeight + attrHeight;

        // Actualizar textos
        attrs['.uml-class-name-text'].text = className;
        attrs['.uml-class-attrs-text'].text = attributes.join('\n');
        attrs['.uml-class-methods-text'].text = methods.join('\n');

        this.set('size', { width: width, height: totalHeight });
        this.set('attrs', attrs);
    }
});

// Factory function
window.UMLShapes.createClass = function(options = {}) {
    const defaults = {
        position: { x: 0, y: 0 },
        className: 'MiClase',
        attributes: ['- id: int', '- nombre: String'],
        methods: ['+ getId(): int', '+ getNombre(): String']
    };

    return new window.UMLShapes.Class({...defaults, ...options});
};

// Editor UML completo
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
        if (!container) return;

        this.paper = new joint.dia.Paper({
            el: container,
            model: this.graph,
            width: '100%',
            height: '100%',
            gridSize: 20,
            drawGrid: true,
            background: { color: '#f9fafb' },
            interactive: (element) => this.selectedTool === 'select',
            defaultLink: new joint.shapes.standard.Link(),
            linkPinning: false,
            snapLabels: true
        });

        // Zoom con mouse wheel
        this.paper.on('blank:mousewheel', (evt, x, y, delta) => {
            evt.preventDefault();
            this.zoom(x, y, delta);
        });

        // Click en canvas
        this.paper.on('blank:pointerdown', (evt, x, y) => {
            this.handleCanvasClick(x, y);
        });

        // Selección de elementos
        this.paper.on('element:pointerdown', (elementView) => {
            this.selectElement(elementView.model);
        });
    }

    setupEventListeners() {
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit')?.addEventListener('click', () => this.zoomToFit());

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDiagram();
            }
        });
    }

    setupLivewireListeners() {
        window.addEventListener('tool-selected', (event) => {
            this.selectedTool = event.detail;
            this.paper.setInteractivity(this.selectedTool === 'select');
        });

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
        try {
            const className = prompt('Nombre de la clase:', 'MiClase');
            if (!className) return;

            const classElement = window.UMLShapes.createClass({
                position: { x: x - 100, y: y - 60 },
                className: className,
                attributes: [
                    '- id: int',
                    `- ${className.toLowerCase()}Name: String`
                ],
                methods: [
                    '+ getId(): int',
                    `+ get${className}Name(): String`,
                    `+ set${className}Name(name: String): void`
                ]
            });

            this.graph.addCell(classElement);
            this.updateCanvasInfo();

        } catch (error) {
            console.error('Error creando clase:', error);
        }
    }

    selectElement(element) {
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement, false);
        }
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
        if (window.diagramData && window.diagramData !== '[]') {
            try {
                const data = JSON.parse(window.diagramData);
                if (data.cells && data.cells.length > 0) {
                    this.graph.fromJSON(data);
                    this.updateCanvasInfo();
                }
            } catch (e) {
                console.error('Error cargando diagrama:', e);
            }
        }
    }

    saveDiagram() {
        try {
            const diagramData = JSON.stringify(this.graph.toJSON());
            if (window.Livewire) {
                window.Livewire.dispatch('save-diagram', [diagramData]);
            }
        } catch (error) {
            console.error('Error guardando:', error);
        }
    }

    clearDiagram() {
        this.graph.clear();
        this.selectedElement = null;
        this.updateCanvasInfo();
    }
}

// Inicializar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('paper-container')) {
        window.DiagramEditor = { instance: new UMLDiagramEditor() };
    }
});
