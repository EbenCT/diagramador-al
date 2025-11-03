// resources/js/diagram/utils/simpleImageImport.js
// Importador de diagramas UML desde imágenes usando Groq + Llama Vision

export class SimpleImageImporter {
    constructor(editor) {
        this.editor = editor;
        this.graph = editor.graph;
        this.paper = editor.paper;
        this.classManager = editor.classManager;
        this.relationshipManager = editor.relationshipManager;

        // Configuración de Groq - Reutilizar la misma que AI modules
        this.groqApiKey = window.AI_CONFIG?.GROQ_API_KEY ||
                         window.GROQ_API_KEY ||
                         null;
        this.groqModel = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Modelo activo con soporte de visión
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

        // Configuración de procesamiento
        this.maxImageSize = 5 * 1024 * 1024; // 5MB
        this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        // Contadores para posicionamiento automático
        this.classPositionX = 100;
        this.classPositionY = 100;
        this.classSpacingX = 280;
        this.classSpacingY = 200;
        this.maxClassesPerRow = 4;
        this.classCount = 0;

        console.log('📷 SimpleImageImporter inicializado');
    }

    // ==================== MÉTODO PRINCIPAL DE IMPORTACIÓN ====================

    async importFromImage(imageFile) {
        try {
            console.log('📷 Iniciando importación desde imagen...');

            // Validaciones
            if (!this.groqApiKey) {
                throw new Error('API Key de Groq no configurada');
            }

            this.validateImageFile(imageFile);

            // Convertir imagen a base64
            const imageBase64 = await this.convertImageToBase64(imageFile);

            // Analizar imagen con Groq Vision
            const analysisResult = await this.analyzeImageWithGroq(imageBase64);

            // Procesar respuesta y crear elementos
            const importResult = await this.processAnalysisResult(analysisResult);

            console.log('✅ Importación de imagen completada:', importResult);

            return {
                success: true,
                classesCreated: importResult.classesCreated || 0,
                relationshipsCreated: importResult.relationshipsCreated || 0,
                message: 'Diagrama importado exitosamente desde imagen'
            };

        } catch (error) {
            console.error('❌ Error en importación de imagen:', error);
            return {
                success: false,
                error: error.message,
                classesCreated: 0,
                relationshipsCreated: 0
            };
        }
    }

    // ==================== VALIDACIONES ====================

    validateImageFile(file) {
        if (!file) {
            throw new Error('No se seleccionó ningún archivo');
        }

        if (!this.supportedFormats.includes(file.type)) {
            throw new Error('Formato de imagen no soportado. Use: JPG, PNG o WebP');
        }

        if (file.size > this.maxImageSize) {
            throw new Error('La imagen es demasiado grande. Máximo: 5MB');
        }

        console.log('✅ Archivo validado:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        });
    }

    // ==================== PROCESAMIENTO DE IMAGEN ====================

    async convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                // Obtener solo la parte base64 sin el prefijo data:image/...
                const base64 = event.target.result.split(',')[1];
                resolve(base64);
            };

            reader.onerror = () => {
                reject(new Error('Error al leer el archivo de imagen'));
            };

