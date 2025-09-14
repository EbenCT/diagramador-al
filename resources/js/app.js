// resources/js/app.js - VERSIÓN QUE FUNCIONABA + ARREGLOS MÍNIMOS
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

// Crear shapes UML personalizadas (IGUAL QUE FUNCIONABA)
window.UMLShapes = {};

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
                height: 40,
                y: 35
            },
            '.uml-class-methods-rect': {
                stroke: '#2563eb',
                'stroke-width': 1,
                fill: '#f8fafc',
                width: 200,
                height: 45,
                y: 75
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

        attrs['.uml-class-name-rect'].height = headerHeight;
        attrs['.uml-class-attrs-rect'].height = attrHeight;
        attrs['.uml-class-attrs-rect'].y = headerHeight;
        attrs['.uml-class-methods-rect'].height = methodHeight;
        attrs['.uml-class-methods-rect'].y = headerHeight + attrHeight;

        attrs['.uml-class-name-text'].text = className;
        attrs['.uml-class-attrs-text'].text = attributes.join('\n');
        attrs['.uml-class-methods-text'].text = methods.join('\n');

        this.set('size', { width: width, height: totalHeight });
        this.set('attrs', attrs);
    }
});

window.UMLShapes.createClass = function(options = {}) {
    const defaults = {
        position: { x: 0, y: 0 },
        className: 'MiClase',
        attributes: ['- id: int', '- nombre: String'],
        methods: ['+ getId(): int', '+ getNombre(): String']
    };

    return new window.UMLShapes.Class({...defaults, ...options});
};

// Editor UML (IGUAL QUE FUNCIONABA + ARREGLOS MÍNIMOS)
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

            // ✅ ARREGLO 1: INTERACTIVIDAD DINÁMICA CORRECTA
            interactive: (elementView) => {
                console.log('🔧 Interactividad consultada para tool:', this.selectedTool);
                // Solo interactivo cuando está en modo seleccionar
                return this.selectedTool === 'select';
            },

            defaultLink: new joint.shapes.standard.Link(),
            linkPinning: false,
            snapLabels: true
        });

        // Zoom con mouse wheel (MANTENER IGUAL)
        this.paper.on('blank:mousewheel', (evt, x, y, delta) => {
            evt.preventDefault();
            this.zoom(x, y, delta);
        });

        // Click en canvas (MANTENER IGUAL)
        this.paper.on('blank:pointerdown', (evt, x, y) => {
            this.handleCanvasClick(x, y);
        });

        // Selección de elementos (MANTENER IGUAL)
        this.paper.on('element:pointerdown', (elementView) => {
            this.selectElement(elementView.model);
        });
    }

    setupEventListeners() {
        // Zoom buttons (MANTENER IGUAL)
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
        console.log('🎧 Configurando listeners Livewire...');

        // ✅ ARREGLO 2: LISTENER MEJORADO + POLLING DE RESPALDO
        window.addEventListener('tool-selected', (event) => {
            console.log('📡 Evento Livewire recibido:', event.detail);
            this.selectedTool = event.detail;

            // Importante: actualizar interactividad del paper
            this.paper.setInteractivity((elementView) => {
                return this.selectedTool === 'select';
            });

            console.log('🔧 Tool actualizado a:', this.selectedTool);
        });

        // POLLING DE RESPALDO MEJORADO: Detectar botones activos
        let lastDetectedTool = 'select';
        setInterval(() => {
            try {
                // Buscar TODOS los botones posibles
                const allButtons = document.querySelectorAll('button[wire\\:click*="selectTool"]');
                console.log('🔍 Polling: Botones encontrados:', allButtons.length);

                let activeButton = null;

                // Buscar por clases CSS que indican activo
                const activeSelectors = [
                    '.border-blue-500',
                    '.bg-blue-50',
                    '.text-blue-700'
                ];

                for (const selector of activeSelectors) {
                    activeButton = document.querySelector(`button[wire\\:click*="selectTool"]${selector}`);
                    if (activeButton) {
                        console.log('🔍 Botón activo encontrado con selector:', selector);
                        break;
                    }
                }

                if (activeButton) {
                    const buttonText = activeButton.textContent.toLowerCase().trim();
                    console.log('🔍 Texto del botón activo:', buttonText);

                    let toolFromDOM = 'select';

                    if (buttonText.includes('clase')) toolFromDOM = 'class';
                    else if (buttonText.includes('asociación')) toolFromDOM = 'association';
                    else if (buttonText.includes('herencia')) toolFromDOM = 'inheritance';
                    else if (buttonText.includes('agregación')) toolFromDOM = 'aggregation';
                    else if (buttonText.includes('composición')) toolFromDOM = 'composition';
                    else if (buttonText.includes('seleccionar')) toolFromDOM = 'select';

                    console.log('🔍 Tool detectado del DOM:', toolFromDOM);

                    if (toolFromDOM !== lastDetectedTool) {
                        console.log('🔄 POLLING: Cambio detectado!', lastDetectedTool, '->', toolFromDOM);
                        this.selectedTool = toolFromDOM;
                        lastDetectedTool = toolFromDOM;

                        // Actualizar interactividad
                        this.paper.setInteractivity((elementView) => {
                            return this.selectedTool === 'select';
                        });

                        console.log('✅ Tool actualizado via polling a:', this.selectedTool);
                    }
                } else {
                    console.log('❌ No se encontró botón activo');
                }

            } catch (error) {
                console.error('Error en polling:', error);
            }
        }, 500); // Cada 500ms para debugging

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

    // Funciones de zoom (MANTENER IGUAL)
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

// Inicializar (MANTENER IGUAL + DEBUG HELPERS)
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('paper-container')) {
        const editor = new UMLDiagramEditor();

        window.DiagramEditor = {
            instance: editor,
            debug: {
                getTool: () => editor.selectedTool,
                setTool: (tool) => {
                    editor.selectedTool = tool;
                    editor.paper.setInteractivity((elementView) => {
                        return editor.selectedTool === 'select';
                    });
                    console.log('🔧 Tool cambiado manualmente a:', tool);
                }
            }
        };
    }
});
