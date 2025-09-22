// resources/js/diagram/utils/simplePostmanGenerator.js
// Generador simple de colecciones Postman desde diagramas UML

export class SimplePostmanGenerator {
    constructor(editor) {
        this.editor = editor;
        this.projectName = 'MiProyecto';
        this.baseUrl = 'http://localhost:8080';
        this.collectionId = this.generateUUID();
    }

    generatePostmanCollection() {
        try {
            console.log('📡 Iniciando generación de colección Postman...');

            // Configurar proyecto
            this.setupProjectConfig();

            // Extraer clases entities del diagrama (misma lógica que Java Generator)
            const entities = this.extractEntities();
            const relationships = this.extractRelationships();

            if (entities.length === 0) {
                alert('⚠️ No hay entidades (clases con estereotipo <<entity>>) en el diagrama para generar endpoints.');
                return;
            }

            // Generar colección completa
            const collection = this.buildPostmanCollection(entities, relationships);

            // Descargar
            this.downloadCollection(collection);

            console.log('✅ Colección Postman generada exitosamente');
        } catch (error) {
            console.error('❌ Error generando colección Postman:', error);
            alert('Error al generar colección: ' + error.message);
        }
    }

    setupProjectConfig() {
        const diagramTitle = window.diagramTitle || 'MiProyecto';
        this.projectName = this.sanitizeProjectName(diagramTitle);

        console.log('📡 Configuración de la colección:', {
            projectName: this.projectName,
            baseUrl: this.baseUrl
        });
    }

    extractEntities() {
        const entities = [];
        const elements = this.editor.graph.getElements();

        elements.forEach(element => {
            const umlData = element.get('umlData');
            // Solo procesar clases con estereotipo 'entity'
            if (umlData && umlData.type === 'class' && umlData.uml25?.stereotype === 'entity') {
                const className = umlData.className || 'UnnamedEntity';

                entities.push({
                    id: element.id,
                    name: className,
                    attributes: umlData.attributes || [],
                    methods: umlData.methods || [],
                    responsibilities: umlData.uml25?.responsibilities || []
                });
            }
        });

        console.log('🏗️ Entidades extraídas:', entities.length,
            'clases:', entities.map(e => e.name));
        return entities;
    }

    extractRelationships() {
        const relationships = [];
        const links = this.editor.graph.getLinks();

        links.forEach(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();
            const umlData = link.get('umlData') || {};

            if (source && target) {
                const sourceUml = source.get('umlData');
                const targetUml = target.get('umlData');

                // Solo relaciones entre entities
                if (sourceUml?.type === 'class' && targetUml?.type === 'class' &&
                    sourceUml?.uml25?.stereotype === 'entity' && targetUml?.uml25?.stereotype === 'entity') {
                    relationships.push({
                        sourceEntity: sourceUml.className,
                        targetEntity: targetUml.className,
                        type: umlData.relationshipType || 'association',
                        sourceMultiplicity: umlData.sourceMultiplicity || '',
                        targetMultiplicity: umlData.targetMultiplicity || ''
                    });
                }
            }
        });

