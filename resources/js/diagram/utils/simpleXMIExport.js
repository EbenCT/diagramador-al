// resources/js/diagram/utils/simpleXMIExport.js
// Exportación XMI 100% compatible con Enterprise Architect 13.5
// CORREGIDO: Herencias, composiciones y multiplicidades

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

    extractRelationships() {
        const relationships = [];
        const links = this.editor.graph.getLinks();
        const elements = this.editor.graph.getElements();

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
                const umlData = link.get('umlData') || {};
                const relationData = link.get('relationData') || {};
                const linkData = link.get('linkData') || {};
                const attrs = link.attributes || {};
                const labels = link.get('labels') || [];

                const sourceName = elementMap.get(source.id) || 'Unknown';
                const targetName = elementMap.get(target.id) || 'Unknown';

                let relationType = this.detectRelationTypeIntelligent(
                    link, umlData, relationData, linkData, attrs, labels
                );

                const sourceMultiplicity = this.extractMultiplicityIntelligent(
                    umlData, relationData, linkData, labels, 0
                );

                const targetMultiplicity = this.extractMultiplicityIntelligent(
                    umlData, relationData, linkData, labels, 1
                );

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

                console.log('✅ Relación:', {
                    type: relationType,
                    from: sourceName,
                    to: targetName,
                    mult: `${sourceMultiplicity} → ${targetMultiplicity}`
                });
            }
        });

        console.log('🔗 Total relaciones:', relationships.length);
        return relationships;
    }

    detectRelationTypeIntelligent(link, umlData, relationData, linkData, attrs, labels) {
        if (relationData.type && relationData.type !== 'standard.Link') {
            return this.normalizeRelationType(relationData.type);
        }
        if (relationData.relationshipType) {
            return this.normalizeRelationType(relationData.relationshipType);
        }
        if (umlData.relationshipType) {
            return this.normalizeRelationType(umlData.relationshipType);
        }
        if (umlData.type && umlData.type !== 'standard.Link') {
            return this.normalizeRelationType(umlData.type);
        }
        if (linkData.relationshipType) {
            return this.normalizeRelationType(linkData.relationshipType);
        }
        if (linkData.type && linkData.type !== 'standard.Link') {
            return this.normalizeRelationType(linkData.type);
        }

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

        const linkAttrs = attrs.attrs || link.get('attrs') || {};
        const line = linkAttrs.line || linkAttrs['.connection'] || {};

        if (line.sourceMarker?.fill === 'black' || line.targetMarker?.fill === 'black') {
            return 'composition';
        }
        if (line.sourceMarker?.fill === 'white' || line.targetMarker?.fill === 'white') {
            return 'aggregation';
        }
        if (line.targetMarker?.type === 'path' && line.targetMarker?.fill === 'white') {
            return 'inheritance';
        }

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

        return 'association';
    }

    extractMultiplicityIntelligent(umlData, relationData, linkData, labels, labelIndex) {
        if (labelIndex === 0 && relationData.sourceMultiplicity) {
            return this.normalizeMultiplicity(relationData.sourceMultiplicity);
        }
        if (labelIndex === 1 && relationData.targetMultiplicity) {
            return this.normalizeMultiplicity(relationData.targetMultiplicity);
        }
        if (labelIndex === 0 && umlData.sourceMultiplicity) {
            return this.normalizeMultiplicity(umlData.sourceMultiplicity);
        }
        if (labelIndex === 1 && umlData.targetMultiplicity) {
            return this.normalizeMultiplicity(umlData.targetMultiplicity);
        }
        if (labelIndex === 0 && linkData.sourceMultiplicity) {
            return this.normalizeMultiplicity(linkData.sourceMultiplicity);
        }
        if (labelIndex === 1 && linkData.targetMultiplicity) {
            return this.normalizeMultiplicity(linkData.targetMultiplicity);
        }
        if (labels && labels[labelIndex]) {
            const labelText = labels[labelIndex].attrs?.text?.text || '';
            if (labelText && this.isValidMultiplicity(labelText)) {
                return this.normalizeMultiplicity(labelText);
            }
        }
        return '';
    }

    extractRelationNameIntelligent(relationType, sourceName, targetName,
                                   umlData, relationData, linkData, labels) {
        if (relationType === 'inheritance') {
            return '';
        }
        if (relationData.name && relationData.name.trim() !== '') {
            return relationData.name.trim();
        }
        if (umlData.name && umlData.name.trim() !== '') {
            return umlData.name.trim();
        }
        if (linkData.name && linkData.name.trim() !== '') {
            return linkData.name.trim();
        }
        if (linkData.relationName && linkData.relationName.trim() !== '') {
            return linkData.relationName.trim();
        }

        for (const label of labels) {
            const text = label.attrs?.text?.text || '';
            if (text && !this.isValidMultiplicity(text)) {
                const cleanText = text.trim();
                if (cleanText &&
                    !['association', 'aggregation', 'composition', 'inheritance'].includes(cleanText.toLowerCase())) {
                    return cleanText;
                }
            }
        }

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
      ${this.generateClassesXML(classes, relationships)}

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

    generateClassesXML(classes, relationships) {
        return classes.map(cls => {
            const classId = `class_${cls.id}`;
            const stereotype = cls.stereotype ? `stereotype="${cls.stereotype}"` : '';

            // NUEVO: Buscar herencias donde esta clase es la hija (specific)
            const inheritances = relationships
                .filter(rel => rel.type === 'inheritance' && rel.sourceId === cls.id)
                .map(rel => {
                    const relId = `rel_${rel.id}`;
                    return `
        <generalization xmi:type="uml:Generalization"
                       xmi:id="${relId}"
                       general="class_${rel.targetId}"/>`;
                }).join('');

            return `
      <packagedElement xmi:type="uml:${cls.type === 'interface' ? 'Interface' : 'Class'}"
                       xmi:id="${classId}"
                       name="${this.escapeXML(cls.name)}"
                       ${stereotype}>

        <!-- Attributes -->
        ${this.generateAttributesXML(cls.attributes, classId)}

        <!-- Methods -->
        ${this.generateMethodsXML(cls.methods, classId)}

        <!-- Generalizations (Inheritance) -->
        ${inheritances}

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
        return relationships
            .filter(rel => rel.type !== 'inheritance') // Las herencias ya están en las clases
            .map(rel => {
                const relId = `rel_${rel.id}`;

                // CRÍTICO: El 'type' de cada extremo apunta a la clase del OTRO extremo
                let sourceAggregation = 'none';
                let targetAggregation = 'none';

                if (rel.type === 'composition') {
                    // El rombo va en el SOURCE (contenedor)
                    sourceAggregation = 'composite';
                } else if (rel.type === 'aggregation') {
                    // El rombo va en el SOURCE
                    sourceAggregation = 'shared';
                }

                const nameAttr = rel.name ? `name="${this.escapeXML(rel.name)}"` : '';

                // CORREGIDO: Multiplicidades intercambiadas
                // end1 apunta a target, por lo tanto lleva la multiplicidad de target
                const end1Mult = rel.targetMultiplicity ?
                    `\n                 <lowerValue xmi:type="uml:LiteralInteger" value="${this.getMultiplicityLower(rel.targetMultiplicity)}"/>
                 <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${this.getMultiplicityUpper(rel.targetMultiplicity)}"/>` : '';

                // end2 apunta a source, por lo tanto lleva la multiplicidad de source
                const end2Mult = rel.sourceMultiplicity ?
                    `\n                 <lowerValue xmi:type="uml:LiteralInteger" value="${this.getMultiplicityLower(rel.sourceMultiplicity)}"/>
                 <upperValue xmi:type="uml:LiteralUnlimitedNatural" value="${this.getMultiplicityUpper(rel.sourceMultiplicity)}"/>` : '';

                return `
      <packagedElement xmi:type="uml:Association"
                       xmi:id="${relId}"
                       ${nameAttr}>
        <memberEnd xmi:idref="${relId}_end1"/>
        <memberEnd xmi:idref="${relId}_end2"/>
        <ownedEnd xmi:id="${relId}_end1"
                 name=""
                 type="class_${rel.targetId}"
                 aggregation="${sourceAggregation}">${end1Mult}
        </ownedEnd>
        <ownedEnd xmi:id="${relId}_end2"
                 name=""
                 type="class_${rel.sourceId}"
                 aggregation="${targetAggregation}">${end2Mult}
        </ownedEnd>
      </packagedElement>`;
            }).join('');
    }

    // NUEVO: Extraer valores lower y upper de multiplicidad para EA
    getMultiplicityLower(mult) {
        if (!mult) return '0';
        const str = mult.toString().trim();

        if (str === '*' || str === '0..*') return '0';
        if (str === '1' || str === '1..*') return '1';
        if (str === '0..1') return '0';

        // Extraer número antes de ..
        const match = str.match(/^(\d+)/);
        return match ? match[1] : '0';
    }

    getMultiplicityUpper(mult) {
        if (!mult) return '*';
        const str = mult.toString().trim();

        if (str === '*' || str === '0..*' || str === '1..*') return '*';
        if (str === '1') return '1';
        if (str === '0..1') return '1';

        // Extraer número después de ..
        const match = str.match(/\.\.(\d+|\*)/);
        return match ? match[1] : str;
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

    static quickExportXMI(editor) {
        const exporter = new SimpleXMIExporter(editor);
        exporter.exportToXMI();
    }
}
