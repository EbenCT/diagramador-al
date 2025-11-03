// resources/js/diagram/utils/simpleXMIImport.js
// Importador de diagramas UML desde archivos XML/XMI

export class SimpleXMIImporter {
    constructor(editor) {
        this.editor = editor;
        this.graph = editor.graph;
        this.paper = editor.paper;
        this.classManager = editor.classManager;
        this.relationshipManager = editor.relationshipManager;

        // Mapas para mantener referencia de elementos creados
        this.classMap = new Map(); // xmi.id -> elemento JointJS
        this.relationshipMap = new Map();

        // Contadores para posicionamiento
        this.classPositionX = 100;
        this.classPositionY = 100;
        this.classSpacingX = 280;
        this.classSpacingY = 200;
        this.maxClassesPerRow = 4;
        this.classCount = 0;

        console.log('🔄 SimpleXMIImporter inicializado');
    }

    // ==================== MÉTODO PRINCIPAL DE IMPORTACIÓN ====================

    async importFromXML(xmlContent) {
        try {
            console.log('📁 Iniciando importación de XML/XMI...');

            // Limpiar el diagrama actual
            this.clearDiagram();

            // Parsear el XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Verificar si hay errores de parsing
            if (xmlDoc.documentElement.nodeName === 'parsererror') {
                throw new Error('Error al parsear el archivo XML');
            }

            // Extraer clases y relaciones
            const classes = this.extractClassesFromXML(xmlDoc);
            const relationships = this.extractRelationshipsFromXML(xmlDoc);

            console.log(`📊 Clases encontradas: ${classes.length}`);
            console.log(`🔗 Relaciones encontradas: ${relationships.length}`);

            // Crear clases primero
            await this.createClassesInDiagram(classes);

            // Crear relaciones después
            await this.createRelationshipsInDiagram(relationships);

            // Ajustar vista
            this.adjustDiagramView();

            console.log('✅ Importación completada exitosamente');

            return {
                success: true,
                classesCreated: classes.length,
                relationshipsCreated: relationships.length,
                message: `Diagrama importado: ${classes.length} clases y ${relationships.length} relaciones`
            };

        } catch (error) {
            console.error('❌ Error en importación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== EXTRACCIÓN DE CLASES ====================

    extractClassesFromXML(xmlDoc) {
        const classes = [];

        // Buscar clases UML (múltiples formatos soportados)
        const classSelectors = [
            'UML\\:Class',                               // Formato EA estándar
            'Class',                                     // Formato simplificado
            'uml\\:Class',                              // Formato UML 2.x
            'packagedElement[xmi\\:type="uml:Class"]',  // Formato XMI 2.0
            'packagedElement[type="uml:Class"]'         // Variante adicional
        ];

        classSelectors.forEach(selector => {
            try {
                const classElements = xmlDoc.querySelectorAll(selector);
                console.log(`🔍 Selector "${selector}" encontró ${classElements.length} elementos`);

                classElements.forEach(classElement => {
                    const classInfo = this.parseClassElement(classElement);
                    if (classInfo) {
                        classes.push(classInfo);
                        console.log(`✅ Clase procesada: ${classInfo.name}`);
                    }
                });
            } catch (error) {
                console.warn(`⚠️ Error con selector "${selector}":`, error);
            }
        });

        return classes;
    }    parseClassElement(classElement) {
        try {
            // Extraer información básica
            const xmiId = classElement.getAttribute('xmi.id') || classElement.getAttribute('xmi:id');
            const name = classElement.getAttribute('name');
            const visibility = classElement.getAttribute('visibility') || 'public';
            const isAbstract = classElement.getAttribute('isAbstract') === 'true';

            if (!name || !xmiId) {
                return null; // Clase sin nombre o ID válido
            }

            // Extraer atributos
            const attributes = this.extractClassAttributes(classElement);

            // Extraer métodos/operaciones
            const methods = this.extractClassMethods(classElement);

            // Determinar tipo de clase
            let classType = 'class';
            if (isAbstract) {
                classType = 'abstract';
            }

            // Buscar si es interface
            const stereotype = this.extractStereotype(classElement);
            if (stereotype && stereotype.toLowerCase().includes('interface')) {
                classType = 'interface';
            }

            console.log(`📝 Clase encontrada: ${name} (${classType})`);

            return {
                xmiId: xmiId,
                name: name,
                type: classType,
                visibility: visibility,
                isAbstract: isAbstract,
                attributes: attributes,
                methods: methods,
                stereotype: stereotype
            };

        } catch (error) {
            console.warn('⚠️ Error procesando clase:', error);
            return null;
        }
    }

    extractClassAttributes(classElement) {
        const attributes = [];

        // Buscar elementos Attribute en múltiples formatos
        const attributeSelectors = [
            'UML\\:Attribute',
            'Attribute',
            'uml\\:Attribute',
            'ownedAttribute',    // XMI 2.0
            'UML\\:Classifier\\.feature > UML\\:Attribute'
        ];

        attributeSelectors.forEach(selector => {
            const attributeElements = classElement.querySelectorAll(selector);

            attributeElements.forEach(attrElement => {
                const name = attrElement.getAttribute('name');
                const visibility = attrElement.getAttribute('visibility') || 'private';

                if (name) {
                    // Extraer tipo si está disponible
                    let type = 'String'; // Tipo por defecto

                    // Intentar diferentes formas de encontrar el tipo
                    const typeElement = attrElement.querySelector('type, UML\\:StructuralFeature\\.type, StructuralFeature\\.type');
                    if (typeElement) {
                        const href = typeElement.getAttribute('href');
                        if (href) {
                            type = this.resolveTypeReference(href);
                        } else {
                            const classifier = typeElement.querySelector('UML\\:Classifier, Classifier');
                            if (classifier && classifier.getAttribute('xmi.idref')) {
                                type = this.resolveTypeReference(classifier.getAttribute('xmi.idref'));
                            }
                        }
                    }

                    // Formatear según visibilidad UML
                    const visibilitySymbol = this.getVisibilitySymbol(visibility);
                    const formattedAttribute = `${visibilitySymbol} ${name}: ${type}`;

                    attributes.push(formattedAttribute);
                    console.log(`   📝 Atributo encontrado: ${formattedAttribute}`);
                }
            });
        });

        return attributes;
    }

    extractClassMethods(classElement) {
        const methods = [];

        // Buscar elementos Operation en múltiples formatos
        const operationSelectors = [
            'UML\\:Operation',
            'Operation',
            'uml\\:Operation',
            'ownedOperation',    // XMI 2.0
            'UML\\:Classifier\\.feature > UML\\:Operation'
        ];

        operationSelectors.forEach(selector => {
            const operationElements = classElement.querySelectorAll(selector);

            operationElements.forEach(opElement => {
                const name = opElement.getAttribute('name');
                const visibility = opElement.getAttribute('visibility') || 'public';

                if (name) {
                    // Extraer parámetros si están disponibles
                    const parameters = this.extractMethodParameters(opElement);

                    // Formatear método
                    const visibilitySymbol = this.getVisibilitySymbol(visibility);
                    const paramStr = parameters.length > 0 ? parameters.join(', ') : '';
                    const formattedMethod = `${visibilitySymbol} ${name}(${paramStr}): void`;

                    methods.push(formattedMethod);
                    console.log(`   🔧 Método encontrado: ${formattedMethod}`);
                }
            });
        });

        return methods;
    }

    extractMethodParameters(operationElement) {
        const parameters = [];

        const paramElements = operationElement.querySelectorAll('UML\\:Parameter, Parameter, uml\\:Parameter');

        paramElements.forEach(paramElement => {
            const name = paramElement.getAttribute('name');
            const kind = paramElement.getAttribute('kind');

            // Filtrar parámetros de retorno
            if (name && kind !== 'return') {
                parameters.push(`${name}: String`); // Tipo simplificado
            }
        });

        return parameters;
    }

    // ==================== EXTRACCIÓN DE RELACIONES ====================

    extractRelationshipsFromXML(xmlDoc) {
        const relationships = [];

        // Buscar asociaciones en múltiples formatos
        const associationSelectors = [
            'UML\\:Association',
            'Association',
            'uml\\:Association',
            'packagedElement[xmi\\:type="uml:Association"]'
        ];

        associationSelectors.forEach(selector => {
            const associations = xmlDoc.querySelectorAll(selector);
            console.log(`🔍 Asociaciones con selector "${selector}": ${associations.length}`);

            associations.forEach(assoc => {
                const rel = this.parseAssociation(assoc, xmlDoc);
                if (rel) {
                    relationships.push(rel);
                    console.log(`✅ Relación procesada: ${rel.sourceClass} -> ${rel.targetClass} (${rel.type})`);
                }
            });
        });

        // Buscar generalizaciones (herencia)
        const generalizationSelectors = [
            'UML\\:Generalization',
            'Generalization',
            'uml\\:Generalization'
        ];

        generalizationSelectors.forEach(selector => {
            const generalizations = xmlDoc.querySelectorAll(selector);
            console.log(`🔍 Generalizaciones con selector "${selector}": ${generalizations.length}`);

            generalizations.forEach(gen => {
                const rel = this.parseGeneralization(gen);
                if (rel) {
                    relationships.push(rel);
                    console.log(`✅ Herencia procesada: ${rel.sourceClass} -> ${rel.targetClass}`);
                }
            });
        });

        return relationships;
    }

    parseAssociation(assocElement, xmlDoc) {
        try {
            const xmiId = assocElement.getAttribute('xmi.id') || assocElement.getAttribute('xmi:id');
            const name = assocElement.getAttribute('name') || '';

            // Buscar extremos de la asociación en múltiples formatos
            let associationEnds = assocElement.querySelectorAll('UML\\:AssociationEnd, AssociationEnd, uml\\:AssociationEnd');

            // Si no encuentra, buscar memberEnd (XMI 2.0)
            if (associationEnds.length === 0) {
                const memberEnds = assocElement.querySelectorAll('memberEnd');
                if (memberEnds.length >= 2) {
                    // Buscar los Property correspondientes en el documento
                    const sourceRef = memberEnds[0].getAttribute('xmi:idref');
                    const targetRef = memberEnds[1].getAttribute('xmi:idref');

                    const sourceProperty = xmlDoc.querySelector(`uml\\:Property[xmi\\:id="${sourceRef}"], Property[xmi\\:id="${sourceRef}"]`);
                    const targetProperty = xmlDoc.querySelector(`uml\\:Property[xmi\\:id="${targetRef}"], Property[xmi\\:id="${targetRef}"]`);

                    if (sourceProperty && targetProperty) {
                        const sourceType = sourceProperty.getAttribute('type');
                        const targetType = targetProperty.getAttribute('type');
                        const sourceMultiplicity = sourceProperty.getAttribute('multiplicity') || '1';
                        const targetMultiplicity = targetProperty.getAttribute('multiplicity') || '1';

                        console.log(`🔗 Asociación XMI 2.0 encontrada: ${sourceType} -> ${targetType}`);

                        return {
                            xmiId: xmiId,
                            type: 'association',
                            name: name,
                            sourceClass: sourceType,
                            targetClass: targetType,
                            sourceMultiplicity: sourceMultiplicity,
                            targetMultiplicity: targetMultiplicity
                        };
                    }
                }
                return null; // No se pudo procesar
            }

            if (associationEnds.length !== 2) {
                return null; // Asociación incompleta
            }

            const sourceEnd = associationEnds[0];
            const targetEnd = associationEnds[1];

            // Extraer información de los extremos
            const sourceType = sourceEnd.getAttribute('type');
            const targetType = targetEnd.getAttribute('type');
            const sourceMultiplicity = sourceEnd.getAttribute('multiplicity') || '1';
            const targetMultiplicity = targetEnd.getAttribute('multiplicity') || '1';

            // Determinar tipo de relación por agregación
            let relationType = 'association';
            const sourceAggregation = sourceEnd.getAttribute('aggregation');
            const targetAggregation = targetEnd.getAttribute('aggregation');

            if (sourceAggregation === 'composite' || targetAggregation === 'composite') {
                relationType = 'composition';
            } else if (sourceAggregation === 'shared' || targetAggregation === 'shared') {
                relationType = 'aggregation';
            }

            console.log(`🔗 Asociación encontrada: ${sourceType} -> ${targetType} (${relationType})`);

            return {
                xmiId: xmiId,
                type: relationType,
                name: name,
                sourceClass: sourceType,
                targetClass: targetType,
                sourceMultiplicity: sourceMultiplicity,
                targetMultiplicity: targetMultiplicity
            };

        } catch (error) {
            console.warn('⚠️ Error procesando asociación:', error);
            return null;
        }
    }

    parseGeneralization(genElement) {
        try {
            const xmiId = genElement.getAttribute('xmi.id') || genElement.getAttribute('xmi:id');
            const subtype = genElement.getAttribute('subtype');
            const supertype = genElement.getAttribute('supertype');

            if (!subtype || !supertype) {
                return null;
            }

            console.log(`🔗 Herencia encontrada: ${subtype} -> ${supertype}`);

            return {
                xmiId: xmiId,
                type: 'inheritance',
                name: '',
                sourceClass: subtype,
                targetClass: supertype,
                sourceMultiplicity: '',
                targetMultiplicity: ''
            };

        } catch (error) {
            console.warn('⚠️ Error procesando generalización:', error);
            return null;
        }
    }

    // ==================== CREACIÓN EN EL DIAGRAMA ====================

    async createClassesInDiagram(classes) {
        console.log('🏗️ Creando clases en el diagrama...');

        for (let i = 0; i < classes.length; i++) {
            const classInfo = classes[i];

            // Calcular posición
            const position = this.calculateClassPosition(i);

            // Crear elemento usando ClassManager
            const element = this.createClassElement(classInfo, position.x, position.y);

            if (element) {
                // Guardar referencia
                this.classMap.set(classInfo.xmiId, element);
                console.log(`✅ Clase creada: ${classInfo.name} en posición (${position.x}, ${position.y})`);
            }

            // Pequeña pausa para evitar problemas de rendering
            await this.delay(50);
        }
    }

    createClassElement(classInfo, x, y) {
        try {
            // Usar la factory del DiagramElementFactory
            const element = this.classManager.elementFactory.createClassElement(
                classInfo.name,
                classInfo.attributes,
                classInfo.methods,
                x,
                y,
                classInfo.type,
                this.graph
            );

            // Configurar datos UML adicionales
            element.set('umlData', {
                className: classInfo.name,
                type: classInfo.type,
                attributes: classInfo.attributes,
                methods: classInfo.methods,
                visibility: classInfo.visibility,
                isAbstract: classInfo.isAbstract,
                stereotype: classInfo.stereotype
            });

            return element;

        } catch (error) {
            console.error(`❌ Error creando clase ${classInfo.name}:`, error);
            return null;
        }
    }

    async createRelationshipsInDiagram(relationships) {
        console.log('🔗 Creando relaciones en el diagrama...');

        for (const relInfo of relationships) {
            // Buscar elementos source y target
            const sourceElement = this.findElementByXmiId(relInfo.sourceClass);
            const targetElement = this.findElementByXmiId(relInfo.targetClass);

            if (sourceElement && targetElement) {
                const relationship = this.createRelationshipElement(relInfo, sourceElement, targetElement);

                if (relationship) {
                    this.relationshipMap.set(relInfo.xmiId, relationship);
                    console.log(`✅ Relación creada: ${relInfo.type} entre ${relInfo.sourceClass} y ${relInfo.targetClass}`);
                }
            } else {
                console.warn(`⚠️ No se encontraron elementos para la relación: ${relInfo.sourceClass} -> ${relInfo.targetClass}`);
            }

            await this.delay(50);
        }
    }

    createRelationshipElement(relInfo, sourceElement, targetElement) {
        try {
            // Configuración de la relación
            const config = {
                sourceMultiplicity: relInfo.sourceMultiplicity,
                targetMultiplicity: relInfo.targetMultiplicity,
                name: relInfo.name,
                sourceAnchor: 'auto',
                targetAnchor: 'auto'
            };

            // Crear relación usando RelationshipManager
            const relationship = this.relationshipManager.createRelationshipFromConfig(
                relInfo.type,
                sourceElement,
                targetElement,
                config
            );

            return relationship;

        } catch (error) {
            console.error(`❌ Error creando relación ${relInfo.type}:`, error);
            return null;
        }
    }

    // ==================== MÉTODOS UTILITARIOS ====================

    clearDiagram() {
        console.log('🧹 Limpiando diagrama actual...');
        this.graph.clear();
        this.classMap.clear();
        this.relationshipMap.clear();
        this.classCount = 0;
    }

    calculateClassPosition(index) {
        const row = Math.floor(index / this.maxClassesPerRow);
        const col = index % this.maxClassesPerRow;

        return {
            x: this.classPositionX + (col * this.classSpacingX),
            y: this.classPositionY + (row * this.classSpacingY)
        };
    }

    findElementByXmiId(xmiId) {
        // Primero buscar en el mapa de clases
        if (this.classMap.has(xmiId)) {
            return this.classMap.get(xmiId);
        }

        // Buscar por nombre de clase si no encuentra por ID
        for (const [id, element] of this.classMap.entries()) {
            const umlData = element.get('umlData');
            if (umlData && umlData.className === xmiId) {
                return element;
            }
        }

        return null;
    }

    getVisibilitySymbol(visibility) {
        const symbols = {
            'public': '+',
            'private': '-',
            'protected': '#',
            'package': '~'
        };
        return symbols[visibility] || '+';
    }

    resolveTypeReference(typeRef) {
        // Si es una referencia href, extraer el tipo
        if (typeRef && typeRef.includes('#')) {
            const typePart = typeRef.split('#')[1];
            if (typePart) {
                typeRef = typePart.replace('_type', '');
            }
        }

        // Mapeo de tipos básicos XMI a tipos Java
        const typeMap = {
            'eaxmiid0': 'String',
            'string': 'String',
            'String': 'String',
            'int': 'int',
            'Integer': 'Integer',
            'boolean': 'boolean',
            'Boolean': 'Boolean',
            'double': 'double',
            'Double': 'Double',
            'long': 'long',
            'Long': 'Long',
            'Date': 'Date',
            'LocalDateTime': 'LocalDateTime',
            'BigDecimal': 'BigDecimal'
        };

        return typeMap[typeRef] || 'String';
    }    extractStereotype(classElement) {
        // Buscar estereotipo en TaggedValues o elementos específicos
        const taggedValues = classElement.querySelectorAll('UML\\:TaggedValue, TaggedValue');

        for (const taggedValue of taggedValues) {
            const tag = taggedValue.getAttribute('tag');
            const value = taggedValue.getAttribute('value');

            if (tag === 'stereotype' || tag === 'ea_stype') {
                return value;
            }
        }

        return null;
    }

    adjustDiagramView() {
        console.log('🔍 Ajustando vista del diagrama...');

        // Centrar y ajustar zoom si hay elementos
        if (this.graph.getElements().length > 0) {
            try {
                // Obtener bounding box de todos los elementos
                const bbox = this.graph.getBBox(this.graph.getElements());

                if (bbox) {
                    // Ajustar el paper para mostrar todos los elementos
                    this.paper.scaleContentToFit({
                        padding: 50,
                        maxScale: 1,
                        minScale: 0.2
                    });

                    // Centrar la vista
                    this.paper.center();
                }
            } catch (error) {
                console.warn('⚠️ No se pudo ajustar la vista automáticamente:', error);
            }
        }

        // Actualizar información del canvas
        if (this.editor.updateCanvasInfo) {
            this.editor.updateCanvasInfo();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== MÉTODO PÚBLICO PARA ARCHIVOS ====================

    async importFromFile(file) {
        try {
            console.log(`📂 Importando archivo: ${file.name}`);

            // Validar tipo de archivo
            if (!this.isValidXMLFile(file)) {
                throw new Error('El archivo debe ser un archivo XML válido (.xml, .xmi, .uml)');
            }

            // Leer contenido del archivo
            const content = await this.readFileContent(file);

            // Importar desde contenido XML
            return await this.importFromXML(content);

        } catch (error) {
            console.error('❌ Error importando archivo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    isValidXMLFile(file) {
        const validExtensions = ['.xml', '.xmi', '.uml'];
        const fileName = file.name.toLowerCase();

        return validExtensions.some(ext => fileName.endsWith(ext));
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (e) => {
                reject(new Error('Error leyendo el archivo'));
            };

            reader.readAsText(file, 'UTF-8');
        });
    }

    // ==================== INFORMACIÓN DE ESTADO ====================

    getImportStatistics() {
        return {
            classesImported: this.classMap.size,
            relationshipsImported: this.relationshipMap.size,
            totalElements: this.graph.getElements().length,
            totalLinks: this.graph.getLinks().length
        };
    }
}
