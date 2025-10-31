// resources/js/diagram/modules-ai/AICommandExecutor.js
// Ejecuta los comandos y modificaciones propuestos por la IA en el diagrama real

import * as joint from 'jointjs';

export class AICommandExecutor {
    constructor(editor) {
        this.editor = editor;
        this.executionHistory = [];
        this.isExecuting = false;
    }

    // ==================== EJECUCIÓN PRINCIPAL ====================

    async executeChanges(changes) {
        if (this.isExecuting) {
            console.warn('⚠️ Ya hay una ejecución en progreso');
            return;
        }

        this.isExecuting = true;
        console.log(`🚀 Ejecutando ${changes.length} cambios...`);

        const results = {
            successful: [],
            failed: [],
            skipped: []
        };

        try {
            // Ejecutar cambios en orden específico
            const orderedChanges = this.orderChanges(changes);

            for (const change of orderedChanges) {
                try {
                    const result = await this.executeChange(change);
                    if (result.success) {
                        results.successful.push({ change, result });
                    } else {
                        results.failed.push({ change, error: result.error });
                    }
                } catch (error) {
                    console.error(`❌ Error ejecutando cambio:`, error);
                    results.failed.push({ change, error: error.message });
                }

                // Pequeña pausa para animación suave
                await this.sleep(100);
            }

        } finally {
            this.isExecuting = false;
        }

        // Actualizar información del canvas
        this.editor.updateCanvasInfo();

        console.log('📊 Resumen de ejecución:', results);
        return results;
    }

    async executeChange(change) {
        console.log(`🔧 Ejecutando: ${change.description}`);

        switch (change.type) {
            case 'CREATE_CLASS':
                return await this.executeCreateClass(change);
            case 'ADD_ATTRIBUTE':
                return await this.executeAddAttribute(change);
            case 'ADD_METHOD':
                return await this.executeAddMethod(change);
            case 'CREATE_RELATION':
                return await this.executeCreateRelation(change);
            case 'MODIFY_CLASS':
                return await this.executeModifyClass(change);
            default:
                return { success: false, error: `Tipo de cambio no soportado: ${change.type}` };
        }
    }

    // ==================== EJECUTORES ESPECÍFICOS ====================

    async executeCreateClass(change) {
        try {
            // Verificar que no exista ya una clase con ese nombre
            if (this.findElementByClassName(change.className)) {
                return {
                    success: false,
                    error: `Ya existe una clase llamada "${change.className}"`
                };
            }

            // Crear el elemento usando ClassManager
            const element = this.editor.classManager.elementFactory.createClassElement(
                change.className,
                change.attributes || [],
                change.methods || [],
                change.position.x,
                change.position.y,
                'class',
                this.editor.graph // Agregar directamente al graph
            );

            // Aplicar animación de entrada
            this.animateElementEntry(element);

            // Registrar en historial
            this.addToHistory({
                action: 'create_class',
                elementId: element.id,
                data: change
            });

            console.log(`✅ Clase "${change.className}" creada exitosamente`);
            return { success: true, elementId: element.id };

        } catch (error) {
            console.error('❌ Error creando clase:', error);
            return { success: false, error: error.message };
        }
    }

    async executeAddAttribute(change) {
        try {
            const element = change.targetElement || this.findElementByClassName(change.className);

            if (!element) {
                return {
                    success: false,
                    error: `No se encontró la clase "${change.className}"`
                };
            }

            const umlData = element.get('umlData') || {};
            const currentAttributes = umlData.attributes || [];

            // Verificar que el atributo no exista ya
            if (currentAttributes.some(attr => attr.toLowerCase() === change.attribute.toLowerCase())) {
                return {
                    success: false,
                    error: `El atributo "${change.attribute}" ya existe`
                };
            }

            // Agregar el nuevo atributo
            const newAttributes = [...currentAttributes, change.attribute];

            // Actualizar elemento usando ElementFactory
            this.editor.classManager.elementFactory.updateClassElement(
                element,
                umlData.className,
                newAttributes,
                umlData.methods || [],
                umlData.type || 'class',
                umlData.uml25
            );

            // Animación de actualización
            this.animateElementUpdate(element);

            // Registrar en historial
            this.addToHistory({
                action: 'add_attribute',
                elementId: element.id,
                data: { attribute: change.attribute, originalAttributes: currentAttributes }
            });

            console.log(`✅ Atributo "${change.attribute}" agregado a "${change.className}"`);
            return { success: true, elementId: element.id };

        } catch (error) {
            console.error('❌ Error agregando atributo:', error);
            return { success: false, error: error.message };
        }
    }

