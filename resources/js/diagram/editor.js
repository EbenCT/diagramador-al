// resources/js/diagram/editor.js - VERSIÓN CORREGIDA
import * as joint from 'jointjs';

// Configurar JointJS correctamente
joint.config.useCSSSelectors = true;

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
        // Shortcuts de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDiagram();
            } else if (e.key === 'Delete' && this.selectedElement) {
                this.deleteElement();
            } else if (e.key === 'Escape') {
                this.cancelOperation();
            }
        });

        console.log('✅ Event listeners configurados');
    }

    // ==================== SELECCIÓN DE HERRAMIENTAS ====================

    selectTool(tool) {
        this.selectedTool = tool;

        // Resetear estados
        if (this.firstElementSelected) {
            this.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
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
            this.handleRelationshipClick(elementView.model);
        }
    }

    onBlankClick(evt) {
        if (this.selectedTool === 'class') {
            var point = this.paper.clientToLocalPoint(evt.clientX, evt.clientY);
            this.createClass(point.x, point.y);
        } else if (this.selectedTool === 'interface') {
            var point = this.paper.clientToLocalPoint(evt.clientX, evt.clientY);
            this.createInterface(point.x, point.y);
        }

        // Deseleccionar elemento
        this.selectElement(null);
    }

    onElementDoubleClick(elementView, evt) {
        // Editar clase/interface
        if (elementView.model.get('type') === 'standard.Rectangle') {
            this.editClass(elementView.model);
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
        this.editRelationship(linkView.model);
    }

    // ==================== CREACIÓN DE ELEMENTOS ====================

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

        // Procesar líneas
        var attrLines = attributes ?
            attributes.split('\n').filter(line => line.trim()) : [];
        var methodLines = methods ?
            methods.split('\n').filter(line => line.trim()) : [];

        // Construir el texto completo de la clase
        var classText = className;
        if (attrLines.length > 0) {
            classText += '\n\n' + attrLines.join('\n');
        }
        if (methodLines.length > 0) {
            classText += '\n\n' + methodLines.join('\n');
        }

        // USAR LA FORMA CORRECTA DE CREAR ELEMENTOS JOINTJS
        var classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - 110, y: y - 60 },
            size: {
                width: 220,
                height: Math.max(120, 40 + (attrLines.length + methodLines.length) * 15)
            },
            attrs: {
                body: {
                    stroke: '#2563eb',
                    fill: '#f8fafc',
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
                methods: methodLines,
                type: 'class'
            }
        });

        this.graph.addCell(classElement);
        this.updateCanvasInfo();

        // Volver a select
        this.selectTool('select');

        console.log('✅ Clase creada:', className, 'con', attrLines.length, 'atributos y', methodLines.length, 'métodos');
    }

    createInterface(x, y) {
        var interfaceName = prompt('Nombre de la interfaz:', 'IInterfaz');
        if (!interfaceName) return;

        var methods = prompt(
            'Métodos (uno por línea, solo declaraciones)\nEjemplo: + metodo(): tipo',
            '+ ' + interfaceName.toLowerCase().replace('i', '') + '(): void'
        );

        var methodLines = methods ?
            methods.split('\n').filter(line => line.trim()) : [];

        var interfaceText = '<<interface>>\n' + interfaceName;
        if (methodLines.length > 0) {
            interfaceText += '\n\n' + methodLines.join('\n');
        }

        var interfaceElement = new joint.shapes.standard.Rectangle({
            position: { x: x - 110, y: y - 60 },
            size: {
                width: 220,
                height: Math.max(120, 60 + methodLines.length * 15)
            },
            attrs: {
                body: {
                    stroke: '#7c3aed',
                    fill: '#faf5ff',
                    strokeWidth: 2,
                    strokeDasharray: '5,5',
                    rx: 3,
                    ry: 3
                },
                label: {
                    text: interfaceText,
                    fontSize: 11,
                    fontFamily: 'Consolas, monospace',
                    fill: '#7c3aed',
                    textVerticalAnchor: 'top',
                    textAnchor: 'start',
                    x: 10,
                    y: 10
                }
            },
            umlData: {
                className: interfaceName,
                attributes: [],
                methods: methodLines,
                type: 'interface'
            }
        });

        this.graph.addCell(interfaceElement);
        this.updateCanvasInfo();
        this.selectTool('select');

        console.log('✅ Interfaz creada:', interfaceName);
    }

    // ==================== CREACIÓN DE RELACIONES ====================

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
            this.selectTool('select');
        }
    }

    createRelationship(source, target) {
        var link;

        switch(this.selectedTool) {
            case 'association':
                // Prompts para multiplicidad y nombre
                var sourceMultiplicity = prompt('Multiplicidad origen (1, 0..1, 1..*, *):', '1');
                if (sourceMultiplicity === null) return;

                var targetMultiplicity = prompt('Multiplicidad destino (1, 0..1, 1..*, *):', '1..*');
                if (targetMultiplicity === null) return;

                var relationName = prompt('Nombre de la relación (opcional):', 'posee');

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#2563eb',
                            strokeWidth: 2
                        }
                    },
                    labels: this.createRelationLabels(sourceMultiplicity, targetMultiplicity, relationName),
                    relationData: {
                        type: 'association',
                        sourceMultiplicity: sourceMultiplicity,
                        targetMultiplicity: targetMultiplicity,
                        name: relationName
                    }
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
                                stroke: '#2563eb',
                                strokeWidth: 2
                            }
                        }
                    },
                    relationData: { type: 'inheritance' }
                });
                break;

            case 'aggregation':
                var sourceMultiplicity = prompt('Multiplicidad origen (1, 0..1, 1..*, *):', '1');
                if (sourceMultiplicity === null) return;
                var targetMultiplicity = prompt('Multiplicidad destino (1, 0..1, 1..*, *):', '*');
                if (targetMultiplicity === null) return;
                var relationName = prompt('Nombre de la relación (opcional):', 'tiene');

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
                    labels: this.createRelationLabels(sourceMultiplicity, targetMultiplicity, relationName),
                    relationData: {
                        type: 'aggregation',
                        sourceMultiplicity: sourceMultiplicity,
                        targetMultiplicity: targetMultiplicity,
                        name: relationName
                    }
                });
                break;

            case 'composition':
                var sourceMultiplicity = prompt('Multiplicidad origen (1, 0..1, 1..*, *):', '1');
                if (sourceMultiplicity === null) return;
                var targetMultiplicity = prompt('Multiplicidad destino (1, 0..1, 1..*, *):', '*');
                if (targetMultiplicity === null) return;
                var relationName = prompt('Nombre de la relación (opcional):', 'contiene');

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
                    labels: this.createRelationLabels(sourceMultiplicity, targetMultiplicity, relationName),
                    relationData: {
                        type: 'composition',
                        sourceMultiplicity: sourceMultiplicity,
                        targetMultiplicity: targetMultiplicity,
                        name: relationName
                    }
                });
                break;

            default:
                console.error('Tipo de relación no soportado:', this.selectedTool);
                return;
        }

        this.graph.addCell(link);
        this.updateCanvasInfo();

        console.log('✅ Relación', this.selectedTool, 'creada');
    }

    createRelationLabels(sourceMultiplicity, targetMultiplicity, name) {
        var labels = [];

        // Multiplicidad origen
        if (sourceMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: sourceMultiplicity,
                        fill: '#2563eb',
                        fontSize: 12,
                        fontWeight: 'bold'
                    }
                },
                position: { distance: 0.1, offset: 15 }
            });
        }

        // Multiplicidad destino
        if (targetMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: targetMultiplicity,
                        fill: '#2563eb',
                        fontSize: 12,
                        fontWeight: 'bold'
                    }
                },
                position: { distance: 0.9, offset: 15 }
            });
        }

        // Nombre de la relación
        if (name && name.trim()) {
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

        return labels;
    }

    // ==================== EDICIÓN DE ELEMENTOS ====================

    editClass(element) {
        var umlData = element.get('umlData') || {};
        var currentName = umlData.className || 'Clase';
        var currentAttrs = umlData.attributes || [];
        var currentMethods = umlData.methods || [];

        var newName = prompt('Nombre de la clase:', currentName);
        if (!newName) return;

        var newAttrs = prompt(
            'Atributos (uno por línea):',
            currentAttrs.join('\n')
        );

        var newMethods = prompt(
            'Métodos (uno por línea):',
            currentMethods.join('\n')
        );

        // Procesar líneas
        var attrLines = newAttrs ?
            newAttrs.split('\n').filter(line => line.trim()) : [];
        var methodLines = newMethods ?
            newMethods.split('\n').filter(line => line.trim()) : [];

        // Actualizar elemento
        var newText = newName;
        if (attrLines.length > 0) {
            newText += '\n\n' + attrLines.join('\n');
        }
        if (methodLines.length > 0) {
            newText += '\n\n' + methodLines.join('\n');
        }

        // Actualizar altura según contenido
        var newHeight = Math.max(120, 40 + (attrLines.length + methodLines.length) * 15);

        element.attr('label/text', newText);
        element.resize(220, newHeight);

        // Actualizar datos UML
        element.set('umlData', {
            className: newName,
            attributes: attrLines,
            methods: methodLines,
            type: umlData.type || 'class'
        });

        console.log('✅ Clase editada:', newName);
    }

    editRelationship(link) {
        var relationData = link.get('relationData') || {};
        var currentSource = relationData.sourceMultiplicity || '1';
        var currentTarget = relationData.targetMultiplicity || '*';
        var currentName = relationData.name || '';

        if (relationData.type === 'inheritance') {
            alert('Las relaciones de herencia no tienen multiplicidad editable');
            return;
        }

        var newSource = prompt('Multiplicidad origen:', currentSource);
        if (newSource === null) return;

        var newTarget = prompt('Multiplicidad destino:', currentTarget);
        if (newTarget === null) return;

        var newName = prompt('Nombre de la relación:', currentName);
        if (newName === null) return;

        // Actualizar labels
        var newLabels = this.createRelationLabels(newSource, newTarget, newName);
        link.set('labels', newLabels);

        // Actualizar datos
        relationData.sourceMultiplicity = newSource;
        relationData.targetMultiplicity = newTarget;
        relationData.name = newName;
        link.set('relationData', relationData);

        console.log('✅ Relación editada');
    }

    // ==================== SELECCIÓN Y ELIMINACIÓN ====================

    selectElement(element) {
        // Remover selección anterior
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement, false);
        }

        this.selectedElement = element;

        if (element) {
            this.highlightElement(element, true);
            console.log('Elemento seleccionado:', element.get('type'));
        }
    }

    highlightElement(element, highlight, color = '#4f46e5') {
        if (element.isLink && element.isLink()) {
            // Resaltar enlaces
            element.attr('line/strokeWidth', highlight ? 3 : 2);
            element.attr('line/stroke', highlight ? color : '#2563eb');
        } else {
            // Resaltar elementos
            element.attr('body/strokeWidth', highlight ? 3 : 2);
            element.attr('body/stroke', highlight ? color : '#2563eb');
        }
    }

    deleteElement() {
        if (this.selectedElement) {
            this.selectedElement.remove();
            this.selectedElement = null;
            this.updateCanvasInfo();
            console.log('Elemento eliminado');
        }
    }

    cancelOperation() {
        if (this.firstElementSelected) {
            this.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
        }
        this.selectTool('select');
    }

    // ==================== ZOOM Y NAVEGACIÓN ====================

    zoomIn() {
        this.currentZoom = Math.min(this.currentZoom * 1.2, 3);
        this.paper.scale(this.currentZoom);
        this.updateCanvasInfo();
    }

    zoomOut() {
        this.currentZoom = Math.max(this.currentZoom / 1.2, 0.3);
        this.paper.scale(this.currentZoom);
        this.updateCanvasInfo();
    }

    zoomToFit() {
        this.paper.scaleContentToFit({ padding: 20 });
        this.currentZoom = this.paper.scale().sx;
        this.updateCanvasInfo();
    }

    // ==================== INFORMACIÓN DEL CANVAS ====================

    updateCanvasInfo() {
        var elements = this.graph.getElements();
        var links = this.graph.getLinks();
        var zoom = Math.round(this.currentZoom * 100);

        var info = `📦 ${elements.length} clases | 🔗 ${links.length} relaciones | 🔍 ${zoom}%`;

        var infoElement = document.getElementById('canvas-info');
        if (infoElement) {
            infoElement.textContent = info;
        }
    }

    // ==================== GUARDADO Y CARGA ====================

    saveDiagram() {
        try {
            var jsonData = JSON.stringify(this.graph.toJSON());

            // Obtener título si no existe
            var title = window.currentDiagramTitle;
            if (!title) {
                title = prompt('Título del diagrama:', 'Mi Diagrama UML');
                if (!title) return;
                window.currentDiagramTitle = title;
            }

            // Llamar a Livewire para guardar
            if (window.Livewire) {
                console.log('💾 Guardando diagrama:', title);
                window.Livewire.dispatch('save-diagram', {
                    diagramData: jsonData,
                    title: title
                });
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
                    // Limpiar graph antes de cargar
                    this.graph.clear();

                    // RECREAR ELEMENTOS EN LUGAR DE USAR fromJSON()
                    this.recreateElementsFromData(data.cells);
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
                // Limpiar datos corruptos
                this.graph.clear();
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

    // ==================== RECREACIÓN DE ELEMENTOS ====================

    recreateElementsFromData(cells) {
        var elements = [];
        var links = [];

        // Separar elementos y enlaces
        cells.forEach(cell => {
            if (cell.type === 'standard.Rectangle') {
                elements.push(cell);
            } else if (cell.type === 'standard.Link') {
                links.push(cell);
            }
        });

        console.log('🔄 Recreando', elements.length, 'elementos y', links.length, 'enlaces');

        // Recrear elementos primero
        elements.forEach(elementData => {
            this.recreateElement(elementData);
        });

        // Recrear enlaces después (necesitan que los elementos ya existan)
        links.forEach(linkData => {
            this.recreateLink(linkData);
        });
    }

    recreateElement(elementData) {
        try {
            var umlData = elementData.umlData || {};
            var position = elementData.position || { x: 100, y: 100 };
            var size = elementData.size || { width: 220, height: 120 };
            var attrs = elementData.attrs || {};

            // Recrear elemento con markup correcto
            var newElement = new joint.shapes.standard.Rectangle({
                id: elementData.id, // Mantener el ID original
                position: position,
                size: size,
                attrs: {
                    body: attrs.body || {
                        stroke: '#2563eb',
                        fill: '#f8fafc',
                        strokeWidth: 2,
                        rx: 3,
                        ry: 3
                    },
                    label: attrs.label || {
                        text: this.buildClassText(umlData),
                        fontSize: 11,
                        fontFamily: 'Consolas, monospace',
                        fill: '#1e40af',
                        textVerticalAnchor: 'top',
                        textAnchor: 'start',
                        x: 10,
                        y: 10
                    }
                },
                umlData: umlData
            });

            this.graph.addCell(newElement);
            console.log('✅ Elemento recreado:', umlData.className || 'Sin nombre');

        } catch (e) {
            console.error('❌ Error recreando elemento:', e, elementData);
        }
    }

    recreateLink(linkData) {
        try {
            var relationData = linkData.relationData || {};
            var source = linkData.source || {};
            var target = linkData.target || {};
            var attrs = linkData.attrs || {};
            var labels = linkData.labels || [];

            // Verificar que los elementos fuente y destino existen
            var sourceElement = this.graph.getCell(source.id);
            var targetElement = this.graph.getCell(target.id);

            if (!sourceElement || !targetElement) {
                console.warn('⚠️ No se pudo recrear enlace: elementos fuente/destino no encontrados');
                return;
            }

            // Recrear enlace con markup correcto
            var newLink = new joint.shapes.standard.Link({
                id: linkData.id, // Mantener el ID original
                source: source,
                target: target,
                attrs: attrs,
                labels: labels,
                relationData: relationData
            });

            this.graph.addCell(newLink);
            console.log('✅ Enlace recreado:', relationData.type || 'Sin tipo');

        } catch (e) {
            console.error('❌ Error recreando enlace:', e, linkData);
        }
    }

    buildClassText(umlData) {
        if (!umlData || !umlData.className) {
            return 'Clase Sin Nombre';
        }

        var text = umlData.className;

        // Agregar estereotipo para interfaces
        if (umlData.type === 'interface') {
            text = '<<interface>>\n' + text;
        }

        // Agregar atributos
        if (umlData.attributes && umlData.attributes.length > 0) {
            text += '\n\n' + umlData.attributes.join('\n');
        }

        // Agregar métodos
        if (umlData.methods && umlData.methods.length > 0) {
            text += '\n\n' + umlData.methods.join('\n');
        }

        return text;
    }

    // ==================== UTILIDADES ====================

    clearDiagram() {
        this.graph.clear();
        this.selectedElement = null;
        this.firstElementSelected = null;
        this.updateCanvasInfo();
        console.log('🧹 Diagrama limpiado');
    }

    exportToPNG() {
        // Esta funcionalidad se puede implementar más tarde
        console.log('📸 Export a PNG no implementado aún');
        alert('Export a PNG será implementado en próxima versión');
    }

    getState() {
        return {
            selectedTool: this.selectedTool,
            elementCount: this.graph.getElements().length,
            linkCount: this.graph.getLinks().length,
            zoom: this.currentZoom,
            relationshipMode: this.relationshipMode,
            hasSelection: !!this.selectedElement
        };
    }
}

// Hacer disponible globalmente
window.UMLDiagramEditor = UMLDiagramEditor;

export { UMLDiagramEditor };
