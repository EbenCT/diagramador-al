// resources/js/diagram/DiagramClassManager.js
// VERSIÓN CON LÍNEAS SVG REALES QUE OCUPAN TODO EL ANCHO Y NOMBRE CENTRADO

import * as joint from 'jointjs';

export class DiagramClassManager {
    constructor(editor) {
        this.editor = editor;
        this.classCounter = 1;
        this.interfaceCounter = 1;

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

    createClassImproved(x, y) {
        const className = `Class ${this.classCounter++}`;
        const attributes = ['- attribute1: String', '- attribute2: int'];
        const methods = ['+ method1(): void', '+ method2(): String'];

        const element = this.createClassElement(className, attributes, methods, x, y, 'class');

        setTimeout(() => {
            this.showEditDialog(element, className, attributes, methods, 'class');
        }, 100);
    }

    createInterface(x, y) {
        const interfaceName = `Interface ${this.interfaceCounter++}`;
        const methods = ['+ method1(): void', '+ method2(): String'];

        const element = this.createClassElement(interfaceName, [], methods, x, y, 'interface');

        setTimeout(() => {
            this.showEditDialog(element, interfaceName, [], methods, 'interface');
        }, 100);
    }

    createClassElement(className, attributes, methods, x, y, type) {
        const maxLineLength = Math.max(
            className.length,
            ...attributes.map(attr => attr.length),
            ...methods.map(method => method.length)
        );
        const width = Math.max(200, maxLineLength * 8 + 30);

        const totalLines = 1 +
                           (type === 'interface' ? 1 : 0) +
                           attributes.length +
                           methods.length;
        const height = Math.max(120, totalLines * 16 + 50);

        const textElements = this.buildTextElements(className, attributes, methods, type, width);

        const colors = type === 'interface' ? {
            fill: '#faf5ff',
            stroke: '#7c3aed',
            strokeDasharray: '8,4'
        } : {
            fill: '#ffffff',
            stroke: '#333333',
            strokeDasharray: 'none'
        };

        // Crear elemento con markup que incluye líneas SVG
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
                    text: '',
                    display: 'none'
                }
            },
            markup: [
                {
                    tagName: 'rect',
                    selector: 'body'
                },
                {
                    tagName: 'text',
                    selector: 'classText',
                    children: textElements
                },
                {
                    tagName: 'line',
                    selector: 'divider1'
                },
                {
                    tagName: 'line',
                    selector: 'divider2'
                }
            ],
            umlData: {
                className: className,
                attributes: attributes,
                methods: methods,
                type: type
            }
        });

        // Configurar texto - MANTENER POSICIÓN ORIGINAL
        classElement.attr('classText', {
            x: 15,  // Mantener posición original
            y: 20,
            fontSize: 12,
            fontFamily: '"Fira Code", "Consolas", monospace',
            fill: type === 'interface' ? '#7c3aed' : '#1e40af',
            textAnchor: 'start',  // Mantener alineación original
            dominantBaseline: 'hanging'
        });

        // Calcular posiciones Y para las líneas divisorias
        const lineHeight = 16;
        let currentY = 20;

        // Saltar el estereotipo si existe
        if (type === 'interface') {
            currentY += lineHeight;
        }

        // Saltar el nombre de la clase
        currentY += lineHeight;

        // Primera línea divisoria (después del nombre)
        const line1Y = currentY + 5;

        // Segunda línea divisoria (después de atributos, si existen)
        const line2Y = attributes.length > 0 ?
            line1Y + (attributes.length * lineHeight) + lineHeight :
            -100; // Fuera de vista si no hay atributos

        // Configurar líneas divisorias que ocupen TODO EL ANCHO
        classElement.attr({
            'divider1': {
                x1: 5,
                y1: line1Y,
                x2: width - 5,  // Todo el ancho del rectángulo
                y2: line1Y,
                stroke: type === 'interface' ? '#7c3aed' : '#333333',
                strokeWidth: 1
            },
            'divider2': {
                x1: 5,
                y1: line2Y,
                x2: width - 5,  // Todo el ancho del rectángulo
                y2: line2Y,
                stroke: type === 'interface' ? '#7c3aed' : '#333333',
                strokeWidth: 1,
                display: attributes.length > 0 ? 'block' : 'none'
            }
        });

        this.editor.graph.addCell(classElement);
        this.makeElementEditable(classElement);
        this.editor.updateCanvasInfo();
        this.editor.selectTool('select');

        console.log(`${type} creada:`, className);

        return classElement;
    }

    // Construcción de texto CON NOMBRE CENTRADO PERO SIN CAMBIAR EL PUNTO DE REFERENCIA
    buildTextElements(className, attributes, methods, type, width) {
        const elements = [];
        let currentY = 0;
        const lineHeight = 16;

        // Estereotipo para interfaces - CENTRADO
        if (type === 'interface') {
            elements.push({
                tagName: 'tspan',
                attributes: {
                    x: width / 2,  // Centrar en el ancho del rectángulo
                    dy: currentY === 0 ? 0 : lineHeight,
                    'font-style': 'italic',
                    'font-size': '10px',
                    'text-anchor': 'middle'  // Centrado
                },
                textContent: '<<interface>>'
            });
            currentY += lineHeight;
        }

        // Nombre de la clase - CENTRADO
        elements.push({
            tagName: 'tspan',
            attributes: {
                x: width / 2,  // Centrar en el ancho del rectángulo
                dy: currentY === 0 ? 0 : lineHeight,
                'font-weight': 'bold',
                'font-size': '14px',
                'text-anchor': 'middle'  // Centrado
            },
            textContent: className
        });
        currentY += lineHeight;

        // Atributos - ALINEACIÓN IZQUIERDA CON ESPACIADO EXTRA PARA COMPENSAR LA LÍNEA SVG
        if (attributes.length > 0) {
            attributes.forEach((attr, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,  // Mantener posición izquierda normal
                        dy: index === 0 ? lineHeight * 2 : lineHeight,  // Doble espaciado en el primer atributo
                        fill: this.getColorByVisibility(attr),
                        'text-anchor': 'start'  // Alineación izquierda
                    },
                    textContent: attr
                });
                currentY += lineHeight;
            });
        }

        // Métodos - ALINEACIÓN IZQUIERDA CON ESPACIADO EXTRA PARA COMPENSAR LA LÍNEA SVG
        if (methods.length > 0) {
            methods.forEach((method, index) => {
                elements.push({
                    tagName: 'tspan',
                    attributes: {
                        x: 15,  // Mantener posición izquierda normal
                        dy: index === 0 ? (attributes.length > 0 ? lineHeight * 2 : lineHeight * 2) : lineHeight,  // Doble espaciado en el primer método
                        fill: this.getColorByVisibility(method),
                        'text-anchor': 'start'  // Alineación izquierda
                    },
                    textContent: method
                });
                currentY += lineHeight;
            });
        }

        return elements;
    }

    getColorByVisibility(text) {
        if (text.startsWith('+')) return '#059669';
        if (text.startsWith('-')) return '#dc2626';
        if (text.startsWith('#')) return '#d97706';
        if (text.startsWith('~')) return '#7c3aed';
        return '#374151';
    }

    makeElementEditable(element) {
        element.on('change:position', () => {
            // Mantener sincronizado si se mueve
        });
    }

    editClassImproved(element) {
        const umlData = element.get('umlData') || {};
        const currentName = umlData.className || 'Clase';
        const currentAttrs = umlData.attributes || [];
        const currentMethods = umlData.methods || [];
        const currentType = umlData.type || 'class';

        this.showEditDialog(element, currentName, currentAttrs, currentMethods, currentType);
    }

    showEditDialog(element, currentName, currentAttrs, currentMethods, currentType) {
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

        setTimeout(() => {
            document.getElementById('className').focus();
            document.getElementById('className').select();
        }, 100);

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

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    updateClassElement(element, className, attributes, methods, type) {
        const maxLineLength = Math.max(
            className.length,
            ...attributes.map(attr => attr.length),
            ...methods.map(method => method.length)
        );
        const newWidth = Math.max(200, maxLineLength * 8 + 30);

        const totalLines = 1 +
                           (type === 'interface' ? 1 : 0) +
                           attributes.length +
                           methods.length;
        const newHeight = Math.max(120, totalLines * 16 + 50);

        const textElements = this.buildTextElements(className, attributes, methods, type, newWidth);

        element.resize(newWidth, newHeight);

        // Actualizar markup con nuevo texto
        element.set('markup', [
            {
                tagName: 'rect',
                selector: 'body'
            },
            {
                tagName: 'text',
                selector: 'classText',
                children: textElements
            },
            {
                tagName: 'line',
                selector: 'divider1'
            },
            {
                tagName: 'line',
                selector: 'divider2'
            }
        ]);

        // MANTENER configuración del texto original
        element.attr('classText', {
            x: 15,  // Mantener posición original
            y: 20,
            fontSize: 12,
            fontFamily: '"Fira Code", "Consolas", monospace',
            fill: type === 'interface' ? '#7c3aed' : '#1e40af',
            textAnchor: 'start',  // Mantener alineación original
            dominantBaseline: 'hanging'
        });

        // Recalcular posiciones de líneas
        const lineHeight = 16;
        let currentY = 20;

        if (type === 'interface') {
            currentY += lineHeight;
        }

        currentY += lineHeight;
        const line1Y = currentY + 5;
        const line2Y = attributes.length > 0 ?
            line1Y + (attributes.length * lineHeight) + lineHeight :
            -100;

        // Actualizar líneas divisorias con nuevo ancho
        element.attr({
            'divider1': {
                x1: 5,
                y1: line1Y,
                x2: newWidth - 5,
                y2: line1Y,
                stroke: type === 'interface' ? '#7c3aed' : '#333333',
                strokeWidth: 1
            },
            'divider2': {
                x1: 5,
                y1: line2Y,
                x2: newWidth - 5,
                y2: line2Y,
                stroke: type === 'interface' ? '#7c3aed' : '#333333',
                strokeWidth: 1,
                display: attributes.length > 0 ? 'block' : 'none'
            }
        });

        element.set('umlData', {
            className: className,
            attributes: attributes,
            methods: methods,
            type: type
        });

        console.log('Clase actualizada:', className);
    }
}