    async executeAddMethod(change) {
        try {
            const element = change.targetElement || this.findElementByClassName(change.className);

            if (!element) {
                return {
                    success: false,
                    error: `No se encontró la clase "${change.className}"`
                };
            }

            const umlData = element.get('umlData') || {};
            const currentMethods = umlData.methods || [];

            // Verificar que el método no exista ya
            if (currentMethods.some(method => method.toLowerCase() === change.method.toLowerCase())) {
                return {
                    success: false,
                    error: `El método "${change.method}" ya existe`
                };
            }

            // Agregar el nuevo método
            const newMethods = [...currentMethods, change.method];

            // Actualizar elemento
            this.editor.classManager.elementFactory.updateClassElement(
                element,
                umlData.className,
                umlData.attributes || [],
                newMethods,
                umlData.type || 'class',
                umlData.uml25
            );

            // Animación de actualización
            this.animateElementUpdate(element);

            // Registrar en historial
            this.addToHistory({
                action: 'add_method',
                elementId: element.id,
                data: { method: change.method, originalMethods: currentMethods }
            });

            console.log(`✅ Método "${change.method}" agregado a "${change.className}"`);
            return { success: true, elementId: element.id };

        } catch (error) {
            console.error('❌ Error agregando método:', error);
            return { success: false, error: error.message };
        }
    }

    async executeCreateRelation(change) {
        try {
            const sourceElement = change.sourceElement || this.findElementByClassName(change.sourceClass);
            const targetElement = change.targetElement || this.findElementByClassName(change.targetClass);

            if (!sourceElement || !targetElement) {
                return {
                    success: false,
                    error: `No se encontraron las clases "${change.sourceClass}" o "${change.targetClass}"`
                };
            }

            // Verificar que no exista ya una relación similar
            if (this.relationshipExists(sourceElement, targetElement, change.relationType)) {
                return {
                    success: false,
                    error: `Ya existe una relación ${change.relationType} entre estas clases`
                };
            }

            // Crear relación usando RelationshipManager
            const relationship = this.createRelationshipDirect(
                sourceElement,
                targetElement,
                change.relationType,
                change.multiplicity
            );

            if (relationship) {
                // Animación de entrada para relación
                this.animateRelationEntry(relationship);

                // Registrar en historial
                this.addToHistory({
                    action: 'create_relation',
                    relationId: relationship.id,
                    data: change
                });

                console.log(`✅ Relación ${change.relationType} creada entre "${change.sourceClass}" y "${change.targetClass}"`);
                return { success: true, relationId: relationship.id };
            } else {
                return { success: false, error: 'No se pudo crear la relación' };
            }

        } catch (error) {
            console.error('❌ Error creando relación:', error);
            return { success: false, error: error.message };
        }
    }

