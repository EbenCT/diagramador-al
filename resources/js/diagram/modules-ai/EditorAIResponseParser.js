// resources/js/diagram/modules-ai/EditorAIResponseParser.js
// Parser específico para respuestas del Editor IA (formato JSON)

export class EditorAIResponseParser {
    constructor() {
        this.validActions = [
            'CREATE_CLASS', 'DELETE_CLASS', 'RENAME_CLASS', 'MOVE_CLASS',
            'ADD_ATTRIBUTE', 'EDIT_ATTRIBUTE', 'DELETE_ATTRIBUTE',
            'CREATE_RELATION', 'EDIT_RELATION', 'DELETE_RELATION',
            'EDIT_MULTIPLICITY', 'SET_RELATION_NAME'
        ];
    }

    parseResponse(response) {
        console.log('🔍 EditorAI Parser - Respuesta recibida:', response);

        if (!response || typeof response !== 'string') {
            console.error('❌ Respuesta vacía o inválida');
            return null;
        }

        try {
            // Limpiar respuesta (remover markdown, espacios extra)
            let cleanResponse = response.trim();

            // Buscar JSON en la respuesta
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanResponse = jsonMatch[0];
            }

            // Parsear JSON
            const parsed = JSON.parse(cleanResponse);
            console.log('✅ JSON parseado:', parsed);

            // Validar estructura esperada: {commands: [...]}
            if (!parsed.commands || !Array.isArray(parsed.commands)) {
                console.error('❌ Estructura inválida: se esperaba {commands: [...]}');
                return this.tryAlternativeParser(response);
            }

            // Validar y limpiar comandos
            const validCommands = [];

            for (const command of parsed.commands) {
                const validatedCommand = this.validateCommand(command);
                if (validatedCommand) {
                    validCommands.push(validatedCommand);
                } else {
                    console.warn('⚠️ Comando inválido ignorado:', command);
                }
            }

            console.log(`✅ ${validCommands.length} comandos válidos parseados`);
            return validCommands;

        } catch (error) {
            console.error('❌ Error parseando JSON:', error);
            console.error('Respuesta original:', response);

            // Intento de parseo alternativo
            return this.tryAlternativeParser(response);
        }
    }

    validateCommand(command) {
        if (!command || typeof command !== 'object') {
            return null;
        }

        const action = command.action;

        if (!this.validActions.includes(action)) {
            console.warn(`❌ Acción no válida: ${action}`);
            return null;
        }

        // Validaciones específicas por tipo de comando
        switch (action) {
            case 'CREATE_CLASS':
                return this.validateCreateClass(command);
            case 'DELETE_CLASS':
                return this.validateDeleteClass(command);
            case 'RENAME_CLASS':
                return this.validateRenameClass(command);
            case 'ADD_ATTRIBUTE':
                return this.validateAddAttribute(command);
            case 'DELETE_ATTRIBUTE':
                return this.validateDeleteAttribute(command);
            case 'CREATE_RELATION':
                return this.validateCreateRelation(command);
            case 'DELETE_RELATION':
                return this.validateDeleteRelation(command);
            case 'EDIT_MULTIPLICITY':
                return this.validateEditMultiplicity(command);
            default:
                console.log(`✅ Comando ${action} validado (básico)`);
                return command;
        }
    }

    validateCreateClass(command) {
        const className = command.className || command.parametros;
        if (!className || typeof className !== 'string') {
            console.error('❌ CREATE_CLASS: falta className/parametros');
            return null;
        }

        console.log(`✅ CREATE_CLASS validado: ${className}`);
        return {
            action: 'CREATE_CLASS',
            className: className.trim(),
            position: command.position || this.calculateSmartPosition(),
            attributes: command.attributes || [],
            methods: command.methods || []
        };
    }

    validateDeleteClass(command) {
        const deleteClassName = command.className || command.parametros;
        if (!deleteClassName) {
            console.error('❌ DELETE_CLASS: falta className');
            return null;
        }

        console.log(`✅ DELETE_CLASS validado: ${deleteClassName}`);
        return {
            action: 'DELETE_CLASS',
            className: deleteClassName.trim()
        };
    }

    validateRenameClass(command) {
        const oldName = command.oldName || command.parametros?.oldName;
        const newName = command.newName || command.parametros?.newName;
        if (!oldName || !newName) {
            console.error('❌ RENAME_CLASS: falta oldName o newName');
            return null;
        }

        console.log(`✅ RENAME_CLASS validado: ${oldName} -> ${newName}`);
        return {
            action: 'RENAME_CLASS',
            oldName: oldName.trim(),
            newName: newName.trim()
        };
    }

    validateAddAttribute(command) {
        const attrClassName = command.className || command.parametros?.className;
        const attribute = command.attribute || command.parametros?.attribute;
        if (!attrClassName || !attribute) {
            console.error('❌ ADD_ATTRIBUTE: falta className o attribute');
            return null;
        }

        console.log(`✅ ADD_ATTRIBUTE validado: ${JSON.stringify(attribute)} -> ${attrClassName}`);
        return {
            action: 'ADD_ATTRIBUTE',
            className: attrClassName.trim(),
            attribute: this.normalizeAttribute(attribute)
        };
    }

    validateDeleteAttribute(command) {
        const delAttrClassName = command.className || command.parametros?.className;
        const attributeName = command.attributeName || command.parametros?.attributeName;
        if (!delAttrClassName || !attributeName) {
            console.error('❌ DELETE_ATTRIBUTE: falta className o attributeName');
            return null;
        }

        console.log(`✅ DELETE_ATTRIBUTE validado: ${attributeName} de ${delAttrClassName}`);
        return {
            action: 'DELETE_ATTRIBUTE',
            className: delAttrClassName.trim(),
            attributeName: attributeName.trim()
        };
    }

    validateCreateRelation(command) {
        const sourceClass = command.sourceClass || command.parametros?.sourceClass;
        const targetClass = command.targetClass || command.parametros?.targetClass;
        if (!sourceClass || !targetClass) {
            console.error('❌ CREATE_RELATION: falta sourceClass o targetClass');
            return null;
        }

        console.log(`✅ CREATE_RELATION validado: ${sourceClass} -> ${targetClass}`);
        return {
            action: 'CREATE_RELATION',
            sourceClass: sourceClass.trim(),
            targetClass: targetClass.trim(),
            relationType: command.relationType || 'association',
            sourceMultiplicity: command.sourceMultiplicity || '1',
            targetMultiplicity: command.targetMultiplicity || '1',
            relationName: command.relationName || ''
        };
    }

    validateDeleteRelation(command) {
        const delSourceClass = command.sourceClass || command.parametros?.sourceClass;
        const delTargetClass = command.targetClass || command.parametros?.targetClass;
        if (!delSourceClass || !delTargetClass) {
            console.error('❌ DELETE_RELATION: falta sourceClass o targetClass');
            return null;
        }

        console.log(`✅ DELETE_RELATION validado: ${delSourceClass} -> ${delTargetClass}`);
        return {
            action: 'DELETE_RELATION',
            sourceClass: delSourceClass.trim(),
            targetClass: delTargetClass.trim()
        };
    }

    validateEditMultiplicity(command) {
        const multSourceClass = command.sourceClass || command.parametros?.sourceClass;
        const multTargetClass = command.targetClass || command.parametros?.targetClass;
        if (!multSourceClass || !multTargetClass) {
            console.error('❌ EDIT_MULTIPLICITY: falta sourceClass o targetClass');
            return null;
        }

        console.log(`✅ EDIT_MULTIPLICITY validado: ${multSourceClass} -> ${multTargetClass}`);
        return {
            action: 'EDIT_MULTIPLICITY',
            sourceClass: multSourceClass.trim(),
            targetClass: multTargetClass.trim(),
            sourceMultiplicity: command.sourceMultiplicity || '1',
            targetMultiplicity: command.targetMultiplicity || '1'
        };
    }

    // Parser alternativo para texto libre
    tryAlternativeParser(response) {
        console.log('🔄 Intento parser alternativo para editor...');

        const commands = [];

        // Detectar "crear clase" en texto libre
        const createClassMatch = response.match(/crear?\s+(?:una\s+)?clase\s+(\w+)/i);
        if (createClassMatch) {
            commands.push({
                action: 'CREATE_CLASS',
                className: createClassMatch[1],
                position: this.calculateSmartPosition(),
                attributes: [],
                methods: []
            });
        }

        // Detectar "eliminar clase"
        const deleteClassMatch = response.match(/eliminar?\s+(?:la\s+)?clase\s+(\w+)/i);
        if (deleteClassMatch) {
            commands.push({
                action: 'DELETE_CLASS',
                className: deleteClassMatch[1]
            });
        }

        // Detectar "agregar atributo"
        const addAttrMatch = response.match(/agregar?\s+atributo\s+(\w+)(?:\s+a\s+(\w+))?/i);
        if (addAttrMatch) {
            commands.push({
                action: 'ADD_ATTRIBUTE',
                className: addAttrMatch[2] || 'Usuario',
                attribute: {
                    name: addAttrMatch[1],
                    type: 'String',
                    visibility: 'private'
                }
            });
        }

        if (commands.length > 0) {
            console.log('✅ Parser alternativo encontró comandos:', commands);
            return commands;
        }

        console.error('❌ No se pudieron extraer comandos de la respuesta');
        return null;
    }

    // Normalizar atributos
    normalizeAttribute(attribute) {
        if (typeof attribute === 'string') {
            return {
                name: attribute,
                type: 'String',
                visibility: 'private'
            };
        }

        return {
            name: attribute.name || 'newAttribute',
            type: attribute.type || 'String',
            visibility: attribute.visibility || 'private'
        };
    }

    // Calcular posición inteligente para nuevas clases
    calculateSmartPosition() {
        // Posición inteligente - se puede mejorar con acceso al editor
        return {
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 150
        };
    }
}
