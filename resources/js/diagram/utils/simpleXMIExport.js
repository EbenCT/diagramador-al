// resources/js/diagram/utils/simpleXMIExport.js
// Exportación simple de diagramas UML a formato XMI 2.5

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

        links.forEach(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();
            const umlData = link.get('umlData') || {};

            if (source && target) {
                relationships.push({
                    id: link.id,
                    sourceId: source.id,
                    targetId: target.id,
                    type: umlData.relationshipType || 'association',
                    sourceName: umlData.sourceName || '',
                    targetName: umlData.targetName || '',
                    sourceMultiplicity: umlData.sourceMultiplicity || '',
                    targetMultiplicity: umlData.targetMultiplicity || ''
                });
            }
        });

        console.log('🔗 Relaciones extraídas:', relationships.length);
        return relationships;
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

    generateRelationshipsXML(relationships) {
        return relationships.map(rel => {
            const relId = `rel_${rel.id}`;

            switch (rel.type) {
                case 'inheritance':
                    return `
      <packagedElement xmi:type="uml:Generalization"
                       xmi:id="${relId}"
                       general="class_${rel.targetId}"
                       specific="class_${rel.sourceId}"/>`;

                case 'association':
                case 'aggregation':
                case 'composition':
                    return `
      <packagedElement xmi:type="uml:Association"
                       xmi:id="${relId}"
                       name="${rel.type}_${rel.sourceId}_${rel.targetId}">
        <memberEnd xmi:idref="${relId}_source"/>
        <memberEnd xmi:idref="${relId}_target"/>
        <ownedEnd xmi:id="${relId}_source"
                 type="class_${rel.sourceId}"
                 aggregation="${rel.type === 'composition' ? 'composite' : rel.type === 'aggregation' ? 'shared' : 'none'}"
                 multiplicity="${this.escapeXML(rel.sourceMultiplicity)}"/>
        <ownedEnd xmi:id="${relId}_target"
                 type="class_${rel.targetId}"
                 multiplicity="${this.escapeXML(rel.targetMultiplicity)}"/>
      </packagedElement>`;

                default:
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
        // Parsear formato: "+ name: Type" o "- name: Type"
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
        // Parsear formato: "+ methodName(): ReturnType"
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