    async executeModifyClass(change) {
        try {
            const element = change.targetElement || this.findElementByClassName(change.className);

            if (!element) {
                return {
                    success: false,
                    error: `No se encontró la clase "${change.className}"`
                };
            }

            // Por ahora, las modificaciones genéricas solo animan el elemento
            // En el futuro se pueden implementar modificaciones específicas
            this.animateElementUpdate(element);

            // Registrar en historial
            this.addToHistory({
                action: 'modify_class',
                elementId: element.id,
                data: change
            });

            console.log(`✅ Clase "${change.className}" modificada`);
            return { success: true, elementId: element.id };

        } catch (error) {
            console.error('❌ Error modificando clase:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== CREACIÓN DIRECTA DE RELACIONES ====================

    createRelationshipDirect(sourceElement, targetElement, type, multiplicity) {
        // Crear relación usando joint.js directamente
        const link = new joint.shapes.standard.Link({
            source: { id: sourceElement.id },
            target: { id: targetElement.id }
        });

        // Configurar tipo de relación
        this.configureRelationshipType(link, type);

        // Configurar multiplicidad si se proporciona
        if (multiplicity) {
            this.configureMultiplicity(link, multiplicity);
        }

        // Agregar al graph
        this.editor.graph.addCell(link);

        // Almacenar datos de la relación
        link.set('linkData', {
            type: type,
            sourceMultiplicity: this.extractSourceMultiplicity(multiplicity),
            targetMultiplicity: this.extractTargetMultiplicity(multiplicity),
            name: ''
        });

        return link;
    }

    configureRelationshipType(link, type) {
        const configs = {
            association: {
                attrs: {
                    line: { stroke: '#1e40af', strokeWidth: 2 }
                }
            },
            inheritance: {
                attrs: {
                    line: { stroke: '#1e40af', strokeWidth: 2 },
                    'marker-target': {
                        type: 'polygon',
                        points: '0,0 10,5 0,10',
                        fill: 'white',
                        stroke: '#1e40af',
                        strokeWidth: 2
                    }
                }
            },
            composition: {
                attrs: {
                    line: { stroke: '#1e40af', strokeWidth: 2 },
                    'marker-source': {
                        type: 'polygon',
                        points: '0,5 5,0 10,5 5,10',
                        fill: '#1e40af',
                        stroke: '#1e40af'
                    }
                }
            },
            aggregation: {
                attrs: {
                    line: { stroke: '#1e40af', strokeWidth: 2 },
                    'marker-source': {
                        type: 'polygon',
                        points: '0,5 5,0 10,5 5,10',
                        fill: 'white',
                        stroke: '#1e40af',
                        strokeWidth: 2
                    }
                }
            }
        };

        const config = configs[type] || configs.association;
        link.attr(config.attrs);
    }

    configureMultiplicity(link, multiplicity) {
        // Parsear multiplicidad (ej: "1:*", "1..1:0..*")
        const parts = multiplicity.split(':');
        if (parts.length === 2) {
            link.label(0, { position: 0.2, attrs: { text: { text: parts[0] } } });
            link.label(1, { position: 0.8, attrs: { text: { text: parts[1] } } });
        }
    }

    extractSourceMultiplicity(multiplicity) {
        if (!multiplicity) return '';
        const parts = multiplicity.split(':');
        return parts[0] || '';
    }

    extractTargetMultiplicity(multiplicity) {
        if (!multiplicity) return '';
        const parts = multiplicity.split(':');
        return parts[1] || '';
    }

    // ==================== UTILIDADES ====================

    orderChanges(changes) {
        // Ordenar cambios para ejecutar en orden lógico:
        // 1. Crear clases primero
        // 2. Agregar atributos y métodos
        // 3. Crear relaciones al final
        const order = {
            'CREATE_CLASS': 1,
            'MODIFY_CLASS': 2,
            'ADD_ATTRIBUTE': 3,
            'ADD_METHOD': 4,
            'CREATE_RELATION': 5
        };

        return changes.sort((a, b) => {
            return (order[a.type] || 99) - (order[b.type] || 99);
        });
    }

    findElementByClassName(className) {
        const elements = this.editor.graph.getElements();
        return elements.find(element => {
            const umlData = element.get('umlData');
            return umlData?.className?.toLowerCase() === className?.toLowerCase();
        });
    }

    relationshipExists(sourceElement, targetElement, type) {
        const links = this.editor.graph.getLinks();
        return links.some(link => {
            const linkData = link.get('linkData') || {};
            return link.getSourceElement()?.id === sourceElement.id &&
                   link.getTargetElement()?.id === targetElement.id &&
                   linkData.type === type;
        });
    }

    // ==================== ANIMACIONES ====================

    animateElementEntry(element) {
        if (!element) return;

        // Animación de entrada con escala
        element.attr('body/transform', 'scale(0.8)');
        element.attr('body/opacity', 0.5);

        setTimeout(() => {
            element.transition('attrs/body/transform', 'scale(1)', {
                duration: 300,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
            element.transition('attrs/body/opacity', 1, {
                duration: 300,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
        }, 50);
    }

    animateElementUpdate(element) {
        if (!element) return;

        // Pulso de actualización
        const originalStroke = element.attr('body/stroke');
        const originalStrokeWidth = element.attr('body/strokeWidth');

        element.attr('body/stroke', '#10b981');
        element.attr('body/strokeWidth', 3);

        setTimeout(() => {
            element.transition('attrs/body/stroke', originalStroke || '#1e40af', {
                duration: 500,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
            element.transition('attrs/body/strokeWidth', originalStrokeWidth || 2, {
                duration: 500,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
        }, 200);
    }

    animateRelationEntry(relation) {
        if (!relation) return;

        // Animación de línea dibujándose
        const originalStrokeWidth = relation.attr('line/strokeWidth');

        relation.attr('line/strokeWidth', 0);

        setTimeout(() => {
            relation.transition('attrs/line/strokeWidth', originalStrokeWidth || 2, {
                duration: 400,
                timingFunction: (t) => 1 - Math.pow(1 - t, 3) // easeOut
            });
        }, 50);
    }

    // ==================== HISTORIAL Y DESHACER ====================

    addToHistory(action) {
        this.executionHistory.push({
            ...action,
            timestamp: Date.now()
        });

        // Limitar historial a 50 acciones
        if (this.executionHistory.length > 50) {
            this.executionHistory.shift();
        }
    }

    getExecutionHistory() {
        return [...this.executionHistory];
    }

    async undoLastChange() {
        const lastAction = this.executionHistory.pop();
        if (!lastAction) {
            console.log('⚠️ No hay acciones para deshacer');
            return false;
        }

        try {
            switch (lastAction.action) {
                case 'create_class':
                    const element = this.editor.graph.getCell(lastAction.elementId);
                    if (element) element.remove();
                    break;

                case 'add_attribute':
                    const attrElement = this.editor.graph.getCell(lastAction.elementId);
                    if (attrElement) {
                        const umlData = attrElement.get('umlData') || {};
                        this.editor.classManager.elementFactory.updateClassElement(
                            attrElement,
                            umlData.className,
                            lastAction.data.originalAttributes,
                            umlData.methods || [],
                            umlData.type || 'class',
                            umlData.uml25
                        );
                    }
                    break;

                case 'add_method':
                    const methodElement = this.editor.graph.getCell(lastAction.elementId);
                    if (methodElement) {
                        const umlData = methodElement.get('umlData') || {};
                        this.editor.classManager.elementFactory.updateClassElement(
                            methodElement,
                            umlData.className,
                            umlData.attributes || [],
                            lastAction.data.originalMethods,
                            umlData.type || 'class',
                            umlData.uml25
                        );
                    }
                    break;

                case 'create_relation':
                    const relation = this.editor.graph.getCell(lastAction.relationId);
                    if (relation) relation.remove();
                    break;
            }

            console.log(`↩️ Acción deshecha: ${lastAction.action}`);
            this.editor.updateCanvasInfo();
            return true;

        } catch (error) {
            console.error('❌ Error deshaciendo acción:', error);
            // Restaurar en historial si falló
            this.executionHistory.push(lastAction);
            return false;
        }
    }

    clearHistory() {
        this.executionHistory = [];
        console.log('🧹 Historial de ejecución limpiado');
    }

    // ==================== UTILIDADES GENERALES ====================

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validar que los elementos existan antes de ejecutar
    validateChangeExecution(change) {
        switch (change.type) {
            case 'ADD_ATTRIBUTE':
            case 'ADD_METHOD':
            case 'MODIFY_CLASS':
                return this.findElementByClassName(change.className) !== null;

            case 'CREATE_RELATION':
                return this.findElementByClassName(change.sourceClass) !== null &&
                       this.findElementByClassName(change.targetClass) !== null;

            case 'CREATE_CLASS':
                return !this.findElementByClassName(change.className); // No debe existir

            default:
                return false;
        }
    }

    // Estadísticas de ejecución
    getExecutionStats() {
        const stats = {
            totalExecutions: this.executionHistory.length,
            byType: {},
            recentExecutions: this.executionHistory.slice(-10)
        };

        this.executionHistory.forEach(action => {
            stats.byType[action.action] = (stats.byType[action.action] || 0) + 1;
        });

        return stats;
    }

    // ==================== NUEVOS MÉTODOS PARA EL EDITOR IA ====================

    async executeCommand(command) {
        console.log(`🔧 Ejecutando comando: ${command.action}`);

        switch (command.action) {
            case 'CREATE_CLASS':
                return await this.executeCreateClassCommand(command);
            case 'DELETE_CLASS':
                return await this.executeDeleteClass(command);
            case 'RENAME_CLASS':
                return await this.executeRenameClass(command);
            case 'MOVE_CLASS':
                return await this.executeMoveClass(command);
            case 'ADD_ATTRIBUTE':
                return await this.executeAddAttributeCommand(command);
            case 'EDIT_ATTRIBUTE':
                return await this.executeEditAttribute(command);
            case 'DELETE_ATTRIBUTE':
                return await this.executeDeleteAttribute(command);
            case 'CREATE_RELATION':
                return await this.executeCreateRelationCommand(command);
            case 'EDIT_RELATION':
                return await this.executeEditRelation(command);
            case 'DELETE_RELATION':
                return await this.executeDeleteRelation(command);
            case 'EDIT_MULTIPLICITY':
                return await this.executeEditMultiplicity(command);
            case 'SET_RELATION_NAME':
                return await this.executeSetRelationName(command);
            default:
                throw new Error(`Comando no soportado: ${command.action}`);
        }
    }

    // ==================== COMANDOS DE CLASES ====================

    async executeCreateClassCommand(command) {
        try {
            if (this.findElementByClassName(command.className)) {
                throw new Error(`Ya existe una clase llamada "${command.className}"`);
            }

            const position = command.position || { x: 100, y: 100 };
            const attributes = command.attributes || [];
            const methods = command.methods || [];

            const element = this.editor.classManager.elementFactory.createClassElement(
                command.className,
                attributes,
                methods,
                position.x,
                position.y,
                'class',
                this.editor.graph
            );

            this.animateElementEntry(element);
            console.log(`✅ Clase "${command.className}" creada`);
            return { success: true, elementId: element.id };

        } catch (error) {
            console.error('❌ Error creando clase:', error);
            throw error;
        }
    }

    async executeDeleteClass(command) {
        try {
            const element = this.findElementByClassName(command.className);
            if (!element) {
                throw new Error(`No se encontró la clase "${command.className}"`);
            }

            // Eliminar relaciones asociadas
            const links = this.editor.graph.getLinks();
            links.forEach(link => {
                if (link.getSourceElement()?.id === element.id ||
                    link.getTargetElement()?.id === element.id) {
                    link.remove();
                }
            });

            element.remove();
            console.log(`✅ Clase "${command.className}" eliminada`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error eliminando clase:', error);
            throw error;
        }
    }

    async executeRenameClass(command) {
        try {
            const element = this.findElementByClassName(command.oldName);
            if (!element) {
                throw new Error(`No se encontró la clase "${command.oldName}"`);
            }

            if (this.findElementByClassName(command.newName)) {
                throw new Error(`Ya existe una clase llamada "${command.newName}"`);
            }

            const umlData = element.get('umlData') || {};
            this.editor.classManager.elementFactory.updateClassElement(
                element,
                command.newName,
                umlData.attributes || [],
                umlData.methods || [],
                umlData.type || 'class',
                umlData.uml25
            );

            this.animateElementUpdate(element);
            console.log(`✅ Clase renombrada de "${command.oldName}" a "${command.newName}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error renombrando clase:', error);
            throw error;
        }
    }

    async executeMoveClass(command) {
        try {
            const element = this.findElementByClassName(command.className);
            if (!element) {
                throw new Error(`No se encontró la clase "${command.className}"`);
            }

            element.position(command.position.x, command.position.y);
            this.animateElementUpdate(element);
            console.log(`✅ Clase "${command.className}" movida a (${command.position.x}, ${command.position.y})`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error moviendo clase:', error);
            throw error;
        }
    }

    // ==================== COMANDOS DE ATRIBUTOS ====================

    async executeAddAttributeCommand(command) {
        try {
            const element = this.findElementByClassName(command.className);
            if (!element) {
                throw new Error(`No se encontró la clase "${command.className}"`);
            }

            const umlData = element.get('umlData') || {};
            const currentAttributes = umlData.attributes || [];

            // Formatear atributo
            const attribute = this.formatAttribute(command.attribute);

            // Verificar que no exista
            if (currentAttributes.some(attr => attr.toLowerCase().includes(attribute.name.toLowerCase()))) {
                throw new Error(`El atributo "${attribute.name}" ya existe`);
            }

            const newAttributes = [...currentAttributes, attribute.formatted];

            this.editor.classManager.elementFactory.updateClassElement(
                element,
                umlData.className,
                newAttributes,
                umlData.methods || [],
                umlData.type || 'class',
                umlData.uml25
            );

            this.animateElementUpdate(element);
            console.log(`✅ Atributo "${attribute.formatted}" agregado a "${command.className}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error agregando atributo:', error);
            throw error;
        }
    }

    async executeEditAttribute(command) {
        try {
            const element = this.findElementByClassName(command.className);
            if (!element) {
                throw new Error(`No se encontró la clase "${command.className}"`);
            }

            const umlData = element.get('umlData') || {};
            const currentAttributes = umlData.attributes || [];

            // Encontrar y reemplazar atributo
            const attributeIndex = currentAttributes.findIndex(attr =>
                attr.toLowerCase().includes(command.oldAttribute.name.toLowerCase())
            );

            if (attributeIndex === -1) {
                throw new Error(`No se encontró el atributo "${command.oldAttribute.name}"`);
            }

            const newAttribute = this.formatAttribute(command.newAttribute);
            const newAttributes = [...currentAttributes];
            newAttributes[attributeIndex] = newAttribute.formatted;

            this.editor.classManager.elementFactory.updateClassElement(
                element,
                umlData.className,
                newAttributes,
                umlData.methods || [],
                umlData.type || 'class',
                umlData.uml25
            );

            this.animateElementUpdate(element);
            console.log(`✅ Atributo editado en "${command.className}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error editando atributo:', error);
            throw error;
        }
    }

    async executeDeleteAttribute(command) {
        try {
            const element = this.findElementByClassName(command.className);
            if (!element) {
                throw new Error(`No se encontró la clase "${command.className}"`);
            }

            const umlData = element.get('umlData') || {};
            const currentAttributes = umlData.attributes || [];

            const newAttributes = currentAttributes.filter(attr =>
                !attr.toLowerCase().includes(command.attributeName.toLowerCase())
            );

            this.editor.classManager.elementFactory.updateClassElement(
                element,
                umlData.className,
                newAttributes,
                umlData.methods || [],
                umlData.type || 'class',
                umlData.uml25
            );

            this.animateElementUpdate(element);
            console.log(`✅ Atributo "${command.attributeName}" eliminado de "${command.className}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error eliminando atributo:', error);
            throw error;
        }
    }

    // ==================== COMANDOS DE RELACIONES ====================

    async executeCreateRelationCommand(command) {
        try {
            const sourceElement = this.findElementByClassName(command.sourceClass);
            const targetElement = this.findElementByClassName(command.targetClass);

            if (!sourceElement || !targetElement) {
                throw new Error(`No se encontraron las clases "${command.sourceClass}" o "${command.targetClass}"`);
            }

            // Crear relación con multiplicidad
            const relationship = this.createRelationshipWithMultiplicity(
                sourceElement,
                targetElement,
                command.relationType || 'association',
                command.sourceMultiplicity || '1',
                command.targetMultiplicity || '1',
                command.relationName || ''
            );

            this.animateRelationEntry(relationship);
            console.log(`✅ Relación creada entre "${command.sourceClass}" y "${command.targetClass}"`);
            return { success: true, relationId: relationship.id };

        } catch (error) {
            console.error('❌ Error creando relación:', error);
            throw error;
        }
    }

    async executeEditRelation(command) {
        try {
            const relation = this.findRelation(command.sourceClass, command.targetClass);
            if (!relation) {
                throw new Error(`No se encontró relación entre "${command.sourceClass}" y "${command.targetClass}"`);
            }

            const modifications = command.modifications || {};

            // Actualizar multiplicidad
            if (modifications.sourceMultiplicity) {
                this.setRelationMultiplicity(relation, 'source', modifications.sourceMultiplicity);
            }
            if (modifications.targetMultiplicity) {
                this.setRelationMultiplicity(relation, 'target', modifications.targetMultiplicity);
            }

            // Actualizar nombre
            if (modifications.relationName !== undefined) {
                this.setRelationNameDirect(relation, modifications.relationName);
            }

            // Actualizar tipo
            if (modifications.relationType) {
                this.configureRelationshipType(relation, modifications.relationType);
            }

            // Actualizar datos almacenados
            const linkData = relation.get('linkData') || {};
            relation.set('linkData', {
                ...linkData,
                ...modifications
            });

            console.log(`✅ Relación editada entre "${command.sourceClass}" y "${command.targetClass}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error editando relación:', error);
            throw error;
        }
    }

    async executeDeleteRelation(command) {
        try {
            const relation = this.findRelation(command.sourceClass, command.targetClass);
            if (!relation) {
                throw new Error(`No se encontró relación entre "${command.sourceClass}" y "${command.targetClass}"`);
            }

            relation.remove();
            console.log(`✅ Relación eliminada entre "${command.sourceClass}" y "${command.targetClass}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error eliminando relación:', error);
            throw error;
        }
    }

    async executeEditMultiplicity(command) {
        try {
            const relation = this.findRelation(command.sourceClass, command.targetClass);
            if (!relation) {
                throw new Error(`No se encontró relación entre "${command.sourceClass}" y "${command.targetClass}"`);
            }

            this.setRelationMultiplicity(relation, 'source', command.sourceMultiplicity);
            this.setRelationMultiplicity(relation, 'target', command.targetMultiplicity);

            console.log(`✅ Multiplicidad actualizada: ${command.sourceMultiplicity} → ${command.targetMultiplicity}`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error editando multiplicidad:', error);
            throw error;
        }
    }

    async executeSetRelationName(command) {
        try {
            const relation = this.findRelation(command.sourceClass, command.targetClass);
            if (!relation) {
                throw new Error(`No se encontró relación entre "${command.sourceClass}" y "${command.targetClass}"`);
            }

            this.setRelationNameDirect(relation, command.relationName);
            console.log(`✅ Nombre de relación establecido: "${command.relationName}"`);
            return { success: true };

        } catch (error) {
            console.error('❌ Error estableciendo nombre de relación:', error);
            throw error;
        }
    }

    // ==================== MÉTODOS AUXILIARES NUEVOS ====================

    createRelationshipWithMultiplicity(sourceElement, targetElement, type, sourceMultiplicity, targetMultiplicity, relationName) {
        // Usar el RelationshipManager para crear la relación correctamente
        if (this.editor.relationshipManager) {
            const relationship = this.editor.relationshipManager.createRelationshipFromConfig(
                type,
                sourceElement,
                targetElement,
                {
                    sourceMultiplicity: sourceMultiplicity || '',
                    targetMultiplicity: targetMultiplicity || '',
                    name: relationName || '',
                    sourceAnchor: 'auto',
                    targetAnchor: 'auto'
                }
            );

            if (relationship) {
                console.log(`✅ Relación ${type} creada usando RelationshipManager`);
                return relationship;
            } else {
                console.warn(`⚠️ RelationshipManager no devolvió el objeto de relación para tipo: ${type}`);
                // Continuar con el fallback
            }
        }

        // Fallback: crear directamente si no hay RelationshipManager o si falló
        console.log(`🔄 Usando método de creación directa para relación ${type}`);
        const link = new joint.shapes.standard.Link({
            source: { id: sourceElement.id },
            target: { id: targetElement.id }
        });

        // Configurar tipo
        this.configureRelationshipType(link, type);

        // Configurar multiplicidad
        this.setRelationMultiplicity(link, 'source', sourceMultiplicity);
        this.setRelationMultiplicity(link, 'target', targetMultiplicity);

        // Configurar nombre si se proporciona
        if (relationName) {
            this.setRelationNameDirect(link, relationName);
        }

        // Agregar al graph
        this.editor.graph.addCell(link);

        // Almacenar datos
        link.set('linkData', {
            type: type,
            sourceMultiplicity: sourceMultiplicity,
            targetMultiplicity: targetMultiplicity,
            name: relationName
        });

        console.log(`✅ Relación ${type} creada directamente (fallback)`);
        return link;
    }

    setRelationMultiplicity(relation, side, multiplicity) {
        const position = side === 'source' ? 0.2 : 0.8;
        const labelIndex = side === 'source' ? 0 : 1;

        // Remover label existente si existe
        const labels = relation.get('labels') || [];
        const filteredLabels = labels.filter((label, index) => index !== labelIndex);

        // Agregar nueva label
        if (multiplicity && multiplicity !== '') {
            filteredLabels.splice(labelIndex, 0, {
                position: position,
                attrs: {
                    text: {
                        text: multiplicity,
                        fontSize: 12,
                        fontFamily: 'Arial',
                        fill: '#333333'
                    }
                }
            });
        }

        relation.set('labels', filteredLabels);

        // Actualizar datos almacenados
        const linkData = relation.get('linkData') || {};
        linkData[`${side}Multiplicity`] = multiplicity;
        relation.set('linkData', linkData);
    }

    setRelationNameDirect(relation, name) {
        if (name && name !== '') {
            relation.appendLabel({
                position: 0.5,
                attrs: {
                    text: {
                        text: name,
                        fontSize: 12,
                        fontFamily: 'Arial',
                        fill: '#1e40af',
                        fontWeight: 'bold'
                    }
                }
            });
        }

        // Actualizar datos almacenados
        const linkData = relation.get('linkData') || {};
        linkData.name = name;
        relation.set('linkData', linkData);
    }

    findRelation(sourceClassName, targetClassName) {
        const sourceElement = this.findElementByClassName(sourceClassName);
        const targetElement = this.findElementByClassName(targetClassName);

        if (!sourceElement || !targetElement) return null;

        const links = this.editor.graph.getLinks();
        return links.find(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();
            return (source?.id === sourceElement.id && target?.id === targetElement.id) ||
                   (source?.id === targetElement.id && target?.id === sourceElement.id);
        });
    }

    formatAttribute(attribute) {
        if (typeof attribute === 'string') {
            return {
                name: attribute,
                formatted: `- ${attribute}: String`
            };
        }

        const visibility = this.getVisibilitySymbol(attribute.visibility || 'private');
        const name = attribute.name || 'newAttribute';
        const type = attribute.type || 'String';

        return {
            name: name,
            formatted: `${visibility} ${name}: ${type}`
        };
    }

    getVisibilitySymbol(visibility) {
        const symbols = {
            'public': '+',
            'private': '-',
            'protected': '#',
            'package': '~'
        };
        return symbols[visibility] || '-';
    }

    parseMultiplicity(multiplicityString) {
        if (!multiplicityString) return { min: 1, max: 1 };

        if (multiplicityString === '*' || multiplicityString === '0..*') {
            return { min: 0, max: '*' };
        }

        if (multiplicityString === '1..*') {
            return { min: 1, max: '*' };
        }

        if (multiplicityString.includes('..')) {
            const parts = multiplicityString.split('..');
            return { min: parseInt(parts[0]) || 0, max: parts[1] === '*' ? '*' : parseInt(parts[1]) };
        }

        const num = parseInt(multiplicityString);
        return { min: num, max: num };
    }
}
