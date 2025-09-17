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
        this.paper.on('link:pointerdblclick', this.onLinkDoubleClick.bind(this));

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

        // Actualizar cursor del canvas
        var paperEl = document.querySelector('.joint-paper');
        if (paperEl) {
            paperEl.setAttribute('data-tool', tool);
        }

        // Mostrar instrucciones
        this.showToolInstructions(tool);

        console.log('✅ Tool cambiado a:', tool);
    }

    showToolInstructions(tool) {
        var instructions = {
            'select': 'Haz clic para seleccionar • Arrastra para mover • Doble clic para editar elemento o relación',
            'class': 'Haz clic en el canvas para crear una nueva clase',
            'association': 'Selecciona dos clases para crear una asociación • Doble clic en la línea para editar',
            'inheritance': 'Selecciona clase hijo, luego clase padre • Doble clic en la línea para agregar nombre',
            'aggregation': 'Selecciona contenedor, luego contenido • Doble clic en la línea para editar',
            'composition': 'Selecciona todo, luego parte • Doble clic en la línea para editar'
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

    onLinkDoubleClick(linkView, evt) {
        // Editar relación al hacer doble click
        this.editRelationship(linkView.model);
    }

    editRelationship(link) {
        console.log('✏️ Editando relación...');

        // Obtener datos actuales de la relación
        var relationData = link.get('relationData') || {};
        var currentType = relationData.type || 'association';

        // Obtener multiplicidad actual de las etiquetas
        var labels = link.get('labels') || [];
        var sourceMultiplicity = '1';
        var targetMultiplicity = '*';
        var relationName = relationData.name || '';

        if (labels.length >= 2) {
            sourceMultiplicity = labels[0].attrs.text.text || '1';
            targetMultiplicity = labels[1].attrs.text.text || '*';
        }

        // Si hay nombre de relación, está en la etiqueta del medio
        if (labels.length >= 3) {
            relationName = labels[2].attrs.text.text || '';
        }

        console.log('📊 Datos actuales:', {
            type: currentType,
            source: sourceMultiplicity,
            target: targetMultiplicity,
            name: relationName
        });

        // Prompts para editar (solo multiplicidad para herencia no tiene sentido)
        if (currentType !== 'inheritance') {
            var newSourceMult = prompt('Multiplicidad origen (1, 0..1, 1..*, *):', sourceMultiplicity);
            if (newSourceMult === null) return;

            var newTargetMult = prompt('Multiplicidad destino (1, 0..1, 1..*, *):', targetMultiplicity);
            if (newTargetMult === null) return;

            // Actualizar multiplicidad
            this.updateLinkLabels(link, newSourceMult.trim(), newTargetMult.trim());
        }

        // Prompt para nombre de relación (para todos los tipos)
        var newName = prompt('Nombre de la relación (opcional):', relationName);
        if (newName !== null) {
            this.setRelationshipName(link, newName.trim());
        }

        console.log('✅ Relación editada');
    }

    setRelationshipName(link, name) {
        var labels = link.get('labels') || [];

        // Quitar etiqueta de nombre anterior si existe
        labels = labels.filter(function(label, index) {
            return index < 2; // Mantener solo multiplicidad (primeras 2 etiquetas)
        });

        // Agregar nueva etiqueta de nombre si se proporciona
        if (name && name.length > 0) {
            labels.push({
                attrs: {
                    text: {
                        text: name,
                        fill: '#1e40af',
                        fontSize: 11,
                        fontStyle: 'italic',
                        fontWeight: 'bold'
                    },
                    rect: {
                        fill: '#f0f9ff',
                        stroke: '#2563eb',
                        strokeWidth: 1,
                        rx: 3,
                        ry: 2
                    }
                },
                position: { distance: 0.5, offset: -20 }
            });
        }

        link.set('labels', labels);

        // Guardar datos de la relación
        var relationData = link.get('relationData') || {};
        relationData.name = name;
        link.set('relationData', relationData);

        console.log('✅ Nombre de relación actualizado:', name);
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

        // Prompts para atributos y métodos
        var attributes = prompt(
            'Atributos (uno por línea, formato: visibilidad nombre: tipo)\nEjemplo: - id: int',
            '- id: int\n- ' + className.toLowerCase() + 'Name: String'
        );

        var methods = prompt(
            'Métodos (uno por línea, formato: visibilidad nombre(params): retorno)\nEjemplo: + getId(): int',
            '+ getId(): int\n+ get' + className + 'Name(): String\n+ set' + className + 'Name(name: String): void'
        );

        // Procesar atributos y métodos
        var attrLines = attributes ? attributes.split('\n').filter(line => line.trim()) : [];
        var methodLines = methods ? methods.split('\n').filter(line => line.trim()) : [];

        // Construir el texto completo de la clase
        var classText = className;
        if (attrLines.length > 0) {
            classText += '\n\n' + attrLines.join('\n');
        }
        if (methodLines.length > 0) {
            classText += '\n\n' + methodLines.join('\n');
        }

        // Usar shape estándar con mejor apariencia UML
        var classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - 100, y: y - 60 },
            size: { width: 220, height: Math.max(120, 40 + (attrLines.length + methodLines.length) * 15) },
            attrs: {
                body: {
                    fill: '#f8fafc',
                    stroke: '#2563eb',
                    strokeWidth: 2,
                    rx: 3,
                    ry: 3
                },
                label: {
                    text: classText,
                    fontSize: 11,
                    fontFamily: 'Consolas, monospace',
                    fill: '#1e40af',
                    textVerticalAnchor: 'top',
                    textAnchor: 'start',
                    x: 10,
                    y: 10
                }
            },
            // Datos custom para edición
            umlData: {
                className: className,
                attributes: attrLines,
                methods: methodLines
            }
        });

        this.graph.addCell(classElement);
        this.updateCanvasInfo();

        // Volver a select
        this.selectTool('select');

        console.log('✅ Clase creada:', className, 'con', attrLines.length, 'atributos y', methodLines.length, 'métodos');
    }

    createRelationship(source, target) {
        var link;

        // Usar shapes estándar de JointJS con mejor apariencia
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
                        attrs: { text: { text: '1', fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
                        position: { distance: 0.1, offset: 15 }
                    }, {
                        attrs: { text: { text: '*', fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
                        position: { distance: 0.9, offset: 15 }
                    }],
                    relationData: { type: 'association' }
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
                                d: 'M 15 -8 0 0 15 8 z',
                                fill: 'white',
                                stroke: '#2563eb',
                                strokeWidth: 2
                            }
                        }
                    },
                    relationData: { type: 'inheritance' }
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
                                d: 'M 15 -6 8 0 15 6 22 0 z',
                                fill: 'white',
                                stroke: '#2563eb',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: [{
                        attrs: { text: { text: '1', fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
                        position: { distance: 0.1, offset: 15 }
                    }, {
                        attrs: { text: { text: '*', fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
                        position: { distance: 0.9, offset: 15 }
                    }],
                    relationData: { type: 'aggregation' }
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
                                d: 'M 15 -6 8 0 15 6 22 0 z',
                                fill: '#2563eb',
                                stroke: '#2563eb',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: [{
                        attrs: { text: { text: '1', fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
                        position: { distance: 0.1, offset: 15 }
                    }, {
                        attrs: { text: { text: '*', fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
                        position: { distance: 0.9, offset: 15 }
                    }],
                    relationData: { type: 'composition' }
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

        var relationName = prompt('Nombre de la relación (opcional):', '');

        // Actualizar las etiquetas
        this.updateLinkLabels(link, sourceMultiplicity.trim(), targetMultiplicity.trim());

        // Agregar nombre si se proporcionó
        if (relationName && relationName.trim()) {
            this.setRelationshipName(link, relationName.trim());
        }

        console.log('✅ Relación configurada con multiplicidad y nombre');
    }

    updateLinkLabels(link, sourceText, targetText) {
        var labels = link.get('labels') || [];

        // Mantener solo las primeras 2 etiquetas (multiplicidad) y cualquier etiqueta de nombre
        var nameLabel = null;
        if (labels.length >= 3) {
            nameLabel = labels[2]; // Guardar etiqueta de nombre si existe
        }

        // Crear nuevas etiquetas de multiplicidad
        var newLabels = [{
            attrs: { text: { text: sourceText, fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
            position: { distance: 0.1, offset: 15 }
        }, {
            attrs: { text: { text: targetText, fill: '#2563eb', fontSize: 12, fontWeight: 'bold' } },
            position: { distance: 0.9, offset: 15 }
        }];

        // Agregar etiqueta de nombre si existía
        if (nameLabel) {
            newLabels.push(nameLabel);
        }

        link.set('labels', newLabels);

        // Guardar datos de multiplicidad
        var relationData = link.get('relationData') || {};
        relationData.sourceMultiplicity = sourceText;
        relationData.targetMultiplicity = targetText;
        link.set('relationData', relationData);

        console.log('✅ Multiplicidad actualizada:', sourceText, '←→', targetText);
    }

    editClass(classElement) {
        // Obtener datos UML guardados o extraer del texto actual
        var umlData = classElement.get('umlData');
        var currentName, currentAttrs, currentMethods;

        if (umlData) {
            currentName = umlData.className;
            currentAttrs = umlData.attributes || [];
            currentMethods = umlData.methods || [];
        } else {
            // Extraer del texto actual (para compatibilidad)
            var currentText = classElement.attr('label/text') || '';
            var lines = currentText.split('\n');
            currentName = lines[0] || 'MiClase';
            currentAttrs = ['- id: int', '- name: String'];
            currentMethods = ['+ getId(): int', '+ getName(): String'];
        }

        // Prompts de edición
        var newName = prompt('Nombre de la clase:', currentName);
        if (newName === null) return;

        var attrsString = prompt(
            'Atributos (uno por línea):\nFormato: visibilidad nombre: tipo\nEjemplo: - id: int',
            currentAttrs.join('\n')
        );
        if (attrsString === null) return;

        var methodsString = prompt(
            'Métodos (uno por línea):\nFormato: visibilidad nombre(params): retorno\nEjemplo: + getId(): int',
            currentMethods.join('\n')
        );
        if (methodsString === null) return;

        // Procesar nuevos datos
        var newAttrs = attrsString.split('\n').map(line => line.trim()).filter(line => line);
        var newMethods = methodsString.split('\n').map(line => line.trim()).filter(line => line);

        // Construir nuevo texto
        var newText = newName;
        if (newAttrs.length > 0) {
            newText += '\n\n' + newAttrs.join('\n');
        }
        if (newMethods.length > 0) {
            newText += '\n\n' + newMethods.join('\n');
        }

        // Actualizar elemento
        classElement.attr('label/text', newText);

        // Ajustar tamaño basado en contenido
        var newHeight = Math.max(120, 40 + (newAttrs.length + newMethods.length) * 15);
        classElement.resize(220, newHeight);

        // Guardar datos UML para futuras ediciones
        classElement.set('umlData', {
            className: newName,
            attributes: newAttrs,
            methods: newMethods
        });

        console.log('✅ Clase editada:', newName, 'con', newAttrs.length, 'atributos y', newMethods.length, 'métodos');
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
        var elements = this.graph.getElements();
        var links = this.graph.getLinks();
        var elementCount = elements.length;
        var linkCount = links.length;
        var zoomPercent = Math.round(this.currentZoom * 100);

        var infoElement = document.getElementById('canvas-info');
        if (infoElement) {
            infoElement.textContent = `📦 ${elementCount} clases | 🔗 ${linkCount} relaciones | 🔍 ${zoomPercent}%`;
        }

        // Actualizar título del diagrama si está disponible
        if (window.currentDiagramTitle) {
            var titleNav = document.getElementById('diagram-title-nav');
            if (titleNav) {
                titleNav.textContent = window.currentDiagramTitle;
            }

            // Actualizar título de la página
            document.title = window.currentDiagramTitle + ' - Editor UML';
        }
    }

    // Persistencia con nombre
    saveDiagram() {
        try {
            var diagramData = JSON.stringify(this.graph.toJSON());

            // Si es un diagrama nuevo, pedir título
            if (!window.currentDiagramId) {
                var title = prompt('Título del diagrama:', 'Mi Diagrama UML');
                if (!title) {
                    console.log('❌ Guardado cancelado por el usuario');
                    return;
                }
                window.currentDiagramTitle = title;
            }

            if (window.Livewire) {
                console.log('💾 Guardando diagrama...');
                if (window.currentDiagramTitle) {
                    // Enviar título junto con los datos
                    window.Livewire.dispatch('save-diagram', [diagramData, window.currentDiagramTitle]);
                } else {
                    window.Livewire.dispatch('save-diagram', [diagramData]);
                }
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
        console.log('🔄 Cargando datos del diagrama...');
        console.log('📊 Datos disponibles:', window.diagramData);

        if (window.diagramData && window.diagramData !== '[]') {
            try {
                var data = JSON.parse(window.diagramData);
                console.log('📋 Datos parseados:', data);

                if (data.cells && data.cells.length > 0) {
                    this.graph.fromJSON(data);
                    this.updateCanvasInfo();

                    // Ajustar zoom para mostrar todo el diagrama
                    setTimeout(() => {
                        this.zoomToFit();
                    }, 500);

                    console.log('✅ Diagrama cargado con', data.cells.length, 'elementos');
                } else {
                    console.log('ℹ️ No hay elementos en el diagrama');
                }
            } catch (e) {
                console.error('❌ Error cargando diagrama:', e);
                console.error('📊 Datos que causaron error:', window.diagramData);
            }
        } else {
            console.log('ℹ️ No hay datos de diagrama para cargar');
        }

        // Establecer ID del diagrama si está disponible
        if (window.diagramId) {
            window.currentDiagramId = window.diagramId;
            console.log('🆔 ID del diagrama establecido:', window.currentDiagramId);
        }

        if (window.diagramTitle) {
            window.currentDiagramTitle = window.diagramTitle;
            console.log('📝 Título del diagrama establecido:', window.currentDiagramTitle);
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