        console.log('🔗 Relaciones entre entidades:', relationships.length);
        return relationships;
    }

    buildPostmanCollection(entities, relationships) {
        const collection = {
            info: {
                _postman_id: this.collectionId,
                name: `${this.projectName} - API REST`,
                description: `Colección Postman generada automáticamente desde diagrama UML\\n\\n` +
                            `**Entidades incluidas:** ${entities.map(e => e.name).join(', ')}\\n\\n` +
                            `**Configuración:**\\n` +
                            `- Configura la variable {{baseUrl}} = ${this.baseUrl}\\n` +
                            `- Asegúrate de que el servidor Spring Boot esté ejecutándose\\n\\n` +
                            `**Endpoints generados:**\\n` +
                            `- CRUD completo para cada entidad\\n` +
                            `- Tests automáticos incluidos\\n\\n` +
                            `*Generado por UML Diagrammer*`,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            item: [],
            variable: this.generateEnvironmentVariables()
        };

        // Generar carpetas y endpoints por entidad
        entities.forEach(entity => {
            const entityFolder = this.generateEntityFolder(entity, relationships);
            collection.item.push(entityFolder);
        });

        // Agregar carpeta de endpoints de relaciones si existen
        if (relationships.length > 0) {
            const relationshipsFolder = this.generateRelationshipsFolder(relationships, entities);
            collection.item.push(relationshipsFolder);
        }

        // Agregar carpeta de utilidades
        const utilsFolder = this.generateUtilsFolder();
        collection.item.push(utilsFolder);

        return collection;
    }

    generateEntityFolder(entity, relationships) {
        const entityName = entity.name;
        const entityPath = this.camelToKebabCase(entityName);
        const entityRelationships = relationships.filter(r =>
            r.sourceEntity === entityName || r.targetEntity === entityName
        );

        return {
            name: `📦 ${entityName}`,
            item: [
                this.generateGetAllEndpoint(entity),
                this.generateGetByIdEndpoint(entity),
                this.generateCreateEndpoint(entity),
                this.generateUpdateEndpoint(entity),
                this.generateDeleteEndpoint(entity),
                // Endpoints específicos de relaciones para esta entidad
                ...this.generateEntityRelationshipEndpoints(entity, entityRelationships)
            ]
        };
    }

    generateGetAllEndpoint(entity) {
        const entityPath = this.camelToKebabCase(entity.name);

        return {
            name: `📋 Obtener todos los ${entity.name}`,
            request: {
                method: "GET",
                header: [
                    {
                        key: "Accept",
                        value: "application/json"
                    }
                ],
                url: {
                    raw: "{{baseUrl}}/api/" + entityPath,
                    host: ["{{baseUrl}}"],
                    path: ["api", entityPath]
                },
                description: `Obtiene una lista de todos los ${entity.name}s disponibles.\\n\\n` +
                           `**Respuesta esperada:**\\n` +
                           `- Status: 200 OK\\n` +
                           `- Array de objetos ${entity.name}ResponseDTO`
            },
            response: [
                this.generateSampleResponse(entity, 'array')
            ],
            event: [
                this.generateBasicTest(`Listar ${entity.name}s`)
            ]
        };
    }

    generateGetByIdEndpoint(entity) {
        const entityPath = this.camelToKebabCase(entity.name);

        return {
            name: `🔍 Obtener ${entity.name} por ID`,
            request: {
                method: "GET",
                header: [
                    {
                        key: "Accept",
                        value: "application/json"
                    }
                ],
                url: {
                    raw: "{{baseUrl}}/api/" + entityPath + "/{{entityId}}",
                    host: ["{{baseUrl}}"],
                    path: ["api", entityPath, "{{entityId}}"]
                },
                description: `Obtiene un ${entity.name} específico por su ID.\\n\\n` +
                           `**Parámetros:**\\n` +
                           `- entityId: ID del ${entity.name} a buscar\\n\\n` +
                           `**Respuesta esperada:**\\n` +
                           `- Status: 200 OK si existe\\n` +
                           `- Status: 404 Not Found si no existe`
            },
            response: [
                this.generateSampleResponse(entity, 'single')
            ],
            event: [
                this.generateBasicTest(`Obtener ${entity.name} por ID`)
            ]
        };
    }

    generateCreateEndpoint(entity) {
        const entityPath = this.camelToKebabCase(entity.name);
        const requestBody = this.generateRequestBody(entity);

        return {
            name: `➕ Crear nuevo ${entity.name}`,
            request: {
                method: "POST",
                header: [
                    {
                        key: "Content-Type",
                        value: "application/json"
                    },
                    {
                        key: "Accept",
                        value: "application/json"
                    }
                ],
                body: {
                    mode: "raw",
                    raw: JSON.stringify(requestBody, null, 2)
                },
                url: {
                    raw: "{{baseUrl}}/api/" + entityPath,
                    host: ["{{baseUrl}}"],
                    path: ["api", entityPath]
                },
                description: `Crea un nuevo ${entity.name}.\\n\\n` +
                           `**Body requerido:**\\n` +
                           `- JSON con datos del ${entity.name}RequestDTO\\n\\n` +
                           `**Respuesta esperada:**\\n` +
                           `- Status: 201 Created\\n` +
                           `- Objeto ${entity.name}ResponseDTO creado`
            },
            response: [
                this.generateSampleResponse(entity, 'created')
            ],
            event: [
                this.generateCreateTest(entity.name)
            ]
        };
    }

    generateUpdateEndpoint(entity) {
        const entityPath = this.camelToKebabCase(entity.name);
        const requestBody = this.generateRequestBody(entity);

        return {
            name: `✏️ Actualizar ${entity.name}`,
            request: {
                method: "PUT",
                header: [
                    {
                        key: "Content-Type",
                        value: "application/json"
                    },
                    {
                        key: "Accept",
                        value: "application/json"
                    }
                ],
                body: {
                    mode: "raw",
                    raw: JSON.stringify(requestBody, null, 2)
                },
                url: {
                    raw: "{{baseUrl}}/api/" + entityPath + "/{{entityId}}",
                    host: ["{{baseUrl}}"],
                    path: ["api", entityPath, "{{entityId}}"]
                },
                description: `Actualiza un ${entity.name} existente.\\n\\n` +
                           `**Parámetros:**\\n` +
                           `- entityId: ID del ${entity.name} a actualizar\\n\\n` +
                           `**Body requerido:**\\n` +
                           `- JSON con datos actualizados\\n\\n` +
                           `**Respuesta esperada:**\\n` +
                           `- Status: 200 OK si se actualiza\\n` +
                           `- Status: 404 Not Found si no existe`
            },
            response: [
                this.generateSampleResponse(entity, 'updated')
            ],
            event: [
                this.generateBasicTest(`Actualizar ${entity.name}`)
            ]
        };
    }

    generateDeleteEndpoint(entity) {
        const entityPath = this.camelToKebabCase(entity.name);

        return {
            name: `🗑️ Eliminar ${entity.name}`,
            request: {
                method: "DELETE",
                header: [
                    {
                        key: "Accept",
                        value: "application/json"
                    }
                ],
                url: {
                    raw: "{{baseUrl}}/api/" + entityPath + "/{{entityId}}",
                    host: ["{{baseUrl}}"],
                    path: ["api", entityPath, "{{entityId}}"]
                },
                description: `Elimina un ${entity.name} específico.\\n\\n` +
                           `**Parámetros:**\\n` +
                           `- entityId: ID del ${entity.name} a eliminar\\n\\n` +
                           `**Respuesta esperada:**\\n` +
                           `- Status: 204 No Content si se elimina\\n` +
                           `- Status: 404 Not Found si no existe`
            },
            event: [
                this.generateDeleteTest(entity.name)
            ]
        };
    }

    generateEntityRelationshipEndpoints(entity, relationships) {
        const endpoints = [];

        relationships.forEach(rel => {
            if (rel.sourceEntity === entity.name) {
                // Esta entidad es la fuente de la relación
                const targetPath = this.camelToKebabCase(rel.targetEntity);
                const entityPath = this.camelToKebabCase(entity.name);

                if (rel.targetMultiplicity.includes('*') || rel.targetMultiplicity.includes('n')) {
                    // Relación uno-a-muchos: obtener entidades relacionadas
                    endpoints.push({
                        name: `🔗 Obtener ${rel.targetEntity}s de ${entity.name}`,
                        request: {
                            method: "GET",
                            header: [
                                {
                                    key: "Accept",
                                    value: "application/json"
                                }
                            ],
                            url: {
                                raw: `{{baseUrl}}/api/${entityPath}/{{entityId}}/${targetPath}`,
                                host: ["{{baseUrl}}"],
                                path: ["api", entityPath, "{{entityId}}", targetPath]
                            },
                            description: `Obtiene todos los ${rel.targetEntity}s asociados a un ${entity.name} específico.\\n\\n` +
                                       `**Relación UML:** ${rel.type}\\n` +
                                       `**Multiplicidad:** ${rel.sourceMultiplicity} → ${rel.targetMultiplicity}`
                        },
                        event: [
                            this.generateBasicTest(`Obtener ${rel.targetEntity}s relacionados`)
                        ]
                    });
                }
            }
        });

        return endpoints;
    }

    generateRelationshipsFolder(relationships, entities) {
        return {
            name: "🔗 Endpoints de Relaciones",
            item: [
                {
                    name: "📋 Resumen de Relaciones",
                    request: {
                        method: "GET",
                        header: [],
                        url: {
                            raw: "{{baseUrl}}/api/relationships/summary",
                            host: ["{{baseUrl}}"],
                            path: ["api", "relationships", "summary"]
                        },
                        description: `**Relaciones detectadas en el diagrama UML:**\\n\\n` +
                                   relationships.map(rel =>
                                       `- **${rel.sourceEntity}** ${rel.type} **${rel.targetEntity}** ` +
                                       `(${rel.sourceMultiplicity} → ${rel.targetMultiplicity})`
                                   ).join('\\n') +
                                   `\\n\\n*Nota: Este endpoint no existe en el servidor, es solo documentación.*`
                    }
                }
            ]
        };
    }

    generateUtilsFolder() {
        return {
            name: "🛠️ Utilidades",
            item: [
                {
                    name: "❤️ Health Check",
                    request: {
                        method: "GET",
                        header: [
                            {
                                key: "Accept",
                                value: "application/json"
                            }
                        ],
                        url: {
                            raw: "{{baseUrl}}/actuator/health",
                            host: ["{{baseUrl}}"],
                            path: ["actuator", "health"]
                        },
                        description: "Verifica que el servidor Spring Boot esté funcionando correctamente."
                    },
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "pm.test('Servidor Spring Boot activo', function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});",
                                    "",
                                    "pm.test('Health check response', function () {",
                                    "    const jsonData = pm.response.json();",
                                    "    pm.expect(jsonData.status).to.eql('UP');",
                                    "});"
                                ]
                            }
                        }
                    ]
                },
                {
                    name: "📊 Configurar Variables",
                    request: {
                        method: "GET",
                        header: [],
                        url: {
                            raw: "{{baseUrl}}",
                            host: ["{{baseUrl}}"]
                        },
                        description: `**Configuración de variables de entorno:**\\n\\n` +
                                   `1. **baseUrl:** ${this.baseUrl}\\n` +
                                   `2. **entityId:** 1 (o el ID que quieras probar)\\n\\n` +
                                   `**Pasos para configurar:**\\n` +
                                   `1. Haz clic en el ojo 👁️ en la esquina superior derecha\\n` +
                                   `2. Edita las variables según tu configuración\\n` +
                                   `3. Guarda los cambios\\n\\n` +
                                   `**Verificar servidor:**\\n` +
                                   `- Ejecuta: mvn spring-boot:run\\n` +
                                   `- Verifica: ${this.baseUrl}/actuator/health`
                    }
                }
            ]
        };
    }

    // ==================== GENERADORES DE DATOS Y RESPUESTAS ====================

    generateRequestBody(entity) {
        const body = {};

        entity.attributes.forEach(attr => {
            const attrData = this.parseAttribute(attr);
            body[this.camelToSnakeCase(attrData.name)] = this.generateSampleValue(attrData.type, attrData.name);
        });

        return body;
    }

    generateSampleResponse(entity, type) {
        const body = {
            id: 1,
            created_at: "2024-01-15T10:30:00",
            updated_at: "2024-01-15T10:30:00"
        };

        entity.attributes.forEach(attr => {
            const attrData = this.parseAttribute(attr);
            body[this.camelToSnakeCase(attrData.name)] = this.generateSampleValue(attrData.type, attrData.name);
        });

        let responseBody;
        let status;

        switch (type) {
            case 'array':
                responseBody = [body, { ...body, id: 2 }];
                status = 200;
                break;
            case 'created':
                status = 201;
                responseBody = body;
                break;
            case 'updated':
                status = 200;
                responseBody = body;
                break;
            default:
                status = 200;
                responseBody = body;
        }

        return {
            name: `Ejemplo de respuesta ${type}`,
            originalRequest: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{baseUrl}}/api/ejemplo",
                    host: ["{{baseUrl}}"],
                    path: ["api", "ejemplo"]
                }
            },
            status: `${status} ${this.getStatusText(status)}`,
            code: status,
            _postman_previewlanguage: "json",
            header: [
                {
                    key: "Content-Type",
                    value: "application/json"
                }
            ],
            cookie: [],
            body: JSON.stringify(responseBody, null, 2)
        };
    }

    generateSampleValue(type, name) {
        const lowerName = name.toLowerCase();

        // Valores específicos basados en el nombre del atributo
        if (lowerName.includes('email')) return 'usuario@ejemplo.com';
        if (lowerName.includes('nombre') || lowerName.includes('name')) return 'Ejemplo Nombre';
        if (lowerName.includes('descripcion') || lowerName.includes('description')) return 'Descripción de ejemplo';
        if (lowerName.includes('precio') || lowerName.includes('price')) return 99.99;
        if (lowerName.includes('cantidad') || lowerName.includes('quantity')) return 10;
        if (lowerName.includes('telefono') || lowerName.includes('phone')) return '+1234567890';
        if (lowerName.includes('direccion') || lowerName.includes('address')) return 'Calle Ejemplo 123';
        if (lowerName.includes('codigo') || lowerName.includes('code')) return 'ABC123';

        // Valores por tipo
        const typeMap = {
            'String': 'Valor de ejemplo',
            'int': 42,
            'Integer': 42,
            'long': 123456789,
            'Long': 123456789,
            'double': 99.99,
            'Double': 99.99,
            'float': 99.9,
            'Float': 99.9,
            'boolean': true,
            'Boolean': true,
            'Date': '2024-01-15T10:30:00',
            'LocalDateTime': '2024-01-15T10:30:00',
            'LocalDate': '2024-01-15',
            'BigDecimal': '999.99'
        };

        return typeMap[type] || 'Valor de ejemplo';
    }

    // ==================== GENERADORES DE TESTS ====================

    generateBasicTest(operationName) {
        return {
            listen: "test",
            script: {
                exec: [
                    `pm.test('${operationName} - Status code válido', function () {`,
                    "    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);",
                    "});",
                    "",
                    "pm.test('Response time razonable', function () {",
                    "    pm.expect(pm.response.responseTime).to.be.below(2000);",
                    "});",
                    "",
                    "if (pm.response.code === 200 || pm.response.code === 201) {",
                    "    pm.test('Content-Type es JSON', function () {",
                    "        pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');",
                    "    });",
                    "}"
                ]
            }
        };
    }

    generateCreateTest(entityName) {
        return {
            listen: "test",
            script: {
                exec: [
                    `pm.test('${entityName} creado exitosamente', function () {`,
                    "    pm.response.to.have.status(201);",
                    "});",
                    "",
                    "pm.test('Response contiene ID generado', function () {",
                    "    const jsonData = pm.response.json();",
                    "    pm.expect(jsonData).to.have.property('id');",
                    "    pm.expect(jsonData.id).to.be.a('number');",
                    "});",
                    "",
                    "pm.test('Response contiene timestamps', function () {",
                    "    const jsonData = pm.response.json();",
                    "    pm.expect(jsonData).to.have.property('created_at');",
                    "    pm.expect(jsonData).to.have.property('updated_at');",
                    "});",
                    "",
                    "// Guardar ID para otros tests",
                    "if (pm.response.code === 201) {",
                    "    const jsonData = pm.response.json();",
                    "    pm.collectionVariables.set('entityId', jsonData.id);",
                    "}"
                ]
            }
        };
    }

    generateDeleteTest(entityName) {
        return {
            listen: "test",
            script: {
                exec: [
                    `pm.test('${entityName} eliminado exitosamente', function () {`,
                    "    pm.response.to.have.status(204);",
                    "});",
                    "",
                    "pm.test('Response body está vacío', function () {",
                    "    pm.expect(pm.response.text()).to.be.empty;",
                    "});"
                ]
            }
        };
    }

    // ==================== CONFIGURACIÓN DE VARIABLES ====================

    generateEnvironmentVariables() {
        return [
            {
                key: "baseUrl",
                value: this.baseUrl,
                description: "URL base del servidor Spring Boot"
            },
            {
                key: "entityId",
                value: "1",
                description: "ID de entidad para pruebas (se actualiza automáticamente)"
            }
        ];
    }

    // ==================== MÉTODOS AUXILIARES ====================

    parseAttribute(attributeString) {
        const match = attributeString.match(/^([+\-#~])\s*([^:]+):\s*(.+)$/);
        if (match) {
            return {
                visibility: match[1],
                name: match[2].trim(),
                type: match[3].trim()
            };
        }
        return { visibility: '+', name: attributeString, type: 'String' };
    }

    camelToKebabCase(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    }

    camelToSnakeCase(str) {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    sanitizeProjectName(name) {
        return name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    getStatusText(code) {
        const statusTexts = {
            200: 'OK',
            201: 'Created',
            204: 'No Content',
            404: 'Not Found',
            500: 'Internal Server Error'
        };
        return statusTexts[code] || 'Unknown';
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    downloadCollection(collection) {
        const filename = `${this.projectName}-Postman.json`;
        const content = JSON.stringify(collection, null, 2);

        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log('📥 Colección Postman descargada:', filename);
    }

    // Método estático para uso rápido
    static quickGeneratePostman(editor) {
        const generator = new SimplePostmanGenerator(editor);
        generator.generatePostmanCollection();
    }
}