            reader.readAsDataURL(file);
        });
    }

    // ==================== ANÁLISIS CON GROQ VISION ====================

    async analyzeImageWithGroq(imageBase64) {
        console.log('🤖 Enviando imagen a Groq Vision...');

        const prompt = this.buildVisionPrompt();

        const requestBody = {
            model: this.groqModel,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 4000
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error de Groq Vision:', errorData);
            throw new Error(`Groq Vision API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log('✅ Respuesta de Groq Vision recibida');

        return data.choices[0]?.message?.content || '';
    }

    buildVisionPrompt() {
        return `
Analiza esta imagen de diagrama UML y extrae la información de clases y relaciones.

INSTRUCCIONES:
1. Identifica todas las clases UML en la imagen
2. Para cada clase, extrae: nombre, atributos y métodos
3. Identifica las relaciones entre clases (herencia, composición, asociación, etc.)
4. Determina posiciones relativas para el layout

FORMATO DE RESPUESTA - DEVUELVE SOLO JSON VÁLIDO:
{
  "classes": [
    {
      "name": "NombreClase",
      "type": "class",
      "attributes": [
        "- atributo1: String",
        "+ atributo2: int"
      ],
      "methods": [
        "+ metodo1(): void",
        "+ metodo2(param: String): boolean"
      ],
      "position": {
        "row": 0,
        "col": 0
      }
    }
  ],
  "relationships": [
    {
      "type": "inheritance",
      "from": "ClaseHija",
      "to": "ClasePadre"
    },
    {
      "type": "association",
      "from": "Clase1",
      "to": "Clase2",
      "sourceMultiplicity": "1",
      "targetMultiplicity": "*"
    }
  ]
}

TIPOS DE RELACIÓN VÁLIDOS:
- "inheritance": Herencia (flecha triangular)
- "composition": Composición (rombo negro)
- "aggregation": Agregación (rombo blanco)
- "association": Asociación simple (línea)

NOTAS:
- Si no puedes identificar algo claramente, omítelo
- Mantén los nombres de clases simples y válidos
- Usa visibilidad estándar: + (public), - (private), # (protected)
- Si la imagen no contiene un diagrama UML, devuelve: {"classes": [], "relationships": []}

Analiza la imagen y devuelve SOLO el JSON sin explicaciones adicionales.
        `.trim();
    }

    // ==================== PROCESAMIENTO DE RESULTADOS ====================

    async processAnalysisResult(analysisText) {
        try {
            // Intentar parsear el JSON
            let diagramData;
            try {
                // Limpiar respuesta si contiene texto adicional
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                const jsonText = jsonMatch ? jsonMatch[0] : analysisText;
                diagramData = JSON.parse(jsonText);
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                throw new Error('La respuesta de IA no es un JSON válido');
            }

            // Validar estructura
            if (!diagramData.classes || !Array.isArray(diagramData.classes)) {
                throw new Error('Estructura de respuesta inválida: falta array de clases');
            }

            console.log('📊 Datos extraídos de la imagen:', diagramData);

            // Limpiar diagrama actual (opcional)
            // this.graph.clear();

            // Crear clases
            const createdClasses = await this.createClassesFromData(diagramData.classes);

            // Crear relaciones
            let createdRelationships = 0;
            if (diagramData.relationships && Array.isArray(diagramData.relationships)) {
                createdRelationships = await this.createRelationshipsFromData(diagramData.relationships, createdClasses);
            }

            return {
                classesCreated: createdClasses.length,
                relationshipsCreated: createdRelationships
            };

        } catch (error) {
            console.error('❌ Error procesando resultado de análisis:', error);
            throw error;
        }
    }

    // ==================== CREACIÓN DE ELEMENTOS ====================

    async createClassesFromData(classesData) {
        const createdClasses = [];

        for (const classData of classesData) {
            try {
                // Calcular posición
                const position = this.calculateClassPosition(classData.position);

                // Crear clase usando el ClassManager existente
                const element = this.classManager.elementFactory.createClassElement(
                    classData.name || 'UnnamedClass',
                    classData.attributes || [],
                    classData.methods || [],
                    position.x,
                    position.y,
                    classData.type || 'class',
                    this.graph,
                    null // Sin datos UML25 específicos
                );

                createdClasses.push({
                    name: classData.name || 'UnnamedClass',
                    element: element,
                    data: classData
                });

                console.log(`✅ Clase creada: ${classData.name}`);

            } catch (error) {
                console.error(`❌ Error creando clase ${classData.name}:`, error);
            }
        }

        // Actualizar información del canvas
        this.editor.updateCanvasInfo();

        return createdClasses;
    }

    async createRelationshipsFromData(relationshipsData, createdClasses) {
        let createdCount = 0;

        // Crear mapa de clases por nombre para búsqueda rápida
        const classMap = new Map();
        createdClasses.forEach(cls => {
            classMap.set(cls.name, cls.element);
        });

        for (const relData of relationshipsData) {
            try {
                const sourceElement = classMap.get(relData.from);
                const targetElement = classMap.get(relData.to);

                if (!sourceElement || !targetElement) {
                    console.warn(`⚠️ Relación ignorada: ${relData.from} -> ${relData.to} (clases no encontradas)`);
                    continue;
                }

                // Crear relación usando el RelationshipManager
                const relationshipType = this.mapRelationshipType(relData.type);
                const config = {
                    sourceMultiplicity: relData.sourceMultiplicity || '',
                    targetMultiplicity: relData.targetMultiplicity || '',
                    relationName: relData.label || '',
                    sourceAnchor: 'auto',
                    targetAnchor: 'auto'
                };

                this.relationshipManager.createRelationshipFromConfig(
                    relationshipType,
                    sourceElement,
                    targetElement,
                    config
                );

                createdCount++;
                console.log(`✅ Relación creada: ${relData.from} -> ${relData.to} (${relData.type})`);

            } catch (error) {
                console.error(`❌ Error creando relación ${relData.from} -> ${relData.to}:`, error);
            }
        }

        return createdCount;
    }

    // ==================== UTILIDADES ====================

    calculateClassPosition(positionData) {
        // Si se proporciona posición específica, usarla como guía
        let row = 0;
        let col = 0;

        if (positionData) {
            row = positionData.row || 0;
            col = positionData.col || 0;
        } else {
            // Auto-layout basado en contador
            row = Math.floor(this.classCount / this.maxClassesPerRow);
            col = this.classCount % this.maxClassesPerRow;
        }

        const x = this.classPositionX + (col * this.classSpacingX);
        const y = this.classPositionY + (row * this.classSpacingY);

        this.classCount++;

        return { x, y };
    }

    mapRelationshipType(type) {
        // Mapear tipos de relación del JSON a los tipos de JointJS
        const typeMap = {
            'inheritance': 'inheritance',
            'composition': 'composition',
            'aggregation': 'aggregation',
            'association': 'association',
            'dependency': 'dependency',
            'realization': 'realization'
        };

        return typeMap[type] || 'association';
    }

    // ==================== MÉTODO ESTÁTICO PARA USO RÁPIDO ====================

    static async quickImportFromImage(editor, imageFile) {
        const importer = new SimpleImageImporter(editor);
        return await importer.importFromImage(imageFile);
    }
}

// Método estático para uso rápido
SimpleImageImporter.quickImportFromImage = function(editor, imageFile) {
    const importer = new SimpleImageImporter(editor);
    return importer.importFromImage(imageFile);
};
