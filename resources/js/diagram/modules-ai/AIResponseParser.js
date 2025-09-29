// resources/js/diagram/modules-ai/AIResponseParser.js
// Interpreta respuestas de IA y extrae comandos específicos para modificar el diagrama

export class AIResponseParser {
    constructor(editor) {
        this.editor = editor;
        this.commandPatterns = this.initializeCommandPatterns();
    }

    // ==================== PATRONES DE COMANDOS ====================

    initializeCommandPatterns() {
        return {
            // Crear nueva clase
            CREATE_CLASS: /CREAR_CLASE:\s*([^|]+)(?:\s*\|\s*ATRIBUTOS:\s*([^|]+))?(?:\s*\|\s*MÉTODOS:\s*([^|]+))?/gi,

            // Agregar elementos a clase existente
            ADD_ATTRIBUTE: /AGREGAR_ATRIBUTO:\s*([^|]+)\s*\|\s*(.+)/gi,
            ADD_METHOD: /AGREGAR_MÉTODO:\s*([^|]+)\s*\|\s*(.+)/gi,

            // Crear relaciones
            CREATE_RELATION: /CREAR_RELACIÓN:\s*([^|]+)\s*\|\s*([^-]+)\s*->\s*([^|]+)(?:\s*\|\s*(.+))?/gi,

            // Modificar clase existente
            MODIFY_CLASS: /MODIFICAR_CLASE:\s*([^|]+)\s*\|\s*(.+)/gi,

            // Eliminar elementos
            REMOVE_ATTRIBUTE: /ELIMINAR_ATRIBUTO:\s*([^|]+)\s*\|\s*(.+)/gi,
            REMOVE_METHOD: /ELIMINAR_MÉTODO:\s*([^|]+)\s*\|\s*(.+)/gi
        };
    }

    // ==================== PARSER PRINCIPAL ====================

    parseResponse(responseText) {
        console.log('🔍 Parseando respuesta de IA...');

        const result = {
            analysis: this.extractAnalysis(responseText),
            bubbles: this.extractBubbles(responseText),
            changes: this.extractChanges(responseText),
            rawResponse: responseText
        };

        console.log('📋 Resultado del parseo:', result);
        return result;
    }

    // ==================== EXTRACCIÓN DE ANÁLISIS ====================

    extractAnalysis(text) {
        const analysisMatch = text.match(/ANÁLISIS:\s*(.+?)(?:\n|COMANDOS:|$)/i);
        return analysisMatch ? analysisMatch[1].trim() : 'Análisis completado';
    }

    // ==================== EXTRACCIÓN DE BURBUJAS ====================

    extractBubbles(text) {
        const bubbles = [];
        const analysis = this.extractAnalysis(text);

        // Burbuja principal con el análisis
        if (analysis && analysis !== 'Análisis completado') {
            bubbles.push({
                type: 'info',
                message: analysis,
                targetClass: null
            });
        }

        // Buscar problemas específicos mencionados
        const problems = this.extractProblems(text);
        problems.forEach(problem => {
            bubbles.push({
                type: 'warning',
                message: problem.message,
                targetClass: problem.targetClass
            });
        });

        // Buscar sugerencias específicas
        const suggestions = this.extractSuggestions(text);
        suggestions.forEach(suggestion => {
            bubbles.push({
                type: 'suggestion',
                message: suggestion.message,
                targetClass: suggestion.targetClass
            });
        });

        return bubbles;
    }

