// resources/js/diagram/DiagramSaveManager.js - COMPATIBLE CON UML 2.5
// Mantiene retrocompatibilidad completa y soporte para características UML 2.5
// NUEVO: Edición inline del título con doble clic

import * as joint from 'jointjs';
import { DiagramElementFactory } from './DiagramElementFactory.js';

export class DiagramSaveManager {
    constructor(editor) {
        this.editor = editor;
        this.elementFactory = new DiagramElementFactory();

        // NUEVO: Inicializar edición inline del título
        this.initializeTitleEditing();
    }

    // ==================== NUEVO: EDICIÓN INLINE DEL TÍTULO ====================

    /**
     * Inicializa la funcionalidad de edición inline del título
     */
    initializeTitleEditing() {
        // Buscar el elemento del título en la página
        this.findAndSetupTitleElement();

        // Si no se encuentra inmediatamente, reintentar después de un momento
        // (útil si el DOM se está cargando)
        setTimeout(() => {
            if (!this.titleElement) {
                this.findAndSetupTitleElement();
            }
        }, 1000);

        console.log('✅ Edición inline del título inicializada');
    }

    /**
     * Busca y configura el elemento del título
     */
    findAndSetupTitleElement() {
        // Buscar el elemento del título por diferentes selectores posibles
        const selectors = [
            'h1', // Título principal
            '.diagram-title', // Clase específica
            '[data-diagram-title]', // Atributo específico
            'h2', // Título secundario
            '.page-title', // Clase de título de página
            '.editor-title' // Clase de título del editor
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.includes('*')) {
                this.titleElement = element;
                break;
            }
        }

        if (this.titleElement) {
            this.setupTitleEvents();
            console.log('📝 Elemento de título encontrado:', this.titleElement.tagName);
        } else {
            console.log('⚠️ No se encontró elemento de título para editar');
        }
    }

    /**
     * Configura los eventos del título
     */
    setupTitleEvents() {
        if (!this.titleElement) return;

        // Agregar cursor pointer para indicar que es editable
        this.titleElement.style.cursor = 'pointer';
        this.titleElement.title = 'Doble clic para editar el título';

        // Evento de doble clic
        this.titleElement.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.startTitleEditing();
        });

        console.log('🖱️ Eventos de título configurados');
    }

    /**
     * Inicia la edición del título
     */
    startTitleEditing() {
        if (!this.titleElement || this.isEditing) return;

        const currentTitle = this.titleElement.textContent.trim();
        this.isEditing = true;

        // Crear input de edición
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'title-editor-input';

        // Aplicar estilos del input
        this.applyInputStyles(input);

        // Reemplazar el título con el input
        this.titleElement.style.display = 'none';
        this.titleElement.parentNode.insertBefore(input, this.titleElement.nextSibling);

        // Configurar eventos del input
        this.setupInputEvents(input, currentTitle);

        // Enfocar y seleccionar
        input.focus();
        input.select();

        console.log(`✏️ Editando título: "${currentTitle}"`);
    }

    /**
     * Aplica estilos al input de edición
     */
    applyInputStyles(input) {
        const titleStyles = window.getComputedStyle(this.titleElement);

        input.style.fontSize = titleStyles.fontSize;
        input.style.fontFamily = titleStyles.fontFamily;
        input.style.fontWeight = titleStyles.fontWeight;
        input.style.color = titleStyles.color;
        input.style.background = 'transparent';
        input.style.border = '2px solid #3b82f6';
        input.style.borderRadius = '4px';
        input.style.padding = '4px 8px';
        input.style.outline = 'none';
        input.style.width = 'auto';
        input.style.minWidth = '200px';
        input.style.maxWidth = '500px';
    }

    /**
     * Configura eventos del input de edición
     */
    setupInputEvents(input, originalTitle) {
        // Confirmar con Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.finishTitleEditing(input, originalTitle);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelTitleEditing(input);
            }
        });

        // Confirmar al perder foco
        input.addEventListener('blur', () => {
            // Pequeño delay para permitir clics en otros elementos
            setTimeout(() => {
                if (this.isEditing) {
                    this.finishTitleEditing(input, originalTitle);
                }
            }, 100);
        });
    }

    /**
     * Finaliza la edición del título
     */
