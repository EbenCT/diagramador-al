// resources/js/diagram/utils/simpleXMIExport.js

export class SimpleXMIExporter {
    constructor(editor) {
        this.editor = editor;
    }

    exportToXMI() {
        try {
            console.log('📄 Iniciando exportación a XMI...');

            const xmiContent = this.generateXMI();
            this.downloadXMI(xmiContent, 'diagram.xmi');

            console.log('✅ Exportación XMI completada');
        } catch (error) {
            console.error('❌ Error en exportación XMI:', error);
            alert('Error al exportar XMI: ' + error.message);
        }
    }

    generateXMI() {
        const classes = this.extractClasses();
        const relationships = this.extractRelationships();

        const xmiContent = this.buildXMIStructure(classes, relationships);
        return xmiContent;
    }

    extractClasses() {
        const classes = [];
        const elements = this.editor.graph.getElements();

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData && (umlData.type === 'class' || umlData.type === 'interface')) {
                classes.push({
                    id: element.id,
                    name: umlData.className || 'UnnamedClass',
                    type: umlData.type,
                    attributes: umlData.attributes || [],
                    methods: umlData.methods || [],
                    stereotype: umlData.uml25?.stereotype || null,
                    position: element.position()
                });
            }
        });

        console.log('🏗️ Clases extraídas:', classes.length);
        return classes;
    }

    // MÉTODO MEJORADO: Busca datos en TODOS los lugares posibles
    extractRelationships() {
        const relationships = [];
        const links = this.editor.graph.getLinks();
        const elements = this.editor.graph.getElements();

        // Crear mapa de elementos para búsqueda rápida
        const elementMap = new Map();
        elements.forEach(el => {
            const umlData = el.get('umlData');
            if (umlData) {
                elementMap.set(el.id, umlData.className || 'UnnamedClass');
            }
        });

        links.forEach(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();

            if (source && target) {
                // BUSCAR DATOS EN TODOS LOS LUGARES POSIBLES
                const umlData = link.get('umlData') || {};
                const relationData = link.get('relationData') || {};
                const linkData = link.get('linkData') || {};
                const attrs = link.attributes || {};
                const labels = link.get('labels') || [];

                // Obtener nombres de clases
                const sourceName = elementMap.get(source.id) || 'Unknown';
                const targetName = elementMap.get(target.id) || 'Unknown';

                console.log('🔍 Analizando link:', {
                    id: link.id,
                    umlData,
                    relationData,
                    linkData,
                    attrs: attrs.type,
                    labels: labels.length
                });

                // DETECTAR TIPO DE RELACIÓN DE FORMA INTELIGENTE
                let relationType = this.detectRelationTypeIntelligent(
                    link, umlData, relationData, linkData, attrs, labels
                );

                // OBTENER MULTIPLICIDADES DE TODAS LAS FUENTES
                const sourceMultiplicity = this.extractMultiplicityIntelligent(
                    umlData, relationData, linkData, labels, 0
                );

                const targetMultiplicity = this.extractMultiplicityIntelligent(
                    umlData, relationData, linkData, labels, 1
                );

                // OBTENER NOMBRE DE LA RELACIÓN
                const relationName = this.extractRelationNameIntelligent(
                    relationType, sourceName, targetName,
                    umlData, relationData, linkData, labels
                );

                relationships.push({
                    id: link.id,
                    sourceId: source.id,
                    targetId: target.id,
                    type: relationType,
                    name: relationName,
                    sourceName: sourceName,
                    targetName: targetName,
                    sourceMultiplicity: sourceMultiplicity,
                    targetMultiplicity: targetMultiplicity
                });

                console.log('✅ Relación detectada:', {
                    type: relationType,
                    from: sourceName,
                    to: targetName,
                    name: relationName,
                    multiplicity: `${sourceMultiplicity} → ${targetMultiplicity}`
                });
            }
        });

        console.log('🔗 Total relaciones extraídas:', relationships.length);
        return relationships;
    }

    // DETECCIÓN INTELIGENTE DE TIPO DE RELACIÓN
    detectRelationTypeIntelligent(link, umlData, relationData, linkData, attrs, labels) {
        // Prioridad 1: relationData.type o relationData.relationshipType
        if (relationData.type && relationData.type !== 'standard.Link') {
            return this.normalizeRelationType(relationData.type);
        }
        if (relationData.relationshipType) {
            return this.normalizeRelationType(relationData.relationshipType);
        }

        // Prioridad 2: umlData.relationshipType o umlData.type
        if (umlData.relationshipType) {
            return this.normalizeRelationType(umlData.relationshipType);
        }
        if (umlData.type && umlData.type !== 'standard.Link') {
            return this.normalizeRelationType(umlData.type);
        }

        // Prioridad 3: linkData (cualquier propiedad que tenga tipo)
        if (linkData.relationshipType) {
            return this.normalizeRelationType(linkData.relationshipType);
        }
        if (linkData.type && linkData.type !== 'standard.Link') {
            return this.normalizeRelationType(linkData.type);
        }

        // Prioridad 4: Atributos del link (tipo de JointJS)
        const jointType = attrs.type || link.get('type') || '';
        if (jointType.includes('Inheritance') || jointType.includes('Generalization')) {
            return 'inheritance';
        }
        if (jointType.includes('Composition')) {
            return 'composition';
        }
        if (jointType.includes('Aggregation')) {
            return 'aggregation';
        }

        // Prioridad 5: Detectar por atributos visuales
        const linkAttrs = attrs.attrs || link.get('attrs') || {};
        const line = linkAttrs.line || linkAttrs['.connection'] || {};

        // Composición: rombo negro
        if (line.sourceMarker?.fill === 'black' || line.targetMarker?.fill === 'black') {
            return 'composition';
        }

        // Agregación: rombo blanco
        if (line.sourceMarker?.fill === 'white' || line.targetMarker?.fill === 'white') {
            return 'aggregation';
        }

        // Herencia: triángulo vacío
        if (line.targetMarker?.type === 'path' && line.targetMarker?.fill === 'white') {
            return 'inheritance';
        }

        // Prioridad 6: Buscar en labels
        const labelText = labels.map(l => {
            const text = l.attrs?.text?.text || '';
            return text.toLowerCase();
        }).join(' ');

        if (labelText.includes('inheritance') || labelText.includes('herencia') || labelText.includes('extends')) {
            return 'inheritance';
        }
        if (labelText.includes('composition') || labelText.includes('composición')) {
            return 'composition';
        }
        if (labelText.includes('aggregation') || labelText.includes('agregación')) {
            return 'aggregation';
        }

        // Por defecto: asociación
        console.log('⚠️ No se detectó tipo específico, usando association');
        return 'association';
    }

    // EXTRACCIÓN INTELIGENTE DE MULTIPLICIDAD
    extractMultiplicityIntelligent(umlData, relationData, linkData, labels, labelIndex) {
        // Prioridad 1: Desde relationData
        if (labelIndex === 0 && relationData.sourceMultiplicity) {
            return this.normalizeMultiplicity(relationData.sourceMultiplicity);
        }
        if (labelIndex === 1 && relationData.targetMultiplicity) {
            return this.normalizeMultiplicity(relationData.targetMultiplicity);
        }

        // Prioridad 2: Desde umlData
        if (labelIndex === 0 && umlData.sourceMultiplicity) {
            return this.normalizeMultiplicity(umlData.sourceMultiplicity);
        }
        if (labelIndex === 1 && umlData.targetMultiplicity) {
            return this.normalizeMultiplicity(umlData.targetMultiplicity);
        }

        // Prioridad 3: Desde linkData
        if (labelIndex === 0 && linkData.sourceMultiplicity) {
            return this.normalizeMultiplicity(linkData.sourceMultiplicity);
        }
        if (labelIndex === 1 && linkData.targetMultiplicity) {
            return this.normalizeMultiplicity(linkData.targetMultiplicity);
        }

        // Prioridad 4: Desde labels visibles
        if (labels && labels[labelIndex]) {
            const labelText = labels[labelIndex].attrs?.text?.text || '';
            if (labelText && this.isValidMultiplicity(labelText)) {
                return this.normalizeMultiplicity(labelText);
            }
        }

        // Sin multiplicidad
        return '';
    }

    // EXTRACCIÓN INTELIGENTE DE NOMBRE DE RELACIÓN
    extractRelationNameIntelligent(relationType, sourceName, targetName,
                                   umlData, relationData, linkData, labels) {
        // Herencia no necesita nombre
        if (relationType === 'inheritance') {
            return '';
        }

        // Prioridad 1: Nombre explícito en relationData
        if (relationData.name && relationData.name.trim() !== '') {
            return relationData.name.trim();
        }

        // Prioridad 2: Nombre en umlData
        if (umlData.name && umlData.name.trim() !== '') {
            return umlData.name.trim();
        }

        // Prioridad 3: Nombre en linkData
        if (linkData.name && linkData.name.trim() !== '') {
            return linkData.name.trim();
        }
        if (linkData.relationName && linkData.relationName.trim() !== '') {
            return linkData.relationName.trim();
        }

        // Prioridad 4: Buscar en labels (label del medio)
        for (const label of labels) {
            const text = label.attrs?.text?.text || '';
            // Ignorar si es multiplicidad
            if (text && !this.isValidMultiplicity(text)) {
                const cleanText = text.trim();
                // Ignorar palabras genéricas
                if (cleanText &&
                    !['association', 'aggregation', 'composition', 'inheritance'].includes(cleanText.toLowerCase())) {
                    return cleanText;
                }
            }
        }

        // Generar nombre descriptivo según tipo
        switch (relationType) {
            case 'composition':
                return `${sourceName}_compone_${targetName}`;
            case 'aggregation':
                return `${sourceName}_agrega_${targetName}`;
            case 'association':
                return `${sourceName}_${targetName}`;
            default:
                return '';
        }
    }

    // NORMALIZACIÓN DE TIPOS
    normalizeRelationType(type) {
        if (!type) return 'association';

        const typeStr = type.toString().toLowerCase();
        const typeMap = {
            'inheritance': 'inheritance',
            'generalization': 'inheritance',
            'herencia': 'inheritance',
            'extends': 'inheritance',

            'composition': 'composition',
            'composición': 'composition',
            'composite': 'composition',

            'aggregation': 'aggregation',
            'agregación': 'aggregation',
            'shared': 'aggregation',

            'association': 'association',
            'asociación': 'association',
            'asociacion': 'association'
        };

        return typeMap[typeStr] || 'association';
    }

    // NORMALIZACIÓN DE MULTIPLICIDAD
    normalizeMultiplicity(mult) {
        if (!mult) return '';

        const text = mult.toString().trim().toLowerCase();

        const multiplicityMap = {
            '*': '*',
            '0..*': '0..*',
            '1..*': '1..*',
            '1': '1',
            '0..1': '0..1',
            'n': '*',
            'm': '*',
            'many': '*',
            'one': '1'
        };

        return multiplicityMap[text] || mult.toString().trim();
    }

    // VALIDAR SI ES MULTIPLICIDAD
    isValidMultiplicity(text) {
        if (!text) return false;
        const cleaned = text.toString().trim();
        const multiplicityPattern = /^(\d+|\*|n|m|many|one|0\.\.1|0\.\.\*|1\.\.\*)$/i;
        return multiplicityPattern.test(cleaned);
    }

    buildXMIStructure(classes, relationships) {
        const timestamp = new Date().toISOString();
        const modelId = 'model_' + Date.now();

        return `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.0" xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML" xmlns:xmi="http://www.omg.org/XMI">
  <uml:Model xmi:id="${modelId}" name="DiagramModel">
    <packagedElement xmi:type="uml:Package" xmi:id="package_main" name="MainPackage">

      <!-- Classes and Interfaces -->
      ${this.generateClassesXML(classes)}

      <!-- Relationships -->
      ${this.generateRelationshipsXML(relationships)}

    </packagedElement>
  </uml:Model>

  <!-- Metadata -->
  <xmi:Extension extender="UMLDiagramEditor">
    <exportInfo>
      <timestamp>${timestamp}</timestamp>
      <version>1.0</version>
      <tool>Laravel UML Diagrammer</tool>
    </exportInfo>
    <diagramLayout>
      ${this.generateLayoutXML(classes)}
    </diagramLayout>
  </xmi:Extension>
</xmi:XMI>`;
    }

    generateClassesXML(classes) {
        return classes.map(cls => {
            const classId = `class_${cls.id}`;
            const stereotype = cls.stereotype ? `stereotype="${cls.stereotype}"` : '';

            return `
      <packagedElement xmi:type="uml:${cls.type === 'interface' ? 'Interface' : 'Class'}"
                       xmi:id="${classId}"
                       name="${this.escapeXML(cls.name)}"
                       ${stereotype}>

        <!-- Attributes -->
        ${this.generateAttributesXML(cls.attributes, classId)}

        <!-- Methods -->
        ${this.generateMethodsXML(cls.methods, classId)}

      </packagedElement>`;
        }).join('');
    }

    generateAttributesXML(attributes, classId) {
        return attributes.map((attr, index) => {
            const attrData = this.parseAttribute(attr);
            const attrId = `${classId}_attr_${index}`;

            return `
        <ownedAttribute xmi:id="${attrId}"
                       name="${this.escapeXML(attrData.name)}"
                       visibility="${attrData.visibility}"
                       type="${this.escapeXML(attrData.type)}"/>`;
        }).join('');
    }

    generateMethodsXML(methods, classId) {
        return methods.map((method, index) => {
            const methodData = this.parseMethod(method);
            const methodId = `${classId}_method_${index}`;

            return `
        <ownedOperation xmi:id="${methodId}"
                       name="${this.escapeXML(methodData.name)}"
                       visibility="${methodData.visibility}"
                       type="${this.escapeXML(methodData.returnType)}"/>`;
        }).join('');
    }

    // GENERACIÓN DE XML SEGÚN TIPO DE RELACIÓN
    generateRelationshipsXML(relationships) {
        return relationships.map(rel => {
            const relId = `rel_${rel.id}`;

            switch (rel.type) {
                case 'inheritance':
                    // Herencia: Generalization (SIN nombre)
                    return `
      <packagedElement xmi:type="uml:Generalization"
                       xmi:id="${relId}"
                       general="class_${rel.targetId}"
                       specific="class_${rel.sourceId}"/>`;

                case 'association':
                case 'aggregation':
                case 'composition':
                    // Determinar aggregation
                    let aggregationType = 'none';
                    if (rel.type === 'composition') {
                        aggregationType = 'composite';
                    } else if (rel.type === 'aggregation') {
                        aggregationType = 'shared';
                    }

                    // Solo incluir nombre si existe y no está vacío
                    const nameAttr = rel.name ? `name="${this.escapeXML(rel.name)}"` : '';

                    return `
      <packagedElement xmi:type="uml:Association"
                       xmi:id="${relId}"
                       ${nameAttr}>
        <memberEnd xmi:idref="${relId}_source"/>
        <memberEnd xmi:idref="${relId}_target"/>
        <ownedEnd xmi:id="${relId}_source"
                 type="class_${rel.sourceId}"
                 aggregation="${aggregationType}"
                 ${rel.sourceMultiplicity ? `multiplicity="${this.escapeXML(rel.sourceMultiplicity)}"` : ''}/>
        <ownedEnd xmi:id="${relId}_target"
                 type="class_${rel.targetId}"
                 aggregation="none"
                 ${rel.targetMultiplicity ? `multiplicity="${this.escapeXML(rel.targetMultiplicity)}"` : ''}/>
      </packagedElement>`;

                default:
                    console.warn('⚠️ Tipo de relación desconocido:', rel.type);
                    return `<!-- Unknown relationship type: ${rel.type} -->`;
            }
        }).join('');
    }

    generateLayoutXML(classes) {
        return classes.map(cls => `
      <classLayout id="class_${cls.id}" x="${cls.position.x}" y="${cls.position.y}"/>`
        ).join('');
    }

    parseAttribute(attributeString) {
        const match = attributeString.match(/^([+\-#~])\s*([^:]+):\s*(.+)$/);
        if (match) {
            return {
                visibility: this.visibilitySymbolToName(match[1]),
                name: match[2].trim(),
                type: match[3].trim()
            };
        }
        return { visibility: 'public', name: attributeString, type: 'String' };
    }

    parseMethod(methodString) {
        const match = methodString.match(/^([+\-#~])\s*([^()]+)\(\):\s*(.+)$/);
        if (match) {
            return {
                visibility: this.visibilitySymbolToName(match[1]),
                name: match[2].trim(),
                returnType: match[3].trim()
            };
        }
        return { visibility: 'public', name: methodString, returnType: 'void' };
    }

    visibilitySymbolToName(symbol) {
        const map = { '+': 'public', '-': 'private', '#': 'protected', '~': 'package' };
        return map[symbol] || 'public';
    }

    escapeXML(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    downloadXMI(content, filename) {
        const blob = new Blob([content], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log('📥 Descarga XMI iniciada:', filename);
    }

    // Método estático para uso rápido
    static quickExportXMI(editor) {
        const exporter = new SimpleXMIExporter(editor);
        exporter.exportToXMI();
    }
}