    extractProblems(text) {
        const problems = [];
        const problemIndicators = [
            /falta(?:n)?\s+(.+?)(?:\s+en\s+(\w+))?/gi,
            /no\s+tiene(?:n)?\s+(.+?)(?:\s+(\w+))?/gi,
            /debería(?:n)?\s+tener\s+(.+?)(?:\s+(\w+))?/gi
        ];

        problemIndicators.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                problems.push({
                    message: `Falta: ${match[1].trim()}`,
                    targetClass: match[2] || null
                });
            }
        });

        return problems;
    }

    extractSuggestions(text) {
        const suggestions = [];
        const suggestionIndicators = [
            /recomiendo\s+(.+?)(?:\s+para\s+(\w+))?/gi,
            /sugiero\s+(.+?)(?:\s+en\s+(\w+))?/gi,
            /considera\s+(.+?)(?:\s+para\s+(\w+))?/gi
        ];

        suggestionIndicators.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                suggestions.push({
                    message: `💡 ${match[1].trim()}`,
                    targetClass: match[2] || null
                });
            }
        });

        return suggestions;
    }

    // ==================== EXTRACCIÓN DE CAMBIOS ====================

    extractChanges(text) {
        const changes = [];

        // Buscar sección de comandos
        const commandsSection = this.extractCommandsSection(text);
        if (!commandsSection) {
            console.log('⚠️ No se encontró sección de comandos');
            return changes;
        }

        // Procesar cada tipo de comando
        changes.push(...this.parseCreateClassCommands(commandsSection));
        changes.push(...this.parseAddAttributeCommands(commandsSection));
        changes.push(...this.parseAddMethodCommands(commandsSection));
        changes.push(...this.parseCreateRelationCommands(commandsSection));
        changes.push(...this.parseModifyClassCommands(commandsSection));

        console.log(`📝 Encontrados ${changes.length} cambios`);
        return changes;
    }

    extractCommandsSection(text) {
        const commandsMatch = text.match(/COMANDOS:\s*([\s\S]+?)(?:\n\n|$)/i);
        return commandsMatch ? commandsMatch[1] : null;
    }

    // ==================== PARSERS DE COMANDOS ESPECÍFICOS ====================

    parseCreateClassCommands(commandsText) {
        const changes = [];
        const pattern = this.commandPatterns.CREATE_CLASS;
        let match;

        while ((match = pattern.exec(commandsText)) !== null) {
            const className = match[1].trim();
            const attributesText = match[2] ? match[2].trim() : '';
            const methodsText = match[3] ? match[3].trim() : '';

            const attributes = this.parseAttributesList(attributesText);
            const methods = this.parseMethodsList(methodsText);

            changes.push({
                type: 'CREATE_CLASS',
                className: className,
                attributes: attributes,
                methods: methods,
                position: this.calculateNewClassPosition(),
                description: `Crear clase "${className}"`,
                targetElement: null
            });
        }

        return changes;
    }

    parseAddAttributeCommands(commandsText) {
        const changes = [];
        const pattern = this.commandPatterns.ADD_ATTRIBUTE;
        let match;

        while ((match = pattern.exec(commandsText)) !== null) {
            const className = match[1].trim();
            const attribute = match[2].trim();

            changes.push({
                type: 'ADD_ATTRIBUTE',
                className: className,
                attribute: attribute,
                description: `Agregar atributo "${attribute}" a "${className}"`,
                targetElement: this.findElementByClassName(className)
            });
        }

        return changes;
    }

    parseAddMethodCommands(commandsText) {
        const changes = [];
        const pattern = this.commandPatterns.ADD_METHOD;
        let match;

        while ((match = pattern.exec(commandsText)) !== null) {
            const className = match[1].trim();
            const method = match[2].trim();

            changes.push({
                type: 'ADD_METHOD',
                className: className,
                method: method,
                description: `Agregar método "${method}" a "${className}"`,
                targetElement: this.findElementByClassName(className)
            });
        }

        return changes;
    }

    parseCreateRelationCommands(commandsText) {
        const changes = [];
        const pattern = this.commandPatterns.CREATE_RELATION;
        let match;

        while ((match = pattern.exec(commandsText)) !== null) {
            const relationType = match[1].trim().toLowerCase();
            const sourceClass = match[2].trim();
            const targetClass = match[3].trim();
            const multiplicity = match[4] ? match[4].trim() : '';

            changes.push({
                type: 'CREATE_RELATION',
                relationType: this.normalizeRelationType(relationType),
                sourceClass: sourceClass,
                targetClass: targetClass,
                multiplicity: multiplicity,
                description: `Crear relación ${relationType} entre "${sourceClass}" y "${targetClass}"`,
                sourceElement: this.findElementByClassName(sourceClass),
                targetElement: this.findElementByClassName(targetClass)
            });
        }

        return changes;
    }

    parseModifyClassCommands(commandsText) {
        const changes = [];
        const pattern = this.commandPatterns.MODIFY_CLASS;
        let match;

        while ((match = pattern.exec(commandsText)) !== null) {
            const className = match[1].trim();
            const modification = match[2].trim();

            changes.push({
                type: 'MODIFY_CLASS',
                className: className,
                modification: modification,
                description: `Modificar "${className}": ${modification}`,
                targetElement: this.findElementByClassName(className)
            });
        }

        return changes;
    }

    // ==================== UTILIDADES DE PARSING ====================

    parseAttributesList(attributesText) {
        if (!attributesText) return [];

        return attributesText
            .split(/[,;]/)
            .map(attr => attr.trim())
            .filter(attr => attr)
            .map(attr => {
                // Normalizar formato de atributo
                if (!attr.startsWith('-') && !attr.startsWith('+')) {
                    return `- ${attr}`;
                }
                return attr;
            });
    }

    parseMethodsList(methodsText) {
        if (!methodsText) return [];

        return methodsText
            .split(/[,;]/)
            .map(method => method.trim())
            .filter(method => method)
            .map(method => {
                // Normalizar formato de método
                if (!method.startsWith('-') && !method.startsWith('+')) {
                    return `+ ${method}`;
                }
                return method;
            });
    }

    normalizeRelationType(type) {
        const typeMap = {
            'asociación': 'association',
            'asociacion': 'association',
            'herencia': 'inheritance',
            'composición': 'composition',
            'composicion': 'composition',
            'agregación': 'aggregation',
            'agregacion': 'aggregation'
        };

        return typeMap[type] || 'association';
    }

    // ==================== BÚSQUEDA DE ELEMENTOS ====================

    findElementByClassName(className) {
        const elements = this.editor.graph.getElements();
        return elements.find(element => {
            const umlData = element.get('umlData');
            return umlData?.className === className;
        });
    }

