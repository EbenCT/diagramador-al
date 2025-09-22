// resources/js/diagram/utils/simpleSQLGenerator.js
// Generación simple de scripts SQL desde diagramas UML

export class SimpleSQLGenerator {
    constructor(editor) {
        this.editor = editor;
        this.typeMapping = {
            'String': 'VARCHAR(255)',
            'int': 'INT',
            'Integer': 'INT',
            'long': 'BIGINT',
            'Long': 'BIGINT',
            'double': 'DECIMAL(10,2)',
            'Double': 'DECIMAL(10,2)',
            'float': 'FLOAT',
            'Float': 'FLOAT',
            'boolean': 'BOOLEAN',
            'Boolean': 'BOOLEAN',
            'Date': 'DATETIME',
            'LocalDateTime': 'DATETIME',
            'LocalDate': 'DATE',
            'BigDecimal': 'DECIMAL(15,2)',
            'char': 'CHAR(1)',
            'Character': 'CHAR(1)',
            'byte[]': 'BLOB',
            'text': 'TEXT'
        };
    }

    generateSQL() {
        try {
            console.log('🗄️ Iniciando generación de SQL...');

            const classes = this.extractClassesForSQL();
            const relationships = this.extractRelationshipsForSQL();

            const sqlScript = this.buildSQLScript(classes, relationships);
            this.downloadSQL(sqlScript, 'database_schema.sql');

            console.log('✅ Generación SQL completada');
        } catch (error) {
            console.error('❌ Error en generación SQL:', error);
            alert('Error al generar SQL: ' + error.message);
        }
    }

