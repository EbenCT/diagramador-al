// resources/js/diagram/modules-ai/AIChangePreview.js
// Maneja la vista previa de cambios propuestos por IA antes de aplicarlos
import * as joint from 'jointjs';
export class AIChangePreview {
    constructor(editor) {
        this.editor = editor;
        this.previewElements = new Map();
        this.previewOverlays = new Map();
        this.previewContainer = null;
        this.isShowingPreview = false;

        this.initializePreviewContainer();
    }

    // ==================== INICIALIZACIÓN ====================

    initializePreviewContainer() {
        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'ai-preview-container';
        this.previewContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 150;
        `;

        const paperContainer = this.editor.paper.el;
        paperContainer.appendChild(this.previewContainer);

        console.log('✅ Contenedor de preview inicializado');
    }

    // ==================== MOSTRAR PREVIEW PRINCIPAL ====================

    async showChangesPreview(changes) {
        if (this.isShowingPreview) {
            this.hidePreview();
        }

        console.log(`🔍 Mostrando preview de ${changes.length} cambios...`);
        this.isShowingPreview = true;

        // Procesar cada cambio
        for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            setTimeout(() => {
                this.createChangePreview(change, i);
            }, i * 200); // Escalonar aparición
        }

        // Mostrar controles de preview
        this.showPreviewControls(changes);
    }

    createChangePreview(change, index) {
        switch (change.type) {
            case 'CREATE_CLASS':
                this.previewCreateClass(change, index);
                break;
            case 'ADD_ATTRIBUTE':
                this.previewAddAttribute(change, index);
                break;
            case 'ADD_METHOD':
                this.previewAddMethod(change, index);
                break;
            case 'CREATE_RELATION':
                this.previewCreateRelation(change, index);
                break;
            case 'MODIFY_CLASS':
                this.previewModifyClass(change, index);
                break;
            default:
                console.warn('Tipo de cambio no soportado:', change.type);
        }
    }

    // ==================== PREVIEW DE CREAR CLASE ====================

    previewCreateClass(change, index) {
        const previewId = `preview-class-${index}`;

        // Crear elemento fantasma
        const ghostElement = this.editor.classManager.elementFactory.createClassElement(
            change.className,
            change.attributes || [],
            change.methods || [],
            change.position.x,
            change.position.y,
            'class',
            null // No agregar al graph
        );

        // Aplicar estilos de preview
        this.applyPreviewStyles(ghostElement, 'create');

        // Agregar temporalmente al graph para visualización
        this.editor.graph.addCell(ghostElement);

        // Guardar referencia
        this.previewElements.set(previewId, {
            element: ghostElement,
            change: change,
            type: 'create'
        });

        // Crear overlay de control
        this.createChangeOverlay(change, index, previewId);

        console.log(`👻 Preview de clase "${change.className}" creado`);
    }

    // ==================== PREVIEW DE AGREGAR ATRIBUTO ====================

    previewAddAttribute(change, index) {
        if (!change.targetElement) {
            console.warn('⚠️ No se encontró elemento target para agregar atributo');
            return;
        }

        const previewId = `preview-attr-${index}`;
        const element = change.targetElement;
        const umlData = element.get('umlData') || {};

        // Crear versión con atributo agregado
        const newAttributes = [...(umlData.attributes || []), change.attribute];

        // Crear overlay de resaltado
        this.createAttributeHighlight(element, change.attribute, previewId);

        // Guardar referencia del cambio
        this.previewElements.set(previewId, {
            element: element,
            change: change,
            type: 'add_attribute',
            originalAttributes: umlData.attributes || []
        });

        // Crear overlay de control
        this.createChangeOverlay(change, index, previewId);

        console.log(`📝 Preview de atributo "${change.attribute}" en "${change.className}"`);
    }

    // ==================== PREVIEW DE AGREGAR MÉTODO ====================

    previewAddMethod(change, index) {
        if (!change.targetElement) {
            console.warn('⚠️ No se encontró elemento target para agregar método');
            return;
        }

        const previewId = `preview-method-${index}`;
        const element = change.targetElement;

        // Crear overlay de resaltado para método
        this.createMethodHighlight(element, change.method, previewId);

        // Guardar referencia
        this.previewElements.set(previewId, {
            element: element,
            change: change,
            type: 'add_method',
            originalMethods: element.get('umlData')?.methods || []
        });

        // Crear overlay de control
        this.createChangeOverlay(change, index, previewId);

        console.log(`⚙️ Preview de método "${change.method}" en "${change.className}"`);
    }

    // ==================== PREVIEW DE CREAR RELACIÓN ====================

    previewCreateRelation(change, index) {
        if (!change.sourceElement || !change.targetElement) {
            console.warn('⚠️ No se encontraron elementos para crear relación');
            return;
        }

        const previewId = `preview-relation-${index}`;

        // Crear línea de relación fantasma
        const ghostRelation = this.createGhostRelation(
            change.sourceElement,
            change.targetElement,
            change.relationType
        );

        if (ghostRelation) {
            this.editor.graph.addCell(ghostRelation);

            // Aplicar estilos de preview
            this.applyPreviewStyles(ghostRelation, 'create');

            this.previewElements.set(previewId, {
                element: ghostRelation,
                change: change,
                type: 'create_relation'
            });
        }

        // Crear overlay de control
        this.createChangeOverlay(change, index, previewId);

        console.log(`🔗 Preview de relación ${change.relationType} creado`);
    }

    // ==================== OVERLAYS DE CONTROL ====================

createChangeOverlay(change, index, previewId) {
    const overlay = document.createElement('div');
    overlay.className = 'ai-change-overlay ai-change-draggable';
    overlay.innerHTML = `
        <div class="ai-change-header-drag" data-overlay-id="${previewId}">
            <div class="ai-change-drag-handle">⋮⋮</div>
            <div class="ai-change-title-container">
                <span class="ai-change-icon">${this.getChangeIcon(change.type)}</span>
                <span class="ai-change-title">${change.description}</span>
            </div>
        </div>
        <div class="ai-change-controls">
            <button class="ai-change-btn ai-change-accept" data-preview-id="${previewId}">
                ✓ Aplicar
            </button>
            <button class="ai-change-btn ai-change-reject" data-preview-id="${previewId}">
                ✗ Descartar
            </button>
        </div>
    `;

    // Posicionar overlay
    const position = this.calculateOverlayPosition(change, index);
    overlay.style.cssText = `
        position: absolute;
        left: ${position.x}px;
        top: ${position.y}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        padding: 12px;
        z-index: 151;
        pointer-events: auto;
        min-width: 200px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        cursor: move;
    `;

    this.previewContainer.appendChild(overlay);

    // ✅ NUEVO: Hacer overlay arrastrable
    this.makeOverlayDraggable(overlay, previewId);

    // Animar entrada
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.style.transform = 'translateY(0)';
    }, 50);

    // Configurar eventos
    this.setupOverlayEvents(overlay, previewId);

    // Guardar referencia
    this.previewOverlays.set(previewId, overlay);
}

makeOverlayDraggable(overlay, previewId) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    const header = overlay.querySelector('.ai-change-header-drag');

    header.addEventListener('mousedown', (e) => {
        // Solo permitir drag desde el handle o header
        if (!e.target.classList.contains('ai-change-drag-handle') &&
            !e.target.classList.contains('ai-change-header-drag')) {
            return;
        }

        isDragging = true;
        const rect = overlay.getBoundingClientRect();
        const containerRect = this.previewContainer.getBoundingClientRect();

        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        overlay.style.cursor = 'grabbing';
        overlay.style.zIndex = '160'; // Traer al frente

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const containerRect = this.previewContainer.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - dragOffset.x;
        let newY = e.clientY - containerRect.top - dragOffset.y;

        // Limitar dentro del container
        const overlayRect = overlay.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, containerRect.width - overlayRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - overlayRect.height));

        overlay.style.left = newX + 'px';
        overlay.style.top = newY + 'px';
        overlay.style.transition = 'none';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            overlay.style.cursor = 'move';
            overlay.style.zIndex = '151';
            overlay.style.transition = 'all 0.3s ease';
        }
    });
}

    setupOverlayEvents(overlay, previewId) {
        const acceptBtn = overlay.querySelector('.ai-change-accept');
        const rejectBtn = overlay.querySelector('.ai-change-reject');

        acceptBtn.onclick = () => this.acceptChange(previewId);
        rejectBtn.onclick = () => this.rejectChange(previewId);
    }

    // ==================== ACCIONES DE USUARIO ====================

    acceptChange(previewId) {
        const preview = this.previewElements.get(previewId);
        if (!preview) return;

        console.log(`✅ Aceptando cambio: ${preview.change.description}`);

        // Marcar como aceptado
        preview.accepted = true;

        // Aplicar estilos de aceptado
        if (preview.element) {
            this.applyPreviewStyles(preview.element, 'accepted');
        }

        // Ocultar overlay
        this.hideOverlay(previewId);

        // Emitir evento personalizado
        this.dispatchChangeEvent('change-accepted', preview.change, previewId);
    }

    rejectChange(previewId) {
        const preview = this.previewElements.get(previewId);
        if (!preview) return;

        console.log(`❌ Rechazando cambio: ${preview.change.description}`);

        // Remover elemento preview
        if (preview.element && preview.type.includes('create')) {
            preview.element.remove();
        }

        // Ocultar overlay
        this.hideOverlay(previewId);

        // Limpiar referencias
        this.previewElements.delete(previewId);

        // Emitir evento personalizado
        this.dispatchChangeEvent('change-rejected', preview.change, previewId);
    }

    // ==================== ESTILOS DE PREVIEW ====================

    applyPreviewStyles(element, state) {
        if (!element) return;

        switch (state) {
            case 'create':
                // Elemento fantasma
                element.attr('body/opacity', 0.6);
                element.attr('body/strokeDasharray', '5,5');
                element.attr('body/stroke', '#8b5cf6');
                element.attr('body/strokeWidth', 2);
                break;

            case 'modify':
                // Elemento modificado
                element.attr('body/stroke', '#f59e0b');
                element.attr('body/strokeWidth', 3);
                element.attr('body/filter', {
                    name: 'dropShadow',
                    args: { dx: 0, dy: 0, blur: 8, color: 'rgba(245, 158, 11, 0.4)' }
                });
                break;

            case 'accepted':
                // Cambio aceptado
                element.attr('body/stroke', '#10b981');
                element.attr('body/strokeWidth', 2);
                element.attr('body/opacity', 1);
                element.attr('body/strokeDasharray', 'none');
                break;
        }
    }

    // ==================== UTILIDADES ====================

    createGhostRelation(sourceElement, targetElement, relationType) {
        const source = sourceElement.id;
        const target = targetElement.id;

        // Usar relationship manager para crear relación temporal
        const relationshipManager = this.editor.relationshipManager;
        if (!relationshipManager) return null;

        // Crear relación básica
        const link = new joint.shapes.standard.Link({
            source: { id: source },
            target: { id: target }
        });

        // Configurar según tipo
        this.configureRelationshipType(link, relationType);

        return link;
    }

    configureRelationshipType(link, type) {
        const configs = {
            association: {
                attrs: { line: { stroke: '#8b5cf6', strokeWidth: 2 } }
            },
            inheritance: {
                attrs: {
                    line: { stroke: '#8b5cf6', strokeWidth: 2 },
                    'marker-target': { fill: '#8b5cf6', d: 'M 10 0 L 0 5 L 10 10 z' }
                }
            },
            composition: {
                attrs: {
                    line: { stroke: '#8b5cf6', strokeWidth: 2 },
                    'marker-source': { fill: '#8b5cf6', d: 'M 0 5 L 5 0 L 10 5 L 5 10 z' }
                }
            },
            aggregation: {
                attrs: {
                    line: { stroke: '#8b5cf6', strokeWidth: 2 },
                    'marker-source': { fill: 'white', stroke: '#8b5cf6', d: 'M 0 5 L 5 0 L 10 5 L 5 10 z' }
                }
            }
        };

        const config = configs[type] || configs.association;
        link.attr(config.attrs);
    }

    createAttributeHighlight(element, attribute, previewId) {
        const elementView = this.editor.paper.findViewByModel(element);
        if (!elementView) return;

        // Crear destacado visual para el nuevo atributo
        const highlight = document.createElement('div');
        highlight.className = 'ai-attribute-highlight';
        highlight.innerHTML = `<span class="ai-new-attribute">+ ${attribute}</span>`;

        const elementRect = elementView.el.getBoundingClientRect();
        const paperRect = this.editor.paper.el.getBoundingClientRect();

        highlight.style.cssText = `
            position: absolute;
            left: ${elementRect.left - paperRect.left + 10}px;
            top: ${elementRect.bottom - paperRect.top + 5}px;
            background: rgba(245, 158, 11, 0.1);
            border: 1px dashed #f59e0b;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            color: #92400e;
            pointer-events: none;
            z-index: 152;
        `;

        this.previewContainer.appendChild(highlight);

        // Guardar referencia para limpieza
        this.previewOverlays.set(`${previewId}-highlight`, highlight);
    }

    createMethodHighlight(element, method, previewId) {
        // Similar a createAttributeHighlight pero para métodos
        const elementView = this.editor.paper.findViewByModel(element);
        if (!elementView) return;

        const highlight = document.createElement('div');
        highlight.className = 'ai-method-highlight';
        highlight.innerHTML = `<span class="ai-new-method">+ ${method}</span>`;

        const elementRect = elementView.el.getBoundingClientRect();
        const paperRect = this.editor.paper.el.getBoundingClientRect();

        highlight.style.cssText = `
            position: absolute;
            left: ${elementRect.left - paperRect.left + 10}px;
            top: ${elementRect.bottom - paperRect.top + 25}px;
            background: rgba(139, 92, 246, 0.1);
            border: 1px dashed #8b5cf6;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            color: #6b21a8;
            pointer-events: none;
            z-index: 152;
        `;

        this.previewContainer.appendChild(highlight);
        this.previewOverlays.set(`${previewId}-highlight`, highlight);
    }

    calculateOverlayPosition(change, index) {
        const paperRect = this.editor.paper.el.getBoundingClientRect();

        if (change.targetElement) {
            // Posicionar cerca del elemento target
            const elementView = this.editor.paper.findViewByModel(change.targetElement);
            if (elementView) {
                const elementRect = elementView.el.getBoundingClientRect();
                return {
                    x: Math.min(elementRect.right - paperRect.left + 10, paperRect.width - 220),
                    y: elementRect.top - paperRect.top
                };
            }
        }

        // Posición por defecto en cuadrícula
        const cols = 2;
        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
            x: 20 + (col * 240),
            y: 20 + (row * 100)
        };
    }

    getChangeIcon(changeType) {
        const icons = {
            'CREATE_CLASS': '🏗️',
            'ADD_ATTRIBUTE': '📝',
            'ADD_METHOD': '⚙️',
            'CREATE_RELATION': '🔗',
            'MODIFY_CLASS': '✏️'
        };
        return icons[changeType] || '🔧';
    }

    // ==================== GESTIÓN DE PREVIEW ====================

    hidePreview() {
        console.log('🧹 Ocultando preview de cambios...');

        // Remover elementos preview
        this.previewElements.forEach((preview, previewId) => {
            if (preview.element && (preview.type.includes('create') && !preview.accepted)) {
                preview.element.remove();
            }
        });

        // Remover overlays
        this.previewOverlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        // Limpiar referencias
        this.previewElements.clear();
        this.previewOverlays.clear();

        this.isShowingPreview = false;
    }

    hideOverlay(previewId) {
        const overlay = this.previewOverlays.get(previewId);
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.previewOverlays.delete(previewId);
            }, 300);
        }

        // También remover highlight si existe
        const highlight = this.previewOverlays.get(`${previewId}-highlight`);
        if (highlight) {
            highlight.remove();
            this.previewOverlays.delete(`${previewId}-highlight`);
        }
    }

    showPreviewControls(changes) {
        // Mostrar controles globales para manejar todos los cambios
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'ai-preview-global-controls';
        controlsContainer.innerHTML = `
            <div class="ai-preview-summary">
                <span class="ai-preview-count">${changes.length}</span> cambios propuestos
            </div>
            <button class="ai-preview-accept-all">✓ Aplicar Todos</button>
            <button class="ai-preview-reject-all">✗ Descartar Todos</button>
        `;

        // Posicionar en esquina superior derecha del canvas
        controlsContainer.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            padding: 16px;
            z-index: 155;
            pointer-events: auto;
        `;

        this.previewContainer.appendChild(controlsContainer);
        this.previewOverlays.set('global-controls', controlsContainer);
    }

