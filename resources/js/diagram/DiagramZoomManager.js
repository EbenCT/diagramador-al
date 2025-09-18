// resources/js/diagram/DiagramZoomManager.js
// Módulo encargado del zoom y navegación - TAL COMO ESTABA EN EL EDITOR ORIGINAL

export class DiagramZoomManager {
    constructor(editor) {
        this.editor = editor;
        this.currentZoom = 1;
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
        var paperEl = this.editor.paper.el;
        var isDragging = false;
        var dragStartPoint = null;
        var dragStartTranslate = null;

        paperEl.addEventListener('mousedown', (e) => {
            // Solo iniciar pan si no hay elemento seleccionado y es click del botón izquierdo
            if (e.button !== 0) return; // Solo botón izquierdo

            var target = e.target;
            var isElement = target.closest('.joint-element') || target.closest('.joint-link');

            // Si clicked en elemento, no hacer pan
            if (isElement) return;

            // Si herramienta de creación está activa, no hacer pan
            if (this.editor.selectedTool !== 'select') return;

            isDragging = true;
            dragStartPoint = { x: e.clientX, y: e.clientY };

            // Obtener transformación actual
            var currentTransform = this.editor.paper.matrix();
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
            this.editor.paper.translate(newX, newY);

            e.preventDefault();
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                dragStartPoint = null;
                dragStartTranslate = null;
                paperEl.style.cursor = this.editor.selectedTool === 'select' ?
                    'default' : 'crosshair';
            }
        });

        // Cambiar cursor cuando hover sobre canvas vacío
        paperEl.addEventListener('mousemove', (e) => {
            if (isDragging) return;

            var target = e.target;
            var isElement = target.closest('.joint-element') || target.closest('.joint-link');

            if (this.editor.selectedTool === 'select' && !isElement) {
                paperEl.style.cursor = 'grab';
            } else if (this.editor.selectedTool !== 'select') {
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

    setupMouseWheelZoom() {
        this.editor.paper.el.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();

                // Calcular nuevo zoom
                var delta = e.deltaY > 0 ? 0.9 : 1.1;
                var newZoom = this.currentZoom * delta;

                // Limitar zoom
                newZoom = Math.max(0.2, Math.min(3, newZoom));

                if (newZoom !== this.currentZoom) {
                    // Obtener posición del mouse para zoom centrado
                    var rect = this.editor.paper.el.getBoundingClientRect();
                    var clientX = e.clientX - rect.left;
                    var clientY = e.clientY - rect.top;

                    // Calcular punto de zoom
                    var localPoint = this.editor.paper.clientToLocalPoint(clientX, clientY);

                    // Aplicar zoom
                    this.currentZoom = newZoom;
                    this.editor.paper.scale(this.currentZoom, this.currentZoom);

                    // Ajustar posición para mantener el punto bajo el cursor
                    var newLocalPoint = this.editor.paper.clientToLocalPoint(clientX, clientY);
                    var dx = localPoint.x - newLocalPoint.x;
                    var dy = localPoint.y - newLocalPoint.y;

                    this.editor.paper.translate(dx, dy);
                    this.updateCanvasInfo();
                }
            }
        });
    }

    // ==================== MÉTODOS DE ZOOM ====================

    zoomIn() {
        var newZoom = Math.min(3, this.currentZoom * 1.1);
        this.setZoom(newZoom);
        console.log('🔍 Zoom In:', Math.round(this.currentZoom * 100) + '%');
        this.updateCanvasInfo();
    }

    zoomOut() {
        var newZoom = Math.max(0.2, this.currentZoom * 0.9);
        this.setZoom(newZoom);
        console.log('🔍 Zoom Out:', Math.round(this.currentZoom * 100) + '%');
        this.updateCanvasInfo();
    }

    setZoom(zoom) {
        this.currentZoom = zoom;
        this.editor.paper.scale(this.currentZoom, this.currentZoom);
        this.updateCanvasInfo();
    }

    zoomToFit() {
        try {
            // Obtener elementos para calcular el área ocupada
            var elements = this.editor.graph.getElements();
            var links = this.editor.graph.getLinks();

            if (elements.length === 0 && links.length === 0) {
                // Si no hay elementos, resetear zoom y centrar
                this.currentZoom = 1;
                this.editor.paper.scale(1, 1);
                this.editor.paper.translate(0, 0);
                console.log('🔍 Zoom Reset: 100% (sin elementos)');
                this.updateCanvasInfo();
                return;
            }

            // Usar el método nativo de JointJS con configuración mejorada
            this.editor.paper.scaleContentToFit({
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
            var scale = this.editor.paper.scale();
            this.currentZoom = scale.sx; // sx y sy deberían ser iguales

            console.log('🔍 Zoom to Fit:', Math.round(this.currentZoom * 100) + '%');
            this.updateCanvasInfo();

        } catch (error) {
            console.error('❌ Error en zoom to fit:', error);
            // Fallback: zoom manual centrado
            this.currentZoom = 1;
            this.editor.paper.scale(1, 1);
            this.editor.paper.translate(0, 0);
            this.updateCanvasInfo();
        }
    }

    // Método para centrar la vista
    centerView() {
        try {
            var elements = this.editor.graph.getElements();
            if (elements.length === 0) return;

            // Calcular centro de todos los elementos
            var bbox = this.editor.graph.getBBox();
            if (!bbox) return;

            var containerRect = this.editor.paper.el.getBoundingClientRect();
            var centerX = containerRect.width / 2;
            var centerY = containerRect.height / 2;

            var modelCenterX = bbox.x + bbox.width / 2;
            var modelCenterY = bbox.y + bbox.height / 2;

            // Calcular traslación para centrar
            var translateX = centerX - modelCenterX * this.currentZoom;
            var translateY = centerY - modelCenterY * this.currentZoom;

            this.editor.paper.translate(translateX, translateY);

            console.log('🎯 Vista centrada');

        } catch (error) {
            console.error('❌ Error centrando vista:', error);
        }
    }

    // Método para resetear zoom y pan
    resetViewport() {
        this.currentZoom = 1;
        this.editor.paper.scale(1, 1);
        this.editor.paper.translate(0, 0);
        console.log('🔄 Viewport reseteado');
        this.updateCanvasInfo();
    }

    // ==================== INFORMACIÓN DEL CANVAS MEJORADA ====================

    updateCanvasInfo() {
        var elements = this.editor.graph.getElements();
        var links = this.editor.graph.getLinks();
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

    getCurrentZoom() {
        return this.currentZoom;
    }
}