async finishTitleEditing(input, originalTitle) {
    if (!this.isEditing) return;

    let newTitle = input.value.trim();

    // Validar título
    if (!newTitle) {
        this.showSaveNotification('❌ El título no puede estar vacío', 'error');
        this.cancelTitleEditing(input);
        return;
    }

    // ✅ NUEVO: Asegurar que siempre empiece con *
    if (!newTitle.startsWith('*')) {
        newTitle = '*' + newTitle;
    }

    if (newTitle === originalTitle) {
        this.cancelTitleEditing(input);
        return;
    }

    try {
        // Actualizar título en el elemento
        this.titleElement.textContent = newTitle;

        // Actualizar variables globales
        window.currentDiagramTitle = newTitle;

        // Actualizar título vía Livewire si está disponible
        await this.updateTitleViaLivewire(newTitle);

        // Limpiar
        this.cleanupTitleEditing(input);

        this.showSaveNotification(`✏️ Título actualizado a "${newTitle}"`, 'success');
        console.log(`✅ Título actualizado: "${originalTitle}" → "${newTitle}"`);

    } catch (error) {
        console.error('❌ Error al actualizar título:', error);
        this.showSaveNotification('❌ Error al actualizar el título', 'error');

        // Restaurar título original
        this.titleElement.textContent = originalTitle;
        this.cleanupTitleEditing(input);
    }
}

    /**
     * Cancela la edición del título
     */
    cancelTitleEditing(input) {
        this.cleanupTitleEditing(input);
        console.log('❌ Edición de título cancelada');
    }

    /**
     * Limpia la edición del título
     */
    cleanupTitleEditing(input) {
        if (input && input.parentNode) {
            input.parentNode.removeChild(input);
        }

        if (this.titleElement) {
            this.titleElement.style.display = '';
        }

        this.isEditing = false;
    }

    /**
     * Actualiza el título vía Livewire
     */
    async updateTitleViaLivewire(newTitle) {
        if (!window.Livewire) return;

        try {
            // Método moderno de Livewire 3
            if (window.Livewire.find && typeof window.Livewire.find === 'function') {
                const wireId = document.querySelector('[wire\\:id]')?.getAttribute('wire:id');
                if (wireId) {
                    const component = window.Livewire.find(wireId);
                    if (component) {
                        component.set('diagramTitle', newTitle);
                        await component.call('updateTitle');
                        return;
                    }
                }
            }

            // Fallback para otras versiones
            window.Livewire.dispatch('update-diagram-title', [newTitle]);

        } catch (error) {
            console.warn('⚠️ No se pudo actualizar vía Livewire:', error);
        }
    }

    // ==================== MÉTODOS PRINCIPALES (RESTAURADOS A ORIGINAL) ====================

    saveDiagram() {
        try {
        var jsonData = JSON.stringify(this.editor.graph.toJSON());
        var title;

        // ✅ FIXED: Solo pedir título si es diagrama nuevo SIN nombre
        if (window.currentDiagramId) {
            // Diagrama existente - usar título actual
            title = window.currentDiagramTitle || '* Diagrama Existente';
        } else {
            // Diagrama nuevo - pedir título solo si no tiene
            if (window.currentDiagramTitle) {
                title = window.currentDiagramTitle;
            } else {
                title = prompt('📝 Título del diagrama:', '* Mi Diagrama UML');

                // Asegurar que empiece con *
                if (title && !title.startsWith('*')) {
                    title = '* ' + title;
                }
            }
        }

        if (!title && !window.currentDiagramId) {
            console.log('❌ Guardado cancelado');
            return;
        }

        console.log('💾 Guardando diagrama...');

            // Análisis de contenido para logging
            const data = JSON.parse(jsonData);
            const uml25Elements = data.cells ?
                data.cells.filter(cell => cell.umlData?.uml25).length : 0;

            if (uml25Elements > 0) {
                console.log(`📊 Guardando ${uml25Elements} elementos con características UML 2.5`);
            }

            if (window.Livewire) {
                window.Livewire.dispatch('save-diagram', [jsonData, title]);
            }

            window.currentDiagramTitle = title;

            // Actualizar título en la página si existe
            if (this.titleElement && title) {
                this.titleElement.textContent = title;
            }

            this.showSaveNotification(
                `💾 Diagrama guardado correctamente${uml25Elements > 0 ? ' (UML 2.5)' : ''}`,
                'success'
            );

            console.log('💾 Diagrama guardado exitosamente');

        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.showSaveNotification('❌ Error al guardar el diagrama', 'error');
        }
    }

    // ==================== MÉTODOS EXISTENTES (SIN CAMBIOS) ====================

    loadDiagramData() {
        console.log('🔄 Cargando datos del diagrama...');
        console.log('📊 Datos disponibles:', window.diagramData);

        if (window.diagramData && window.diagramData !== '[]') {
            try {
                var data = JSON.parse(window.diagramData);
                console.log('📋 Datos parseados:', data);

                if (data.cells && data.cells.length > 0) {
                    this.editor.graph.clear();
                    this.recreateElementsFromData(data.cells);
                    this.editor.updateCanvasInfo();

                    setTimeout(() => {
                        this.editor.zoomManager.zoomToFit();
                    }, 500);

                    // Análisis de contenido cargado
                    const uml25Elements = data.cells.filter(cell => cell.umlData?.uml25).length;
                    console.log(`✅ Diagrama cargado con ${data.cells.length} elementos` +
                               (uml25Elements > 0 ? ` (${uml25Elements} con UML 2.5)` : ''));
                } else {
                    console.log('ℹ️ No hay elementos en el diagrama');
                }
            } catch (e) {
                console.error('❌ Error cargando diagrama:', e);
                console.error('📊 Datos que causaron error:', window.diagramData);
                this.editor.graph.clear();
            }
        } else {
            console.log('ℹ️ No hay datos de diagrama para cargar');
        }

        if (window.diagramId) {
            window.currentDiagramId = window.diagramId;
            console.log('🆔 ID del diagrama establecido:', window.currentDiagramId);
        }

        if (window.diagramTitle) {
            window.currentDiagramTitle = window.diagramTitle;
            console.log('📝 Título del diagrama establecido:', window.currentDiagramTitle);

            // NUEVO: Actualizar título en la página
            if (this.titleElement) {
                this.titleElement.textContent = window.diagramTitle;
            }
        }
    }

    recreateElementsFromData(cells) {
        var elements = [];
        var links = [];

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

        // Luego recrear enlaces
        links.forEach(linkData => {
            this.recreateLink(linkData);
        });
    }

    recreateElement(elementData) {
        try {
            var umlData = elementData.umlData || {};
            var position = elementData.position || { x: 100, y: 100 };
            var type = umlData.type || 'class';
            var className = umlData.className || 'Clase';
            var attributes = umlData.attributes || [];
            var methods = umlData.methods || [];

            // NUEVO: Extraer configuración UML 2.5 si existe
            var uml25Config = null;
            if (umlData.uml25) {
                uml25Config = this.elementFactory.getUML25Config(umlData);
                console.log(`🚀 Recreando elemento UML 2.5: ${className}`, uml25Config);
            }

            // Usar la factory factorizada para crear el elemento (con soporte UML 2.5)
            const element = this.elementFactory.createClassElement(
                className,
                attributes,
                methods,
                position.x,
                position.y,
                type,
                null, // No agregar al graph automáticamente
                uml25Config // NUEVO: Pasar configuración UML 2.5
            );

            // Establecer ID original si existe
            if (elementData.id) {
                element.set('id', elementData.id);
            }

            // Agregar al graph
            this.editor.graph.addCell(element);

            console.log(`✅ Elemento recreado: ${className}` +
                       (uml25Config ? ' (UML 2.5)' : ''));

        } catch (error) {
            console.error('❌ Error recreando elemento:', error);
        }
    }

    recreateLink(linkData) {
        try {
            var relationData = linkData.relationData || {};
            var source = linkData.source || {};
            var target = linkData.target || {};
            var labels = linkData.labels || [];

            var sourceElement = this.editor.graph.getCell(source.id);
            var targetElement = this.editor.graph.getCell(target.id);

            if (!sourceElement || !targetElement) {
                console.warn('⚠️ No se pudo recrear enlace: elementos fuente/destino no encontrados');
                return;
            }

            // Usar el método factorizado para obtener atributos de relación
            var attrs = this.elementFactory.getRelationshipAttrs(relationData.type);

            var newLink = new joint.shapes.standard.Link({
                id: linkData.id,
                source: source,
                target: target,
                attrs: attrs,
                labels: labels,
                relationData: relationData
            });

            this.editor.graph.addCell(newLink);
            console.log('✅ Enlace recreado:', relationData.type || 'Sin tipo');

        } catch (e) {
            console.error('❌ Error recreando enlace:', e, linkData);
        }
    }

    showSaveNotification(message, type) {
        var notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 transition-opacity duration-300 ${
            type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    clearDiagram() {
        if (confirm('¿Estás seguro de que quieres limpiar el diagrama?\n\nEsta acción no se puede deshacer.')) {
            this.editor.graph.clear();
            this.editor.selectedElement = null;
            this.editor.firstElementSelected = null;
            this.editor.updateCanvasInfo();
            console.log('🧹 Diagrama limpiado');
        }
    }

    exportToPNG() {
        console.log('📸 Export a PNG no implementado aún');
        this.showSaveNotification('📸 Export a PNG será implementado próximamente', 'info');
    }

    // ==================== MÉTODOS UML 2.5 (SIN CAMBIOS) ====================

    getDiagramStats() {
        const elements = this.editor.graph.getElements();
        const links = this.editor.graph.getLinks();

        let uml25Count = 0;
        let stereotypeCount = {};
        let derivedAttributesCount = 0;
        let responsibilitiesCount = 0;
        let constraintsCount = 0;

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData?.uml25) {
                uml25Count++;

                if (umlData.uml25.stereotype) {
                    stereotypeCount[umlData.uml25.stereotype] =
                        (stereotypeCount[umlData.uml25.stereotype] || 0) + 1;
                }

                derivedAttributesCount += umlData.uml25.derivedAttributes?.length || 0;
                responsibilitiesCount += umlData.uml25.responsibilities?.length || 0;
                constraintsCount += umlData.uml25.constraints?.length || 0;
            }
        });

        return {
            totalElements: elements.length,
            totalLinks: links.length,
            uml25Elements: uml25Count,
            stereotypes: stereotypeCount,
            derivedAttributes: derivedAttributesCount,
            responsibilities: responsibilitiesCount,
            constraints: constraintsCount
        };
    }

    convertToLegacy() {
        if (!confirm('¿Convertir elementos UML 2.5 a formato legacy?\n\nEsto eliminará las características avanzadas.')) {
            return;
        }

        const elements = this.editor.graph.getElements();
        let convertedCount = 0;

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData?.uml25) {
                // Remover configuración UML 2.5
                const newUmlData = { ...umlData };
                delete newUmlData.uml25;
                element.set('umlData', newUmlData);

                // Recrear elemento sin características UML 2.5
                this.elementFactory.updateClassElement(
                    element,
                    umlData.className,
                    umlData.attributes,
                    umlData.methods,
                    umlData.type,
                    null // Sin configuración UML 2.5
                );

                convertedCount++;
            }
        });

        this.showSaveNotification(`🔄 ${convertedCount} elementos convertidos a legacy`, 'success');
        console.log(`🔄 Convertidos ${convertedCount} elementos a formato legacy`);
    }

    exportUML25Features() {
        const elements = this.editor.graph.getElements();
        const uml25Data = [];

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData?.uml25) {
                uml25Data.push({
                    className: umlData.className,
                    type: umlData.type,
                    uml25Features: umlData.uml25
                });
            }
        });

        if (uml25Data.length === 0) {
            this.showSaveNotification('ℹ️ No hay elementos UML 2.5 para exportar', 'info');
            return;
        }

        // Crear y descargar archivo JSON
        const blob = new Blob([JSON.stringify(uml25Data, null, 2)],
                             { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uml25-features-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showSaveNotification(`📄 Exportadas ${uml25Data.length} características UML 2.5`, 'success');
    }
}

// ==================== FUNCIONES GLOBALES ====================

// Función global para compatibilidad (ORIGINAL)
window.saveFromButton = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        window.DiagramEditor.instance.saveManager.saveDiagram();
    } else {
        console.error('❌ Save Manager no disponible');
    }
};

// NUEVO: Función global para activar edición de título manualmente
window.editDiagramTitle = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        window.DiagramEditor.instance.saveManager.startTitleEditing();
    } else {
        console.error('❌ Save Manager no disponible');
    }
};

// Funciones globales adicionales para UML 2.5 (SIN CAMBIOS)
window.exportUML25Features = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        window.DiagramEditor.instance.saveManager.exportUML25Features();
    }
};

window.convertToLegacy = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        window.DiagramEditor.instance.saveManager.convertToLegacy();
    }
};

window.getDiagramStats = function() {
    if (window.DiagramEditor?.instance?.saveManager) {
        return window.DiagramEditor.instance.saveManager.getDiagramStats();
    }
};