calculateNewClassPosition() {
    const elements = this.editor.graph.getElements();

    if (elements.length === 0) {
        return { x: 150, y: 150 };
    }

    const positions = elements.map(element => element.position());

    // Calcular centro de gravedad de las clases existentes
    const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;

    // Encontrar área libre cerca del centro
    const gridSize = 200; // Distancia entre clases
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Buscar en espiral alrededor del centro
        const angle = (attempt * 45) % 360; // 45 grados por intento
        const distance = Math.ceil(attempt / 8) * gridSize; // Aumentar distancia cada 8 intentos

        const testX = centerX + Math.cos(angle * Math.PI / 180) * distance;
        const testY = centerY + Math.sin(angle * Math.PI / 180) * distance;

        // Verificar si esta posición está libre (no hay clases muy cerca)
        const isFree = elements.every(element => {
            const pos = element.position();
            const distance = Math.sqrt(Math.pow(pos.x - testX, 2) + Math.pow(pos.y - testY, 2));
            return distance > 150; // Mínimo 150px de separación
        });

        if (isFree) {
            return {
                x: Math.max(50, testX), // No muy cerca del borde
                y: Math.max(50, testY)
            };
        }
    }

    // Fallback: posición segura a la derecha
    const rightmostElement = elements.reduce((max, element) => {
        const pos = element.position();
        return pos.x > max.x ? pos : max;
    }, { x: 0, y: 0 });

    return {
        x: rightmostElement.x + 250,
        y: rightmostElement.y
    };
}

    // ==================== UTILIDADES DE TEXTO ====================

    truncateMessage(message, maxLength) {

        const newMaxLength = Math.max(maxLength, 200);
        if (message.length <= newMaxLength) return message;

        const truncated = message.substring(0, maxLength - 3);
        const lastSpace = truncated.lastIndexOf(' ');

        return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
    }

    // ==================== VALIDACIÓN DE CAMBIOS ====================