    extractClassesForSQL() {
        const classes = [];
        const elements = this.editor.graph.getElements();

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData && umlData.type === 'class') {
                // Solo procesar clases, no interfaces
                const className = umlData.className || 'UnnamedClass';
                const tableName = this.classNameToTableName(className);

                classes.push({
                    id: element.id,
                    className: className,
                    tableName: tableName,
                    attributes: umlData.attributes || [],
                    stereotype: umlData.uml25?.stereotype || null
                });
            }
        });

        console.log('🏗️ Clases para SQL extraídas:', classes.length);
        return classes;
    }

    extractRelationshipsForSQL() {
        const relationships = [];
        const links = this.editor.graph.getLinks();

        links.forEach(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();
            const umlData = link.get('umlData') || {};

            if (source && target) {
                const sourceUml = source.get('umlData');
                const targetUml = target.get('umlData');

                // Solo procesar relaciones entre clases (no interfaces)
                if (sourceUml?.type === 'class' && targetUml?.type === 'class') {
                    relationships.push({
                        id: link.id,
                        sourceId: source.id,
                        targetId: target.id,
                        sourceTable: this.classNameToTableName(sourceUml.className),
                        targetTable: this.classNameToTableName(targetUml.className),
                        type: umlData.relationshipType || 'association',
                        sourceMultiplicity: umlData.sourceMultiplicity || '',
                        targetMultiplicity: umlData.targetMultiplicity || ''
                    });
                }
            }
        });

        console.log('🔗 Relaciones para SQL extraídas:', relationships.length);
        return relationships;
    }

    buildSQLScript(classes, relationships) {
        const timestamp = new Date().toISOString();

        let sql = `-- ===============================================
-- Database Schema Generated from UML Diagram
-- Generated: ${timestamp}
-- Tool: Laravel UML Diagrammer
-- ===============================================

-- Set SQL mode and foreign key checks
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Disable foreign key checks for table creation
SET FOREIGN_KEY_CHECKS = 0;

`;

        // Generate CREATE TABLE statements
        sql += this.generateCreateTables(classes);

        // Generate ALTER TABLE statements for foreign keys
        sql += this.generateForeignKeys(relationships, classes);

        // Generate sample INSERT statements
        sql += this.generateSampleData(classes);

        sql += `
-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ===============================================
-- End of generated schema
-- ===============================================
`;

        return sql;
    }

    generateCreateTables(classes) {
        let sql = `-- ===============================================
-- CREATE TABLES
-- ===============================================

`;

        classes.forEach(cls => {
            sql += this.generateCreateTable(cls);
        });

        return sql;
    }

    generateCreateTable(cls) {
        const tableName = cls.tableName;
        let sql = `-- Table: ${tableName} (from class ${cls.className})
CREATE TABLE \`${tableName}\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n`;

        // Process attributes
        cls.attributes.forEach(attr => {
            const column = this.parseAttributeForSQL(attr);
            if (column) {
                sql += `    \`${column.name}\` ${column.type}${column.nullable ? '' : ' NOT NULL'},\n`;
            }
        });

        // Add common audit fields
        sql += `    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

        return sql;
    }

    generateForeignKeys(relationships, classes) {
        let sql = `-- ===============================================
-- FOREIGN KEY CONSTRAINTS
-- ===============================================

`;

        relationships.forEach(rel => {
            const fkInfo = this.analyzeForeignKeyRelationship(rel, classes);
            if (fkInfo) {
                sql += `-- Foreign key: ${fkInfo.description}
ALTER TABLE \`${fkInfo.childTable}\`
ADD CONSTRAINT \`fk_${fkInfo.childTable}_${fkInfo.parentTable}\`
FOREIGN KEY (\`${fkInfo.foreignKeyColumn}\`)
REFERENCES \`${fkInfo.parentTable}\` (\`id\`)
ON DELETE ${fkInfo.onDelete}
ON UPDATE CASCADE;

`;
            }
        });

        return sql;
    }

    generateSampleData(classes) {
        let sql = `-- ===============================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ===============================================

`;

        classes.forEach(cls => {
            sql += `-- Sample data for ${cls.tableName}
-- INSERT INTO \`${cls.tableName}\` (\`column1\`, \`column2\`) VALUES ('value1', 'value2');

`;
        });

        return sql;
    }

    parseAttributeForSQL(attributeString) {
        // Parse UML attribute format: "+ name: Type" or "- name: Type"
        const match = attributeString.match(/^([+\-#~])\s*([^:]+):\s*(.+)$/);
        if (!match) return null;

        const visibility = match[1];
        const name = match[2].trim();
        const type = match[3].trim();

        // Convert to snake_case for database
        const columnName = this.camelToSnakeCase(name);
        const sqlType = this.mapUMLTypeToSQL(type);

        return {
            name: columnName,
            type: sqlType,
            nullable: visibility === '-' ? false : true // Private attributes are NOT NULL
        };
    }

    analyzeForeignKeyRelationship(rel, classes) {
        const sourceClass = classes.find(c => c.id === rel.sourceId);
        const targetClass = classes.find(c => c.id === rel.targetId);

        if (!sourceClass || !targetClass) return null;

        let fkInfo = null;

        switch (rel.type) {
            case 'association':
                // Create FK based on multiplicity
                if (rel.targetMultiplicity.includes('1') && !rel.sourceMultiplicity.includes('1')) {
                    // Many-to-One: source table gets FK to target
                    fkInfo = {
                        childTable: sourceClass.tableName,
                        parentTable: targetClass.tableName,
                        foreignKeyColumn: `${targetClass.tableName}_id`,
                        description: `${sourceClass.className} → ${targetClass.className}`,
                        onDelete: 'SET NULL'
                    };
                }
                break;

            case 'aggregation':
                // Source table gets FK to target (weak composition)
                fkInfo = {
                    childTable: sourceClass.tableName,
                    parentTable: targetClass.tableName,
                    foreignKeyColumn: `${targetClass.tableName}_id`,
                    description: `Aggregation: ${sourceClass.className} → ${targetClass.className}`,
                    onDelete: 'SET NULL'
                };
                break;

            case 'composition':
                // Source table gets FK to target (strong composition)
                fkInfo = {
                    childTable: sourceClass.tableName,
                    parentTable: targetClass.tableName,
                    foreignKeyColumn: `${targetClass.tableName}_id`,
                    description: `Composition: ${sourceClass.className} → ${targetClass.className}`,
                    onDelete: 'CASCADE'
                };
                break;

            case 'inheritance':
                // Child table inherits from parent (could be table-per-subclass)
                fkInfo = {
                    childTable: sourceClass.tableName,
                    parentTable: targetClass.tableName,
                    foreignKeyColumn: 'id', // Same ID as parent
                    description: `Inheritance: ${sourceClass.className} extends ${targetClass.className}`,
                    onDelete: 'CASCADE'
                };
                break;
        }

        return fkInfo;
    }

    classNameToTableName(className) {
        // Convert PascalCase to snake_case and make plural
        return this.camelToSnakeCase(className) + 's';
    }

    camelToSnakeCase(str) {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    mapUMLTypeToSQL(umlType) {
        // Handle generic types like List<String>
        const baseType = umlType.replace(/<.*>/, '').trim();

        // Handle arrays
        if (umlType.includes('[]')) {
            return 'JSON'; // Use JSON for arrays in MySQL
        }

        // Handle collections
        if (baseType.includes('List') || baseType.includes('Set') || baseType.includes('Collection')) {
            return 'JSON'; // Use JSON for collections
        }

        return this.typeMapping[baseType] || 'VARCHAR(255)';
    }

    downloadSQL(content, filename) {
        const blob = new Blob([content], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log('📥 Descarga SQL iniciada:', filename);
    }

    // Método estático para uso rápido
    static quickGenerateSQL(editor) {
        const generator = new SimpleSQLGenerator(editor);
        generator.generateSQL();
    }
}
