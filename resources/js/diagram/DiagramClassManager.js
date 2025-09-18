// resources/js/diagram/DiagramClassManager.js
// Módulo encargado de clases UML - TAL COMO ESTABA EN EL EDITOR ORIGINAL

import * as joint from 'jointjs';

export class DiagramClassManager {
    constructor(editor) {
        this.editor = editor;

        // Templates UML tal como estaban en el editor original
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

        this.editor.graph.addCell(classElement);
        this.editor.updateCanvasInfo();
        this.editor.selectTool('select');

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

Atributos actuales:
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
}