validateChanges(changes) {
    const validatedChanges = [];

    changes.forEach(change => {
        if (this.isValidChange(change) && this.isUniqueChange(change)) {
            validatedChanges.push(change);
        } else {
            console.warn('⚠️ Cambio inválido o duplicado ignorado:', change);
        }
    });

    return validatedChanges;
}
isUniqueChange(change) {
    switch (change.type) {
        case 'CREATE_CLASS':
            // Verificar que la clase no exista
            return !this.findElementByClassName(change.className);

        case 'ADD_ATTRIBUTE':
            const element = this.findElementByClassName(change.className);
            if (!element) return false;
            const attributes = element.get('umlData')?.attributes || [];
            return !attributes.includes(change.attribute);

        case 'ADD_METHOD':
            const elementM = this.findElementByClassName(change.className);
            if (!elementM) return false;
            const methods = elementM.get('umlData')?.methods || [];
            return !methods.includes(change.method);

        case 'CREATE_RELATION':
            const sourceEl = this.findElementByClassName(change.sourceClass);
            const targetEl = this.findElementByClassName(change.targetClass);
            if (!sourceEl || !targetEl) return false;

            // Verificar que no exista ya esta relación
            const links = this.editor.graph.getLinks();
            return !links.some(link => {
                const linkData = link.get('linkData') || {};
                return link.getSourceElement()?.id === sourceEl.id &&
                       link.getTargetElement()?.id === targetEl.id &&
                       linkData.type === change.relationType;
            });

        default:
            return true;
    }
}
    isValidChange(change) {
        switch (change.type) {
            case 'CREATE_CLASS':
                return change.className && change.className.trim() !== '';

            case 'ADD_ATTRIBUTE':
            case 'ADD_METHOD':
                return change.className &&
                       (change.attribute || change.method) &&
                       this.findElementByClassName(change.className);

            case 'CREATE_RELATION':
                return change.sourceClass &&
                       change.targetClass &&
                       this.findElementByClassName(change.sourceClass) &&
                       this.findElementByClassName(change.targetClass);

            default:
                return false;
        }
    }

    // ==================== DEBUG Y TESTING ====================

    debugParseResponse(responseText) {
        console.group('🔍 Debug AIResponseParser');

        console.log('📄 Texto original:', responseText);
        console.log('📊 Análisis extraído:', this.extractAnalysis(responseText));
        console.log('💬 Burbujas encontradas:', this.extractBubbles(responseText));
        console.log('🔧 Cambios encontrados:', this.extractChanges(responseText));

        const commandsSection = this.extractCommandsSection(responseText);
        console.log('⚙️ Sección de comandos:', commandsSection);

        console.groupEnd();
    }

    // ==================== PATRONES DE RESPUESTA ALTERNATIVOS ====================

    parseNaturalLanguageResponse(text) {
        // Para respuestas menos estructuradas, intentar extraer información
        const changes = [];

        // Buscar menciones de clases a crear
        const createClassMatches = text.match(/(?:crear|agregar|añadir)\s+(?:una\s+)?clase\s+(\w+)/gi);
        if (createClassMatches) {
            createClassMatches.forEach(match => {
                const className = match.match(/clase\s+(\w+)/i)[1];
                changes.push({
                    type: 'CREATE_CLASS',
                    className: className,
                    attributes: [],
                    methods: [],
                    position: this.calculateNewClassPosition(),
                    description: `Crear clase "${className}"`,
                    targetElement: null
                });
            });
        }

        return changes;
    }
}