    // ==================== EVENTOS PERSONALIZADOS ====================

    dispatchChangeEvent(eventType, change, previewId) {
        const event = new CustomEvent(eventType, {
            detail: { change, previewId }
        });
        this.editor.paper.el.dispatchEvent(event);
    }

    getAcceptedChanges() {
        const acceptedChanges = [];
        this.previewElements.forEach(preview => {
            if (preview.accepted) {
                acceptedChanges.push(preview.change);
            }
        });
        return acceptedChanges;
    }
}

// Agregar estilos CSS
// REEMPLAZAR COMPLETAMENTE el método addPreviewStyles en AIChangePreview.js:

AIChangePreview.addPreviewStyles = function() {
    if (document.getElementById('ai-preview-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'ai-preview-styles';
    styles.textContent = `
        .ai-change-overlay {
            font-family: system-ui, -apple-system, sans-serif;
            cursor: move;
            user-select: none;
        }

        .ai-change-overlay:hover {
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
        }

        /* ✅ NUEVO: Header arrastrable */
        .ai-change-header-drag {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: grab;
            transition: all 0.2s;
        }

        .ai-change-header-drag:hover {
            background: #f9fafb;
        }

        .ai-change-header-drag:active {
            cursor: grabbing;
        }

        .ai-change-drag-handle {
            color: #9ca3af;
            font-size: 12px;
            cursor: grab;
        }

        .ai-change-title-container {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }

        .ai-change-title {
            font-size: 13px;
            font-weight: 500;
            color: #374151;
        }

        /* Estilos originales mantenidos */
        .ai-change-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
        }

        .ai-change-controls {
            display: flex;
            gap: 8px;
        }

        .ai-change-btn {
            flex: 1;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ai-change-accept {
            background: #10b981;
            color: white;
        }

        .ai-change-accept:hover {
            background: #059669;
            transform: translateY(-1px);
        }

        .ai-change-reject {
            background: #ef4444;
            color: white;
        }

        .ai-change-reject:hover {
            background: #dc2626;
            transform: translateY(-1px);
        }

        /* Controles globales */
        .ai-preview-global-controls {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 180px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
            padding: 16px;
        }

        .ai-preview-summary {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
        }

        .ai-preview-count {
            font-weight: 600;
            color: #8b5cf6;
        }

        .ai-preview-accept-all,
        .ai-preview-reject-all {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ai-preview-accept-all {
            background: #10b981;
            color: white;
        }

        .ai-preview-accept-all:hover {
            background: #059669;
            transform: translateY(-1px);
        }

        .ai-preview-reject-all {
            background: #ef4444;
            color: white;
        }

        .ai-preview-reject-all:hover {
            background: #dc2626;
            transform: translateY(-1px);
        }
    `;

    document.head.appendChild(styles);
};

// Cargar estilos
AIChangePreview.addPreviewStyles();
