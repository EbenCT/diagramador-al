// resources/js/diagram/editor.js - UML 2.5 UX MEJORADA
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

        this.init();
    }

    init() {
        this.createPaper();
        this.setupEventListeners();
        this.setupZoomButtons();
        this.setupPanNavigation();
        this.loadDiagramData();

        console.log('✅ UMLDiagramEditor inicializado correctamente');
    }

    // ==================== CONFIGURACIÓN DE BOTONES DE ZOOM ====================

    setupZoomButtons() {
        // Buscar botones de zoom
        var zoomInBtn = document.getElementById('zoom-in');
        var zoomOutBtn = document.getElementById('zoom-out');
        var zoomFitBtn = document.getElementById('zoom-fit');
        var zoom100Btn = document.getElementById('zoom-100');

        // Configurar eventos
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomIn();
            });
            console.log('✅ Botón Zoom In configurado');
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomOut();
            });
            console.log('✅ Botón Zoom Out configurado');
        }

        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', () => {
                this.zoomToFit();
            });
            console.log('✅ Botón Zoom Fit configurado');
        }

        if (zoom100Btn) {
            zoom100Btn.addEventListener('click', () => {
                this.setZoom(1);
            });
            console.log('✅ Botón Zoom 100% configurado');
        }

        // También buscar por clases CSS alternativas
        document.querySelectorAll('.zoom-in-btn').forEach(btn => {
            btn.addEventListener('click', () => this.zoomIn());
        });

        document.querySelectorAll('.zoom-out-btn').forEach(btn => {
            btn.addEventListener('click', () => this.zoomOut());
        });

        document.querySelectorAll('.zoom-fit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.zoomToFit());
        });

        console.log('✅ Botones de zoom configurados');
    }

    // ==================== NAVEGACIÓN PAN CON MOUSE ====================

    setupPanNavigation() {
        var paperEl = this.paper.el;
        var isDragging = false;
        var dragStartPoint = null;
        var dragStartTranslate = null;

        // Variables para rastrear el estado del paper
        var currentTranslate = { x: 0, y: 0 };

        paperEl.addEventListener('mousedown', (e) => {
            // Solo iniciar pan si no hay elemento seleccionado y es click del botón izquierdo
            if (e.button !== 0) return; // Solo botón izquierdo

            var target = e.target;
            var isElement = target.closest('.joint-element') || target.closest('.joint-link');

            // Si clicked en elemento, no hacer pan
            if (isElement) return;

            // Si herramienta de creación está activa, no hacer pan
            if (this.selectedTool !== 'select') return;

            isDragging = true;
            dragStartPoint = { x: e.clientX, y: e.clientY };

            // Obtener transformación actual
            var currentTransform = this.paper.matrix();
            dragStartTranslate = {
                x: currentTransform.e || 0,
                y: currentTransform.f || 0
            };

            paperEl.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            var dx = e.clientX - dragStartPoint.x;
            var dy = e.clientY - dragStartPoint.y;

            // Calcular nueva posición
            var newX = dragStartTranslate.x + dx;
            var newY = dragStartTranslate.y + dy;

            // Aplicar traslación
            this.paper.translate(newX, newY);

            e.preventDefault();
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                dragStartPoint = null;
                dragStartTranslate = null;
                paperEl.style.cursor = this.selectedTool === 'select' ? 'default' : 'crosshair';
            }
        });

        // Cambiar cursor cuando hover sobre canvas vacío
        paperEl.addEventListener('mousemove', (e) => {
            if (isDragging) return;

            var target = e.target;
            var isElement = target.closest('.joint-element') || target.closest('.joint-link');

            if (this.selectedTool === 'select' && !isElement) {
                paperEl.style.cursor = 'grab';
            } else if (this.selectedTool !== 'select') {
                paperEl.style.cursor = 'crosshair';
            } else {
                paperEl.style.cursor = 'default';
            }
        });

        paperEl.addEventListener('mouseleave', () => {
            paperEl.style.cursor = 'default';
        });

        console.log('✅ Navegación pan configurada');
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
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjAuNSIgZmlsbD0iI2Q2ZDNkMSIvPgo8L3N2Zz4K'
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
        this.setupMouseWheelZoom();

        console.log('✅ Paper creado correctamente con pan support');
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
            // Shortcuts de zoom
            else if (e.ctrlKey && e.key === '+') {
                e.preventDefault();
                this.zoomIn();
            } else if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            } else if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                this.setZoom(1); // Reset a 100%
            } else if (e.ctrlKey && e.key === '9') {
                e.preventDefault();
                this.zoomToFit();
            }
            // Shortcuts de navegación
            else if (e.key === 'Home') {
                e.preventDefault();
                this.centerView();
            } else if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.resetViewport();
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
            this.createClassImproved(point.x, point.y);
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
            this.editClassImproved(elementView.model);
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

    // ==================== CREACIÓN MEJORADA DE CLASES ====================

    createClassImproved(x, y) {
        // Paso 1: Nombre de la clase
        var className = prompt('📦 Nombre de la clase:', 'Usuario');
        if (!className) return;

        // Paso 2: Atributos mejorados
        var attributesHelp = `📝 Atributos (uno por línea):

Formato: visibilidad nombre: tipo
Ejemplos:
  - id: int
  + email: String
  # password: String
  ~ status: boolean

Visibilidad:
  + público    - privado    # protegido    ~ paquete

Tipos comunes: ${this.umlTemplates.commonTypes.slice(0, 5).join(', ')}...`;

        var defaultAttrs = `- id: Long
- ${className.toLowerCase()}Name: String
- createdAt: LocalDateTime`;

        var attributesInput = prompt(attributesHelp, defaultAttrs);
        var attributes = attributesInput ?
            attributesInput.split('\n').map(line => line.trim()).filter(line => line) : [];

        // Paso 3: Métodos (OPCIONAL)
        var addMethods = confirm(`¿Agregar métodos a la clase "${className}"?\n\n(Los métodos son opcionales - puedes omitirlos)`);
        var methods = [];

        if (addMethods) {
            var methodsHelp = `🔧 Métodos (uno por línea):

Formato: visibilidad nombre(parámetros): tipoRetorno
Ejemplos:
  + getId(): Long
  + getName(): String
  + setName(name: String): void
  + isActive(): boolean`;

            var defaultMethods = `+ getId(): Long
+ get${className}Name(): String
+ set${className}Name(name: String): void`;

            var methodsInput = prompt(methodsHelp, defaultMethods);
            methods = methodsInput ?
                methodsInput.split('\n').map(line => line.trim()).filter(line => line) : [];
        }

        // Crear clase con estilo UML 2.5 mejorado
        this.createClassElement(className, attributes, methods, x, y, 'class');
    }

    createInterface(x, y) {
        var interfaceName = prompt('🔌 Nombre de la interfaz:', 'IUsuario');
        if (!interfaceName) return;

        var methodsHelp = `🔧 Métodos de la interfaz (uno por línea):

Las interfaces solo tienen métodos públicos abstractos:
  + metodo(): tipoRetorno
  + validar(): boolean
  + procesar(datos: String): void`;

        var defaultMethods = `+ ${interfaceName.replace('I', '').toLowerCase()}(): void
+ validar(): boolean`;

        var methodsInput = prompt(methodsHelp, defaultMethods);
        var methods = methodsInput ?
            methodsInput.split('\n').map(line => line.trim()).filter(line => line) : [];

        // Crear interfaz
        this.createClassElement(interfaceName, [], methods, x, y, 'interface');
    }

    createClassElement(className, attributes, methods, x, y, type) {
        // Construir el texto UML 2.5
        var classText = '';

        // Agregar estereotipo para interfaces
        if (type === 'interface') {
            classText = '<<interface>>\n';
        }

        classText += className;

        // Separador de nombre (línea horizontal implícita)
        if (attributes.length > 0) {
            classText += '\n' + '─'.repeat(Math.max(className.length, 20)) + '\n';
            classText += attributes.join('\n');
        }

        // Separador de atributos/métodos
        if (methods.length > 0) {
            if (attributes.length > 0) {
                classText += '\n' + '─'.repeat(Math.max(className.length, 20)) + '\n';
            } else {
                classText += '\n' + '─'.repeat(Math.max(className.length, 20)) + '\n';
            }
            classText += methods.join('\n');
        }

        // Calcular dimensiones dinámicas
        var maxLineLength = Math.max(
            className.length,
            ...attributes.map(attr => attr.length),
            ...methods.map(method => method.length)
        );

        var width = Math.max(200, Math.min(400, maxLineLength * 8 + 40));
        var height = Math.max(80, 30 + (attributes.length + methods.length + 2) * 16);

        // Colores según tipo
        var colors = type === 'interface' ? {
            fill: '#faf5ff',
            stroke: '#7c3aed',
            textColor: '#7c3aed',
            strokeDasharray: '8,4'
        } : {
            fill: '#fefefe',
            stroke: '#1e40af',
            textColor: '#1e40af',
            strokeDasharray: 'none'
        };

        // Crear elemento con estilo UML 2.5 profesional
        var classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - width/2, y: y - height/2 },
            size: { width: width, height: height },
            attrs: {
                body: {
                    stroke: colors.stroke,
                    fill: colors.fill,
                    strokeWidth: 2,
                    strokeDasharray: colors.strokeDasharray,
                    rx: 4,
                    ry: 4,
                    filter: {
                        name: 'dropShadow',
                        args: {
                            dx: 2,
                            dy: 2,
                            blur: 3,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                label: {
                    text: classText,
                    fontSize: 12,
                    fontFamily: '"Fira Code", "Consolas", monospace',
                    fill: colors.textColor,
                    textVerticalAnchor: 'top',
                    textAnchor: 'start',
                    x: 12,
                    y: 12,
                    lineHeight: 1.3
                }
            },
            umlData: {
                className: className,
                attributes: attributes,
                methods: methods,
                type: type
            }
        });

        this.graph.addCell(classElement);
        this.updateCanvasInfo();
        this.selectTool('select');

        console.log(`✅ ${type} creada:`, className, 'con', attributes.length, 'atributos y', methods.length, 'métodos');
    }

    // ==================== EDICIÓN MEJORADA DE CLASES ====================

    editClassImproved(element) {
        var umlData = element.get('umlData') || {};
        var currentName = umlData.className || 'Clase';
        var currentAttrs = umlData.attributes || [];
        var currentMethods = umlData.methods || [];
        var currentType = umlData.type || 'class';

        // Paso 1: Editar nombre
        var newName = prompt(`📝 Nombre de la ${currentType}:`, currentName);
        if (newName === null) return;

        // Paso 2: Editar atributos
        var attributesHelp = `📝 Atributos (uno por línea):

Formato actual:
${currentAttrs.map(attr => `  ${attr}`).join('\n') || '  (sin atributos)'}

Visibilidad: + público  - privado  # protegido  ~ paquete
Tipos: ${this.umlTemplates.commonTypes.slice(0, 4).join(', ')}...`;

        var newAttrsInput = prompt(attributesHelp, currentAttrs.join('\n'));
        if (newAttrsInput === null) return;

        var newAttrs = newAttrsInput ?
            newAttrsInput.split('\n').map(line => line.trim()).filter(line => line) : [];

        // Paso 3: Editar métodos (solo si no es interfaz o si ya tenía métodos)
        var newMethods = currentMethods;

        if (currentType === 'interface' || currentMethods.length > 0 ||
            confirm('¿Agregar/editar métodos?')) {

            var methodsHelp = `🔧 Métodos (uno por línea):

Métodos actuales:
${currentMethods.map(method => `  ${method}`).join('\n') || '  (sin métodos)'}

Formato: + nombre(parámetros): tipoRetorno`;

            var newMethodsInput = prompt(methodsHelp, currentMethods.join('\n'));
            if (newMethodsInput !== null) {
                newMethods = newMethodsInput ?
                    newMethodsInput.split('\n').map(line => line.trim()).filter(line => line) : [];
            }
        }

        // Actualizar elemento
        this.updateClassElement(element, newName, newAttrs, newMethods, currentType);

        console.log('✅ Clase editada:', newName);
    }

    updateClassElement(element, className, attributes, methods, type) {
        // Reconstruir texto
        var classText = '';

        if (type === 'interface') {
            classText = '<<interface>>\n';
        }

        classText += className;

        if (attributes.length > 0) {
            classText += '\n' + '─'.repeat(Math.max(className.length, 20)) + '\n';
            classText += attributes.join('\n');
        }

        if (methods.length > 0) {
            if (attributes.length > 0) {
                classText += '\n' + '─'.repeat(Math.max(className.length, 20)) + '\n';
            } else {
                classText += '\n' + '─'.repeat(Math.max(className.length, 20)) + '\n';
            }
            classText += methods.join('\n');
        }

        // Calcular nuevas dimensiones
        var maxLineLength = Math.max(
            className.length,
            ...attributes.map(attr => attr.length),
            ...methods.map(method => method.length)
        );

        var newWidth = Math.max(200, Math.min(400, maxLineLength * 8 + 40));
        var newHeight = Math.max(80, 30 + (attributes.length + methods.length + 2) * 16);

        // Actualizar elemento
        element.attr('label/text', classText);
        element.resize(newWidth, newHeight);

        // Actualizar datos UML
        element.set('umlData', {
            className: className,
            attributes: attributes,
            methods: methods,
            type: type
        });
    }

    // ==================== CREACIÓN MEJORADA DE RELACIONES ====================

    handleRelationshipClick(element) {
        if (!this.firstElementSelected) {
            this.firstElementSelected = element;
            this.highlightElement(element, true, '#f59e0b');

            // Mostrar ayuda visual
            this.showRelationshipHelp(this.selectedTool);
            console.log('Primera clase seleccionada para', this.selectedTool);
        } else {
            if (this.firstElementSelected.id !== element.id) {
                this.createRelationshipImproved(this.firstElementSelected, element);
            }

            this.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
            this.hideRelationshipHelp();
            this.selectTool('select');
        }
    }

    showRelationshipHelp(toolType) {
        var helpText = {
            'association': '↔️ Asociación: Relación general entre clases',
            'aggregation': '◇ Agregación: "Tiene un" (composición débil)',
            'composition': '◆ Composición: "Parte de" (composición fuerte)',
            'inheritance': '△ Herencia: "Es un" (especialización)'
        };

        // Crear tooltip temporal
        var tooltip = document.createElement('div');
        tooltip.id = 'relationship-tooltip';
        tooltip.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        tooltip.textContent = helpText[toolType] + ' - Selecciona la segunda clase';
        document.body.appendChild(tooltip);
    }

    hideRelationshipHelp() {
        var tooltip = document.getElementById('relationship-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    createRelationshipImproved(source, target) {
        var link;

        switch(this.selectedTool) {
            case 'association':
                var result = this.promptForAssociation();
                if (!result) return;

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            targetMarker: {
                                type: 'path',
                                d: 'M 10 -3 0 0 10 3',
                                stroke: '#1e40af',
                                fill: 'none',
                                strokeWidth: 1
                            }
                        }
                    },
                    labels: this.createRelationLabelsImproved(
                        result.sourceMultiplicity,
                        result.targetMultiplicity,
                        result.name
                    ),
                    relationData: {
                        type: 'association',
                        sourceMultiplicity: result.sourceMultiplicity,
                        targetMultiplicity: result.targetMultiplicity,
                        name: result.name
                    }
                });
                break;

            case 'inheritance':
                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            targetMarker: {
                                type: 'path',
                                d: 'M 12 -6 0 0 12 6 z',
                                fill: 'white',
                                stroke: '#1e40af',
                                strokeWidth: 2
                            }
                        }
                    },
                    relationData: { type: 'inheritance' }
                });
                break;

            case 'aggregation':
                var result = this.promptForAssociation();
                if (!result) return;

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            sourceMarker: {
                                type: 'path',
                                d: 'M 16 -6 8 0 16 6 24 0 z',
                                fill: 'white',
                                stroke: '#1e40af',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: this.createRelationLabelsImproved(
                        result.sourceMultiplicity,
                        result.targetMultiplicity,
                        result.name
                    ),
                    relationData: {
                        type: 'aggregation',
                        sourceMultiplicity: result.sourceMultiplicity,
                        targetMultiplicity: result.targetMultiplicity,
                        name: result.name
                    }
                });
                break;

            case 'composition':
                var result = this.promptForAssociation();
                if (!result) return;

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            sourceMarker: {
                                type: 'path',
                                d: 'M 16 -6 8 0 16 6 24 0 z',
                                fill: '#1e40af',
                                stroke: '#1e40af',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: this.createRelationLabelsImproved(
                        result.sourceMultiplicity,
                        result.targetMultiplicity,
                        result.name
                    ),
                    relationData: {
                        type: 'composition',
                        sourceMultiplicity: result.sourceMultiplicity,
                        targetMultiplicity: result.targetMultiplicity,
                        name: result.name
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

    promptForAssociation() {
        var sourceMultiplicity = prompt(
            '📊 Multiplicidad origen:\n\n1 = uno\n0..1 = cero o uno\n1..* = uno o más\n* = muchos\n0..* = cero o más',
            '1'
        );
        if (sourceMultiplicity === null) return null;

        var targetMultiplicity = prompt(
            '📊 Multiplicidad destino:\n\n1 = uno\n0..1 = cero o uno\n1..* = uno o más\n* = muchos\n0..* = cero o más',
            '*'
        );
        if (targetMultiplicity === null) return null;

        var name = prompt('🏷️ Nombre de la relación (opcional):', '');

        return {
            sourceMultiplicity: sourceMultiplicity.trim(),
            targetMultiplicity: targetMultiplicity.trim(),
            name: name ? name.trim() : ''
        };
    }

    createRelationLabelsImproved(sourceMultiplicity, targetMultiplicity, name) {
        var labels = [];

        // Multiplicidad origen con mejor estilo
        if (sourceMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: sourceMultiplicity,
                        fill: '#1e40af',
                        fontSize: 11,
                        fontWeight: 'bold',
                        fontFamily: '"Fira Code", "Consolas", monospace'
                    },
                    rect: {
                        fill: 'white',
                        stroke: '#1e40af',
                        strokeWidth: 1,
                        rx: 2,
                        ry: 2
                    }
                },
                position: { distance: 0.15, offset: 15 }
            });
        }

        // Multiplicidad destino
        if (targetMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: targetMultiplicity,
                        fill: '#1e40af',
                        fontSize: 11,
                        fontWeight: 'bold',
                        fontFamily: '"Fira Code", "Consolas", monospace'
                    },
                    rect: {
                        fill: 'white',
                        stroke: '#1e40af',
                        strokeWidth: 1,
                        rx: 2,
                        ry: 2
                    }
                },
                position: { distance: 0.85, offset: 15 }
            });
        }

        // Nombre de la relación con mejor estilo
        if (name && name.trim()) {
            labels.push({
                attrs: {
                    text: {
                        text: name,
                        fill: '#374151',
                        fontSize: 10,
                        fontStyle: 'italic',
                        fontWeight: 'bold',
                        fontFamily: '"Inter", sans-serif'
                    },
                    rect: {
                        fill: 'rgba(255,255,255,0.9)',
                        stroke: '#d1d5db',
                        strokeWidth: 1,
                        rx: 4,
                        ry: 2
                    }
                },
                position: { distance: 0.5, offset: -15 }
            });
        }

        return labels;
    }

    // ==================== EDICIÓN DE RELACIONES MEJORADA ====================

    editRelationship(link) {
        var relationData = link.get('relationData') || {};

        if (relationData.type === 'inheritance') {
            alert('ℹ️ Las relaciones de herencia no tienen multiplicidad editable');
            return;
        }

        var currentSource = relationData.sourceMultiplicity || '1';
        var currentTarget = relationData.targetMultiplicity || '*';
        var currentName = relationData.name || '';

        // Editar multiplicidades
        var newSource = prompt(
            `📊 Multiplicidad origen (actual: ${currentSource}):\n\n1, 0..1, 1..*, *, 0..*`,
            currentSource
        );
        if (newSource === null) return;

        var newTarget = prompt(
            `📊 Multiplicidad destino (actual: ${currentTarget}):\n\n1, 0..1, 1..*, *, 0..*`,
            currentTarget
        );
        if (newTarget === null) return;

        var newName = prompt(
            `🏷️ Nombre de la relación (actual: "${currentName}"):`,
            currentName
        );
        if (newName === null) return;

        // Actualizar labels
        var newLabels = this.createRelationLabelsImproved(
            newSource.trim(),
            newTarget.trim(),
            newName.trim()
        );
        link.set('labels', newLabels);

        // Actualizar datos
        relationData.sourceMultiplicity = newSource.trim();
        relationData.targetMultiplicity = newTarget.trim();
        relationData.name = newName.trim();
        link.set('relationData', relationData);

        console.log('✅ Relación editada');
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

            if (highlight) {
                // Agregar efecto de selección animado
                element.attr('body/strokeDasharray', '8,4');
                element.attr('body/strokeDashoffset', 0);

                // Animar el borde
                var animate = () => {
                    var offset = parseFloat(element.attr('body/strokeDashoffset') || 0);
                    element.attr('body/strokeDashoffset', offset - 1);
                    if (this.selectedElement === element) {
                        setTimeout(animate, 100);
                    }
                };
                animate();
            } else {
                element.attr('body/strokeDasharray', 'none');
            }
        }
    }

    deleteElement() {
        if (this.selectedElement) {
            this.selectedElement.remove();
            this.selectedElement = null;
            this.updateCanvasInfo();
            console.log('🗑️ Elemento eliminado');
        }
    }

    cancelOperation() {
        if (this.firstElementSelected) {
            this.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
        }
        this.hideRelationshipHelp();
        this.selectTool('select');
    }

    // ==================== ZOOM Y NAVEGACIÓN CORREGIDO ====================

    zoomIn() {
        this.currentZoom = Math.min(this.currentZoom * 1.2, 3);
        this.paper.scale(this.currentZoom, this.currentZoom);
        console.log('🔍 Zoom In:', Math.round(this.currentZoom * 100) + '%');
        this.updateCanvasInfo();
    }

    zoomOut() {
        this.currentZoom = Math.max(this.currentZoom / 1.2, 0.3);
        this.paper.scale(this.currentZoom, this.currentZoom);
        console.log('🔍 Zoom Out:', Math.round(this.currentZoom * 100) + '%');
        this.updateCanvasInfo();
    }

    zoomToFit() {
        try {
            // Obtener elementos para calcular el área ocupada
            var elements = this.graph.getElements();
            var links = this.graph.getLinks();

            if (elements.length === 0 && links.length === 0) {
                // Si no hay elementos, resetear zoom y centrar
                this.currentZoom = 1;
                this.paper.scale(1, 1);
                this.paper.translate(0, 0);
                console.log('🔍 Zoom Reset: 100% (sin elementos)');
                this.updateCanvasInfo();
                return;
            }

            // Usar el método nativo de JointJS con configuración mejorada
            this.paper.scaleContentToFit({
                padding: 50,
                preserveAspectRatio: true,
                scaleGrid: 0.1,
                minScale: 0.2,
                maxScale: 3,
                useModelGeometry: true,
                // Centrar después del ajuste
                center: true
            });

            // Actualizar zoom actual
            var scale = this.paper.scale();
            this.currentZoom = scale.sx; // sx y sy deberían ser iguales

            console.log('🔍 Zoom to Fit:', Math.round(this.currentZoom * 100) + '%');
            this.updateCanvasInfo();

        } catch (error) {
            console.error('❌ Error en zoom to fit:', error);
            // Fallback: zoom manual centrado
            this.currentZoom = 1;
            this.paper.scale(1, 1);
            this.paper.translate(0, 0);
            this.updateCanvasInfo();
        }
    }

    // Método para centrar la vista
    centerView() {
        try {
            var elements = this.graph.getElements();
            if (elements.length === 0) return;

            // Calcular centro de todos los elementos
            var bbox = this.graph.getBBox();
            if (!bbox) return;

            var containerRect = this.paper.el.getBoundingClientRect();
            var centerX = containerRect.width / 2;
            var centerY = containerRect.height / 2;

            var modelCenterX = bbox.x + bbox.width / 2;
            var modelCenterY = bbox.y + bbox.height / 2;

            // Calcular traslación para centrar
            var translateX = centerX - modelCenterX * this.currentZoom;
            var translateY = centerY - modelCenterY * this.currentZoom;

            this.paper.translate(translateX, translateY);

            console.log('🎯 Vista centrada');

        } catch (error) {
            console.error('❌ Error centrando vista:', error);
        }
    }

    // Método para resetear zoom y pan
    resetViewport() {
        this.currentZoom = 1;
        this.paper.scale(1, 1);
        this.paper.translate(0, 0);
        console.log('🔄 Viewport reseteado');
        this.updateCanvasInfo();
    }

    // Método adicional para zoom específico
    setZoom(zoomLevel) {
        this.currentZoom = Math.max(0.2, Math.min(3, zoomLevel));
        this.paper.scale(this.currentZoom, this.currentZoom);
        console.log('🔍 Zoom Set:', Math.round(this.currentZoom * 100) + '%');
        this.updateCanvasInfo();
    }

    // Método para zoom con rueda del mouse (mejorado)
    setupMouseWheelZoom() {
        this.paper.el.addEventListener('wheel', (e) => {
            e.preventDefault();

            var delta = e.deltaY > 0 ? 0.9 : 1.1;
            var newZoom = this.currentZoom * delta;

            // Limitar zoom
            newZoom = Math.max(0.2, Math.min(3, newZoom));

            if (newZoom !== this.currentZoom) {
                // Obtener posición del mouse para zoom centrado
                var rect = this.paper.el.getBoundingClientRect();
                var clientX = e.clientX - rect.left;
                var clientY = e.clientY - rect.top;

                // Calcular punto de zoom
                var localPoint = this.paper.clientToLocalPoint(clientX, clientY);

                // Aplicar zoom
                this.currentZoom = newZoom;
                this.paper.scale(this.currentZoom, this.currentZoom);

                // Ajustar posición para mantener el punto bajo el cursor
                var newLocalPoint = this.paper.clientToLocalPoint(clientX, clientY);
                var dx = localPoint.x - newLocalPoint.x;
                var dy = localPoint.y - newLocalPoint.y;

                this.paper.translate(dx, dy);
                this.updateCanvasInfo();
            }
        });
    }

    // ==================== INFORMACIÓN DEL CANVAS MEJORADA ====================

    updateCanvasInfo() {
        var elements = this.graph.getElements();
        var links = this.graph.getLinks();
        var zoom = Math.round(this.currentZoom * 100);

        // Información más detallada
        var info = `📦 ${elements.length} clases | 🔗 ${links.length} relaciones | 🔍 ${zoom}%`;

        var infoElement = document.getElementById('canvas-info');
        if (infoElement) {
            infoElement.textContent = info;
        }

        // Actualizar título si está disponible
        if (window.currentDiagramTitle) {
            document.title = `${window.currentDiagramTitle} - Editor UML (${zoom}%)`;
        }

        // Actualizar controles de zoom si existen
        this.updateZoomControls();
    }

    updateZoomControls() {
        // Actualizar estado de botones de zoom
        var zoomInBtn = document.getElementById('zoom-in');
        var zoomOutBtn = document.getElementById('zoom-out');
        var zoomFitBtn = document.getElementById('zoom-fit');
        var zoomPercentage = document.getElementById('zoom-percentage');

        if (zoomInBtn) {
            zoomInBtn.disabled = this.currentZoom >= 3;
        }

        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.currentZoom <= 0.2;
        }

        if (zoomPercentage) {
            zoomPercentage.textContent = Math.round(this.currentZoom * 100) + '%';
        }
    }

    // ==================== GUARDADO Y CARGA MEJORADOS ====================

    saveDiagram() {
        try {
            var jsonData = JSON.stringify(this.graph.toJSON());

            // Obtener título si no existe
            var title = window.currentDiagramTitle;
            if (!title) {
                title = prompt('📝 Título del diagrama:', 'Mi Diagrama UML');
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

                // Mostrar feedback visual
                this.showSaveNotification('✅ Diagrama guardado correctamente');
            } else {
                console.error('❌ Livewire no disponible');
                this.showSaveNotification('❌ Error: Sistema de guardado no disponible', 'error');
            }
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.showSaveNotification('❌ Error al guardar el diagrama', 'error');
        }
    }

    showSaveNotification(message, type = 'success') {
        // Crear notificación temporal
        var notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Animar salida después de 3 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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

            // Recrear elemento con markup correcto y estilo mejorado
            var newElement = new joint.shapes.standard.Rectangle({
                id: elementData.id, // Mantener el ID original
                position: position,
                size: size,
                attrs: {
                    body: {
                        stroke: attrs.body?.stroke || '#1e40af',
                        fill: attrs.body?.fill || '#fefefe',
                        strokeWidth: 2,
                        strokeDasharray: attrs.body?.strokeDasharray || 'none',
                        rx: 4,
                        ry: 4,
                        filter: {
                            name: 'dropShadow',
                            args: {
                                dx: 2,
                                dy: 2,
                                blur: 3,
                                color: 'rgba(0,0,0,0.1)'
                            }
                        }
                    },
                    label: {
                        text: this.buildClassTextImproved(umlData),
                        fontSize: 12,
                        fontFamily: '"Fira Code", "Consolas", monospace',
                        fill: attrs.label?.fill || '#1e40af',
                        textVerticalAnchor: 'top',
                        textAnchor: 'start',
                        x: 12,
                        y: 12,
                        lineHeight: 1.3
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

    buildClassTextImproved(umlData) {
        if (!umlData || !umlData.className) {
            return 'Clase Sin Nombre';
        }

        var text = '';

        // Agregar estereotipo para interfaces
        if (umlData.type === 'interface') {
            text = '<<interface>>\n';
        }

        text += umlData.className;

        // Separador visual mejorado
        if (umlData.attributes && umlData.attributes.length > 0) {
            text += '\n' + '─'.repeat(Math.max(umlData.className.length, 20)) + '\n';
            text += umlData.attributes.join('\n');
        }

        // Separador de métodos
        if (umlData.methods && umlData.methods.length > 0) {
            if (umlData.attributes && umlData.attributes.length > 0) {
                text += '\n' + '─'.repeat(Math.max(umlData.className.length, 20)) + '\n';
            } else {
                text += '\n' + '─'.repeat(Math.max(umlData.className.length, 20)) + '\n';
            }
            text += umlData.methods.join('\n');
        }

        return text;
    }

    // ==================== UTILIDADES FINALES ====================

    clearDiagram() {
        if (confirm('¿Estás seguro de que quieres limpiar el diagrama?\n\nEsta acción no se puede deshacer.')) {
            this.graph.clear();
            this.selectedElement = null;
            this.firstElementSelected = null;
            this.updateCanvasInfo();
            console.log('🧹 Diagrama limpiado');
        }
    }

    exportToPNG() {
        console.log('📸 Export a PNG no implementado aún');
        this.showSaveNotification('📸 Export a PNG será implementado próximamente', 'info');
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

    // ==================== DEBUG Y DESARROLLO ====================

    debug() {
        console.log('🔧 Estado del editor:', {
            selectedTool: this.selectedTool,
            elements: this.graph.getElements().length,
            links: this.graph.getLinks().length,
            zoom: this.currentZoom,
            selectedElement: this.selectedElement?.id || 'ninguno',
            firstElementSelected: this.firstElementSelected?.id || 'ninguno'
        });

        console.log('📊 Elementos en el graph:', this.graph.toJSON());
        return this.getState();
    }
}

// Hacer disponible globalmente
window.UMLDiagramEditor = UMLDiagramEditor;

export { UMLDiagramEditor };
