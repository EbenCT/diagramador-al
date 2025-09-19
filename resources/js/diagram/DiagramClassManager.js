// resources/js/diagram/DiagramClassManager.js
// VERSIÓN SIMPLE Y FUNCIONAL - Solo usando JointJS nativo con texto estructurado

import * as joint from 'jointjs';

export class DiagramClassManager {
    constructor(editor) {
        this.editor = editor;
        this.classCounter = 1; // Contador para nombres automáticos
        this.interfaceCounter = 1; // Contador para interfaces

        // Templates UML
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
    }

    // ==================== CREACIÓN DIRECTA SIN PROMPTS ====================

    createClassImproved(x, y) {
        // Crear clase directamente con nombre por defecto
        const className = `Class ${this.classCounter++}`;
        const attributes = ['- attribute1: String', '- attribute2: int'];
        const methods = ['+ method1(): void', '+ method2(): String'];

        this.createClassElement(className, attributes, methods, x, y, 'class');
    }

    createInterface(x, y) {
        // Crear interfaz directamente con nombre por defecto
        const interfaceName = `Interface ${this.interfaceCounter++}`;
        const methods = ['+ method1(): void', '+ method2(): String'];

        this.createClassElement(interfaceName, [], methods, x, y, 'interface');
    }

    createClassElement(className, attributes, methods, x, y, type) {
        // Construir texto UML formateado
        let classText = '';

        // Agregar estereotipo para interfaces
        if (type === 'interface') {
            classText += '<<interface>>\n';
        }

        // Nombre de la clase
        classText += className + '\n';

        // Línea separadora
        classText += '─'.repeat(Math.max(className.length + 4, 20)) + '\n';

        // Atributos
        if (attributes.length > 0) {
            classText += attributes.join('\n') + '\n';
            classText += '─'.repeat(Math.max(className.length + 4, 20)) + '\n';
        }

        // Métodos
        if (methods.length > 0) {
            classText += methods.join('\n');
        }

        // Calcular dimensiones dinámicas basadas en el contenido
        const lines = classText.split('\n').filter(line => line.trim());
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const width = Math.max(200, maxLineLength * 8 + 30);
        const height = Math.max(120, lines.length * 18 + 30);

        // Colores según tipo
        const colors = type === 'interface' ? {
            fill: '#faf5ff',
            stroke: '#7c3aed',
            strokeDasharray: '8,4'
        } : {
            fill: '#ffffff',
            stroke: '#333333',
            strokeDasharray: 'none'
        };

        // Crear elemento JointJS con estilo UML profesional
        const classElement = new joint.shapes.standard.Rectangle({
            position: { x: x - width/2, y: y - height/2 },
            size: { width: width, height: height },
            attrs: {
                body: {
                    fill: colors.fill,
                    stroke: colors.stroke,
                    strokeWidth: 2,
                    strokeDasharray: colors.strokeDasharray,
                    rx: 4,
                    ry: 4,
                    filter: {
                        name: 'dropShadow',
                        args: {
                            dx: 2,
                            dy: 2,
                            blur: 4,
                            color: 'rgba(0,0,0,0.15)'
                        }
                    }
                },
                label: {
                    text: classText,
                    fontSize: 12,
                    fontFamily: '"Fira Code", "Consolas", monospace',
                    fill: type === 'interface' ? '#7c3aed' : '#1e40af',
                    textVerticalAnchor: 'top',
                    textAnchor: 'start',
                    x: 10,
                    y: 10,
                    lineHeight: 1.4
                }
            },
            umlData: {
                className: className,
                attributes: attributes,
                methods: methods,
                type: type
            }
        });

        // Agregar al graph
        this.editor.graph.addCell(classElement);

        // Hacer que sea editable con doble clic
        this.makeElementEditable(classElement);

        this.editor.updateCanvasInfo();
        this.editor.selectTool('select');

        console.log(`✅ ${type} creada:`, className);
    }

    // ==================== HACER ELEMENTOS EDITABLES ====================

    makeElementEditable(element) {
        // Escuchar eventos de doble clic para edición
        element.on('change:position', () => {
            // Mantener sincronizado si se mueve
        });
    }

    // ==================== EDICIÓN MEJORADA CON PROMPTS ====================

    editClassImproved(element) {
        const umlData = element.get('umlData') || {};
        const currentName = umlData.className || 'Clase';
        const currentAttrs = umlData.attributes || [];
        const currentMethods = umlData.methods || [];
        const currentType = umlData.type || 'class';

        // Crear interfaz de edición más amigable
        this.showEditDialog(element, currentName, currentAttrs, currentMethods, currentType);
    }

    showEditDialog(element, currentName, currentAttrs, currentMethods, currentType) {
        // Crear un div modal para edición
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 18px;">
                Editar ${currentType === 'interface' ? 'Interfaz' : 'Clase'}
            </h3>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">Nombre:</label>
                <input type="text" id="className" value="${currentName}"
                       style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                    Atributos (uno por línea):
                    <small style="color: #6b7280; font-weight: normal;">Formato: + público, - privado, # protegido, ~ paquete</small>
                </label>
                <textarea id="classAttributes" rows="4"
                          style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 12px; resize: vertical;">${currentAttrs.join('\n')}</textarea>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                    Métodos (uno por línea):
                    <small style="color: #6b7280; font-weight: normal;">Formato: + método(): tipo</small>
                </label>
                <textarea id="classMethods" rows="4"
                          style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 12px; resize: vertical;">${currentMethods.join('\n')}</textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelBtn"
                        style="padding: 8px 16px; border: 2px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; color: #374151;">
                    Cancelar
                </button>
                <button id="saveBtn"
                        style="padding: 8px 16px; border: 2px solid #1e40af; background: #1e40af; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Guardar
                </button>
                <button id="deleteBtn"
                        style="padding: 8px 16px; border: 2px solid #dc2626; background: #dc2626; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Eliminar
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Enfocar en el nombre
        setTimeout(() => {
            document.getElementById('className').focus();
            document.getElementById('className').select();
        }, 100);

        // Event listeners
        document.getElementById('cancelBtn').onclick = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('saveBtn').onclick = () => {
            const newName = document.getElementById('className').value || 'Clase';
            const newAttrs = document.getElementById('classAttributes').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line);
            const newMethods = document.getElementById('classMethods').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line);

            this.updateClassElement(element, newName, newAttrs, newMethods, currentType);
            document.body.removeChild(modal);
        };

        document.getElementById('deleteBtn').onclick = () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
                element.remove();
                document.body.removeChild(modal);
            }
        };

        // Cerrar con ESC
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    // ==================== ACTUALIZAR ELEMENTO ====================

    updateClassElement(element, className, attributes, methods, type) {
        // Construir nuevo texto
        let classText = '';

        if (type === 'interface') {
            classText += '<<interface>>\n';
        }

        classText += className + '\n';
        classText += '─'.repeat(Math.max(className.length + 4, 20)) + '\n';

        if (attributes.length > 0) {
            classText += attributes.join('\n') + '\n';
            classText += '─'.repeat(Math.max(className.length + 4, 20)) + '\n';
        }

        if (methods.length > 0) {
            classText += methods.join('\n');
        }

        // Calcular nuevas dimensiones
        const lines = classText.split('\n').filter(line => line.trim());
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const newWidth = Math.max(200, maxLineLength * 8 + 30);
        const newHeight = Math.max(120, lines.length * 18 + 30);

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

        console.log('✅ Clase actualizada:', className);
    }
}
