// resources/js/diagram/utils/simpleSQLGenerator.js
// Generación de scripts SQL desde diagramas UML - VERSIÓN CORREGIDA

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
            console.log('📊 Clases extraídas:', classes);

            const relationships = this.extractRelationshipsForSQL();
            console.log('🔗 Relaciones extraídas:', relationships);

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
            console.log('🔍 Elemento encontrado:', {
                id: element.id,
                umlData: umlData
            });

            if (umlData && umlData.type === 'class') {
                const className = umlData.className || 'UnnamedClass';
                const tableName = this.classNameToTableName(className);

                classes.push({
                    id: element.id,
                    className: className,
                    tableName: tableName,
                    attributes: umlData.attributes || [],
                    methods: umlData.methods || [],
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

        console.log(`🔍 Total de links encontrados: ${links.length}`);

        links.forEach(link => {
            const source = link.getSourceElement();
            const target = link.getTargetElement();

            // Probar diferentes formas de obtener los datos de la relación
            const umlData = link.get('umlData') || {};
            const relationData = link.get('relationData') || {};
            const attrs = link.get('attrs') || {};
            const labels = link.get('labels') || [];
            const linkData = { ...umlData, ...relationData };

            console.log('🔍 Link encontrado:', {
                id: link.id,
                umlData: umlData,
                relationData: relationData,
                attrs: attrs,
                labels: labels,
                linkData: linkData,
                source: source?.id,
                target: target?.id,
                // Probar todas las propiedades posibles
                allProps: {
                    type: link.get('type'),
                    relationshipType: linkData.relationshipType || umlData.relationshipType || relationData.type,
                    sourceMultiplicity: linkData.sourceMultiplicity || umlData.sourceMultiplicity,
                    targetMultiplicity: linkData.targetMultiplicity || umlData.targetMultiplicity
                }
            });

            if (source && target) {
                const sourceUml = source.get('umlData');
                const targetUml = target.get('umlData');

                if (sourceUml?.type === 'class' && targetUml?.type === 'class') {
                    // Intentar múltiples formas de obtener el tipo de relación
                    let relationshipType =
                        linkData.relationshipType ||
                        linkData.type ||
                        umlData.relationshipType ||
                        relationData.type ||
                        relationData.relationshipType ||
                        link.get('type') ||
                        'association';

                    // Si el tipo es 'standard.Link', buscar en otras propiedades
                    if (relationshipType === 'standard.Link') {
                        // Buscar en labels si tiene información del tipo
                        const labelText = labels.map(label => label.attrs?.text?.text).join(' ');
                        if (labelText.includes('inheritance') || labelText.includes('herencia')) {
                            relationshipType = 'inheritance';
                        } else if (labelText.includes('composition')) {
                            relationshipType = 'composition';
                        } else if (labelText.includes('aggregation')) {
                            relationshipType = 'aggregation';
                        }
                    }

                    const relationship = {
                        id: link.id,
                        sourceId: source.id,
                        targetId: target.id,
                        sourceClass: sourceUml.className,
                        targetClass: targetUml.className,
                        sourceTable: this.classNameToTableName(sourceUml.className),
                        targetTable: this.classNameToTableName(targetUml.className),
                        type: relationshipType,
                        sourceMultiplicity: linkData.sourceMultiplicity || umlData.sourceMultiplicity || relationData.sourceMultiplicity || '',
                        targetMultiplicity: linkData.targetMultiplicity || umlData.targetMultiplicity || relationData.targetMultiplicity || '',
                        name: linkData.name || linkData.relationName || umlData.name || relationData.name || ''
                    };

                    relationships.push(relationship);
                    console.log('✅ Relación agregada:', relationship);
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

        // Separar herencias de otras relaciones
        const inheritances = relationships.filter(rel =>
            rel.type === 'inheritance' || rel.type === 'generalization'
        );
        const associations = relationships.filter(rel =>
            rel.type !== 'inheritance' && rel.type !== 'generalization'
        );

        console.log('🧬 Herencias detectadas:', inheritances);
        console.log('🔗 Asociaciones detectadas:', associations);

        // Generate CREATE TABLE statements
        sql += this.generateCreateTables(classes, inheritances);

        // Generate FOREIGN KEY constraints for inheritance
        sql += this.generateInheritanceForeignKeys(inheritances);

        // Generate FOREIGN KEY constraints for associations
        sql += this.generateAssociationForeignKeys(associations, classes);

        // Generate optimized indexes
        sql += this.generateOptimizedIndexes(classes);

        // Generate useful views for inheritance
        sql += this.generateUsefulViews(classes, inheritances);

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

    generateCreateTables(classes, inheritances) {
        let sql = `-- ===============================================
-- CREATE TABLES
-- ===============================================

`;

        // Separar clases padre e hijas para orden de creación
        const childTableNames = inheritances.map(inh => inh.sourceTable);
        const parentClasses = classes.filter(cls => !childTableNames.includes(cls.tableName));
        const childClasses = classes.filter(cls => childTableNames.includes(cls.tableName));

        // Crear primero las clases padre
        parentClasses.forEach(cls => {
            sql += this.generateCreateTable(cls, null);
        });

        // Luego las clases hijas con FK a padre
        childClasses.forEach(cls => {
            const inheritance = inheritances.find(inh => inh.sourceTable === cls.tableName);
            sql += this.generateCreateTable(cls, inheritance);
        });

        return sql;
    }

    generateCreateTable(cls, inheritance = null) {
        const tableName = cls.tableName;
        let sql = `-- Table: ${tableName} (from class ${cls.className})`;

        if (inheritance) {
            sql += ` - hereda de ${inheritance.targetTable}`;
        }

        sql += `\nCREATE TABLE \`${tableName}\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n`;

        // Si es herencia, añadir FK al padre
        if (inheritance) {
            const parentSingular = this.getTableNameSingular(inheritance.targetTable);
            sql += `    \`${parentSingular}_id\` INT NOT NULL UNIQUE, -- FK a ${inheritance.targetTable} (herencia)\n`;
        }

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

    generateInheritanceForeignKeys(inheritances) {
        if (inheritances.length === 0) {
            return `-- ===============================================
-- FOREIGN KEY CONSTRAINTS - HERENCIAS
-- ===============================================
-- No se detectaron relaciones de herencia

`;
        }

        let sql = `-- ===============================================
-- FOREIGN KEY CONSTRAINTS - HERENCIAS
-- ===============================================

`;

        inheritances.forEach(inh => {
            const parentSingular = this.getTableNameSingular(inh.targetTable);
            sql += `-- Herencia: ${inh.sourceClass} hereda de ${inh.targetClass}
ALTER TABLE \`${inh.sourceTable}\`
ADD CONSTRAINT \`fk_${inh.sourceTable}_${parentSingular}\`
FOREIGN KEY (\`${parentSingular}_id\`) REFERENCES \`${inh.targetTable}\` (\`id\`)
ON DELETE CASCADE ON UPDATE CASCADE;

`;
        });

        return sql;
    }

    generateAssociationForeignKeys(associations, classes) {
        if (associations.length === 0) {
            return `-- ===============================================
-- FOREIGN KEY CONSTRAINTS - ASOCIACIONES
-- ===============================================
-- No se detectaron relaciones de asociación

`;
        }

        let sql = `-- ===============================================
-- FOREIGN KEY CONSTRAINTS - ASOCIACIONES
-- ===============================================

`;

        associations.forEach(rel => {
            console.log('🔧 Procesando relación:', rel);

            const fkInfo = this.analyzeForeignKeyRelationship(rel, classes);
            console.log('🔑 FK Info generada:', fkInfo);

            if (fkInfo) {
                // Si necesitamos añadir la columna FK
                if (fkInfo.addColumn) {
                    sql += `-- Añadir columna FK para ${fkInfo.description}
ALTER TABLE \`${fkInfo.childTable}\`
ADD COLUMN \`${fkInfo.foreignKeyColumn}\` INT${fkInfo.nullable ? '' : ' NOT NULL'};

`;
                }

                sql += `-- ${fkInfo.description}
ALTER TABLE \`${fkInfo.childTable}\`
ADD CONSTRAINT \`fk_${fkInfo.childTable}_${fkInfo.parentTable}\`
FOREIGN KEY (\`${fkInfo.foreignKeyColumn}\`) REFERENCES \`${fkInfo.parentTable}\` (\`id\`)
ON DELETE ${fkInfo.onDelete} ON UPDATE CASCADE;

`;
            } else if (rel.type === 'association' &&
                       (rel.sourceMultiplicity.includes('*') && rel.targetMultiplicity.includes('*'))) {
                // Relación muchos a muchos - sugerir tabla intermedia
                const table1Singular = this.getTableNameSingular(rel.sourceTable);
                const table2Singular = this.getTableNameSingular(rel.targetTable);

                sql += `-- Relación muchos a muchos: ${rel.sourceClass} <-> ${rel.targetClass}
-- Crear tabla intermedia (descomente si es necesario):
-- CREATE TABLE \`${table1Singular}_${table2Singular}\` (
--     \`id\` INT AUTO_INCREMENT PRIMARY KEY,
--     \`${table1Singular}_id\` INT NOT NULL,
--     \`${table2Singular}_id\` INT NOT NULL,
--     \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     UNIQUE KEY \`unique_relation\` (\`${table1Singular}_id\`, \`${table2Singular}_id\`),
--     FOREIGN KEY (\`${table1Singular}_id\`) REFERENCES \`${rel.sourceTable}\` (\`id\`) ON DELETE CASCADE,
--     FOREIGN KEY (\`${table2Singular}_id\`) REFERENCES \`${rel.targetTable}\` (\`id\`) ON DELETE CASCADE
-- );

`;
            }
        });

        return sql;
    }

    analyzeForeignKeyRelationship(rel, classes) {
        const sourceClass = classes.find(c => c.id === rel.sourceId);
        const targetClass = classes.find(c => c.id === rel.targetId);

        if (!sourceClass || !targetClass) {
            console.warn('⚠️ No se encontraron clases para relación:', rel);
            return null;
        }

        let fkInfo = null;
        const sourceMultiplicity = rel.sourceMultiplicity || '';
        const targetMultiplicity = rel.targetMultiplicity || '';

        console.log(`🔍 Analizando relación ${rel.type}: ${sourceClass.className}(${sourceMultiplicity}) -> ${targetClass.className}(${targetMultiplicity})`);

        // Lógica mejorada basada en multiplicidad
        if (targetMultiplicity.includes('1') && sourceMultiplicity.includes('*')) {
            // Muchos a uno: FK en tabla source hacia target
            fkInfo = {
                childTable: sourceClass.tableName,
                parentTable: targetClass.tableName,
                foreignKeyColumn: `${this.getTableNameSingular(targetClass.tableName)}_id`,
                description: `${rel.type}: ${sourceClass.className} (*) -> ${targetClass.className} (1)`,
                onDelete: rel.type === 'composition' ? 'CASCADE' : 'RESTRICT',
                addColumn: true,
                nullable: rel.type === 'aggregation'
            };
        } else if (sourceMultiplicity.includes('1') && targetMultiplicity.includes('*')) {
            // Uno a muchos: FK en tabla target hacia source
            fkInfo = {
                childTable: targetClass.tableName,
                parentTable: sourceClass.tableName,
                foreignKeyColumn: `${this.getTableNameSingular(sourceClass.tableName)}_id`,
                description: `${rel.type}: ${sourceClass.className} (1) -> ${targetClass.className} (*)`,
                onDelete: rel.type === 'composition' ? 'CASCADE' : 'RESTRICT',
                addColumn: true,
                nullable: rel.type === 'aggregation'
            };
        } else if (!sourceMultiplicity.includes('*') && !targetMultiplicity.includes('*')) {
            // Uno a uno: FK en tabla source hacia target (por convención)
            fkInfo = {
                childTable: sourceClass.tableName,
                parentTable: targetClass.tableName,
                foreignKeyColumn: `${this.getTableNameSingular(targetClass.tableName)}_id`,
                description: `${rel.type}: ${sourceClass.className} (1) -> ${targetClass.className} (1)`,
                onDelete: rel.type === 'composition' ? 'CASCADE' : 'SET NULL',
                addColumn: true,
                nullable: true
            };
        } else if (sourceMultiplicity.includes('*') && targetMultiplicity.includes('*')) {
            // Muchos a muchos: requiere tabla intermedia
            console.log('🔄 Relación muchos a muchos detectada, requiere tabla intermedia');
            return null;
        }

        console.log('✅ FK Info creada:', fkInfo);
        return fkInfo;
    }

    generateOptimizedIndexes(classes) {
        let sql = `-- ===============================================
-- ÍNDICES OPTIMIZADOS
-- ===============================================

`;

        classes.forEach(cls => {
            // Índices para campos únicos comunes
            const commonUniqueFields = ['email', 'codigo', 'numero_est', 'codigo_emp'];

            cls.attributes.forEach(attr => {
                const column = this.parseAttributeForSQL(attr);
                if (column && commonUniqueFields.some(field => column.name.includes(field))) {
                    sql += `CREATE INDEX \`idx_${cls.tableName}_${column.name}\` ON \`${cls.tableName}\` (\`${column.name}\`);\n`;
                }
            });
        });

        sql += '\n';
        return sql;
    }

    generateUsefulViews(classes, inheritances) {
        if (inheritances.length === 0) {
            return `-- ===============================================
-- VISTAS ÚTILES
-- ===============================================
-- No se generaron vistas (sin herencias detectadas)

`;
        }

        let sql = `-- ===============================================
-- VISTAS ÚTILES
-- ===============================================

`;

        inheritances.forEach(inh => {
            const childClass = classes.find(c => c.tableName === inh.sourceTable);
            const parentSingular = this.getTableNameSingular(inh.targetTable);

            if (childClass) {
                sql += `-- Vista completa: ${inh.sourceClass} con datos de ${inh.targetClass}
CREATE VIEW \`v_${inh.sourceTable}_completos\` AS
SELECT
    c.id,
    p.*,
    c.*
FROM \`${inh.sourceTable}\` c
JOIN \`${inh.targetTable}\` p ON c.\`${parentSingular}_id\` = p.\`id\`;

`;
            }
        });

        return sql;
    }

    getTableNameSingular(pluralTableName) {
        // Pluralización simple: quitar la 's' final si existe
        if (pluralTableName.endsWith('s')) {
            return pluralTableName.slice(0, -1);
        }
        return pluralTableName;
    }

    classNameToTableName(className) {
        // Convert PascalCase to snake_case and make plural
        return this.camelToSnakeCase(className) + 's';
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
