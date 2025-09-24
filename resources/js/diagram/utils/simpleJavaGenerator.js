// resources/js/diagram/utils/simpleJavaGenerator.js
// Generador simple de proyectos Spring Boot desde diagramas UML

import JSZip from 'jszip';

export class SimpleJavaGenerator {
    constructor(editor) {
        this.editor = editor;
        this.packageName = 'com.proyecto';
        this.projectName = 'mi-proyecto';
        this.groupId = 'com.proyecto';
        this.artifactId = 'mi-proyecto-spring-boot';
        this.version = '1.0.0';
    }

    async generateJavaProject() {
        try {
            console.log('☕ Iniciando generación de proyecto Spring Boot...');

            // Configurar proyecto básico
            this.setupProjectConfig();

            // Extraer clases y relaciones del diagrama
            const classes = this.extractClasses();
            const relationships = this.extractRelationships();

            if (classes.length === 0) {
                alert('⚠️ No hay clases en el diagrama para generar código.');
                return;
            }

            // Generar proyecto completo
            const zip = await this.buildSpringBootProject(classes, relationships);

            // Descargar
            this.downloadProject(zip);

            console.log('✅ Proyecto Spring Boot generado exitosamente');
        } catch (error) {
            console.error('❌ Error generando proyecto Java:', error);
            alert('Error al generar proyecto: ' + error.message);
        }
    }

    setupProjectConfig() {
        // Obtener título del diagrama si está disponible
        const diagramTitle = window.diagramTitle || 'MiProyecto';
        this.projectName = this.sanitizeProjectName(diagramTitle);
        this.artifactId = this.projectName.toLowerCase().replace(/\s+/g, '-');
        this.packageName = `com.${this.artifactId.replace(/-/g, '')}`;

        console.log('🏗️ Configuración del proyecto:', {
            projectName: this.projectName,
            packageName: this.packageName,
            artifactId: this.artifactId
        });
    }

    extractClasses() {
        const classes = [];
        const elements = this.editor.graph.getElements();

        elements.forEach(element => {
            const umlData = element.get('umlData');
            if (umlData && umlData.type === 'class') {
                const className = umlData.className || 'UnnamedClass';
                const stereotype = umlData.uml25?.stereotype || 'entity'; // Default a entity

                classes.push({
                    id: element.id,
                    name: className,
                    stereotype: stereotype,
                    attributes: umlData.attributes || [],
                    methods: umlData.methods || [],
                    responsibilities: umlData.uml25?.responsibilities || [],
                    constraints: umlData.uml25?.constraints || []
                });
            }
        });

        console.log('🏗️ Clases extraídas:', classes.length, 'con estereotipos:',
            classes.map(c => `${c.name}(${c.stereotype})`));
        return classes;
    }

extractRelationships() {
    const relationships = [];
    const links = this.editor.graph.getLinks();

    links.forEach(link => {
        const source = link.getSourceElement();
        const target = link.getTargetElement();
        const umlData = link.get('umlData') || {};
        const relationData = link.get('relationData') || {}; // AGREGAR ESTA LÍNEA

        if (source && target) {
            const sourceUml = source.get('umlData');
            const targetUml = target.get('umlData');

            if (sourceUml?.type === 'class' && targetUml?.type === 'class') {
                relationships.push({
                    sourceClass: sourceUml.className,
                    targetClass: targetUml.className,
                    type: relationData.type || umlData.relationshipType || umlData.type || 'association', // CAMBIAR ESTA LÍNEA
                    sourceMultiplicity: umlData.sourceMultiplicity || relationData.sourceMultiplicity || '',
                    targetMultiplicity: umlData.targetMultiplicity || relationData.targetMultiplicity || ''
                });
            }
        }
    });

    console.log('🔗 Relaciones extraídas:', relationships.length);
    return relationships;
}

    async buildSpringBootProject(classes, relationships) {
        const zip = new JSZip();

        // Estructura base del proyecto Maven
        const srcPath = `src/main/java/${this.packageName.replace(/\./g, '/')}`;
        const resourcesPath = 'src/main/resources';
        const testPath = `src/test/java/${this.packageName.replace(/\./g, '/')}`;

        // Categorizar clases por estereotipo
        const entitiesClasses = classes.filter(c => c.stereotype === 'entity');
        const serviceClasses = classes.filter(c => c.stereotype === 'service');
        const repositoryClasses = classes.filter(c => c.stereotype === 'repository');
        const controllerClasses = classes.filter(c => c.stereotype === 'controller');
        const utilityClasses = classes.filter(c => c.stereotype === 'utility');

        // Generar entidades JPA
        entitiesClasses.forEach(cls => {
            const entityCode = this.generateEntity(cls, relationships);
            zip.file(`${srcPath}/domain/model/${cls.name}.java`, entityCode);

            // Generar Repository para cada entidad
            const repoCode = this.generateRepository(cls);
            zip.file(`${srcPath}/domain/repository/${cls.name}Repository.java`, repoCode);

            // Generar Service para cada entidad
            const serviceCode = this.generateService(cls);
            zip.file(`${srcPath}/domain/service/${cls.name}Service.java`, serviceCode);

            // Generar Controller REST para cada entidad
            const controllerCode = this.generateController(cls);
            zip.file(`${srcPath}/web/controller/${cls.name}Controller.java`, controllerCode);

            // Generar DTOs
            const requestDtoCode = this.generateRequestDTO(cls);
            const responseDtoCode = this.generateResponseDTO(cls);
            zip.file(`${srcPath}/web/dto/${cls.name}RequestDTO.java`, requestDtoCode);
            zip.file(`${srcPath}/web/dto/${cls.name}ResponseDTO.java`, responseDtoCode);
        });

        // Generar servicios standalone
        serviceClasses.forEach(cls => {
            const serviceCode = this.generateStandaloneService(cls);
            zip.file(`${srcPath}/domain/service/${cls.name}.java`, serviceCode);
        });

        // Generar repositorios standalone
        repositoryClasses.forEach(cls => {
            const repoCode = this.generateStandaloneRepository(cls);
            zip.file(`${srcPath}/domain/repository/${cls.name}.java`, repoCode);
        });

        // Generar controladores standalone
        controllerClasses.forEach(cls => {
            const controllerCode = this.generateStandaloneController(cls);
            zip.file(`${srcPath}/web/controller/${cls.name}.java`, controllerCode);
        });

        // Generar clases utilitarias
        utilityClasses.forEach(cls => {
            const utilityCode = this.generateUtilityClass(cls);
            zip.file(`${srcPath}/util/${cls.name}.java`, utilityCode);
        });

        // Generar archivos de configuración
        zip.file('pom.xml', this.generatePomXml());
        zip.file(`${resourcesPath}/application.properties`, this.generateApplicationProperties());
        zip.file(`${resourcesPath}/application-dev.properties`, this.generateDevProperties());
        zip.file(`${resourcesPath}/application-prod.properties`, this.generateProdProperties());

        // Generar clase principal Spring Boot
        const mainClassCode = this.generateMainClass();
        zip.file(`${srcPath}/${this.capitalizeFirst(this.projectName.replace(/\s+/g, ''))}Application.java`, mainClassCode);

        // Generar archivos adicionales
        zip.file('README.md', this.generateReadme(classes));
        zip.file('.gitignore', this.generateGitignore());

        return zip;
    }

    // ==================== GENERADORES DE CÓDIGO JAVA ====================

    generateEntity(cls, relationships) {
        const className = cls.name;
        const tableName = this.camelToSnakeCase(className).toLowerCase();

        // Analizar relaciones para esta entidad
        const entityRelationships = relationships.filter(r =>
            r.sourceClass === className || r.targetClass === className
        );

        return `package ${this.packageName}.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Entidad JPA para ${className}
 * Generada automáticamente desde diagrama UML
 ${cls.responsibilities.length > 0 ? `*
 * Responsabilidades:
${cls.responsibilities.map(r => ` * - ${r}`).join('\n')}` : ''}
 ${cls.constraints.length > 0 ? `*
 * Restricciones:
${cls.constraints.map(c => ` * - ${c}`).join('\n')}` : ''}
 */
@Entity
@Table(name = "${tableName}")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${className} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

${this.generateEntityAttributes(cls.attributes)}

${this.generateEntityRelationships(className, entityRelationships)}

    // Campos de auditoría
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}`;
    }

    generateEntityAttributes(attributes) {
        return attributes.map(attr => {
            const attrData = this.parseAttribute(attr);
            const javaType = this.mapUMLTypeToJava(attrData.type);
            const columnName = this.camelToSnakeCase(attrData.name);

            const nullable = attrData.visibility !== '-'; // Private = NOT NULL
            const validations = this.generateValidations(attrData.type, nullable);

            return `
    ${validations}
    @Column(name = "${columnName}"${nullable ? '' : ', nullable = false'})
    private ${javaType} ${attrData.name};`;
        }).join('\n');
    }

generateEntityRelationships(className, relationships) {
    return relationships.map(rel => {
        if (rel.sourceClass === className) {
            console.log('Procesando relación:', {
                sourceClass: rel.sourceClass,
                targetClass: rel.targetClass,
                type: rel.type
            });
            const targetClass = rel.targetClass;
            const fieldName = this.decapitalizeFirst(targetClass);

            switch (rel.type) {
                case 'inheritance':
                    // HERENCIA: Siempre FK de hija hacia padre (sin evaluar multiplicidad)
                    return `
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.camelToSnakeCase(fieldName)}_id")
    private ${targetClass} ${fieldName};`;

                case 'association':
                    // CAMBIO CLAVE: Evaluar sourceMultiplicity en lugar de targetMultiplicity
                    if (rel.sourceMultiplicity.includes('*') || rel.sourceMultiplicity.includes('n')) {
                        // Source es "*" -> @ManyToOne + FK en esta tabla
                        return `
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.camelToSnakeCase(fieldName)}_id")
    private ${targetClass} ${fieldName};`;
                    } else {
                        // Source es "1" -> @OneToMany + FK en la tabla target
                        return `
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.camelToSnakeCase(className)}_id")
    private Set<${targetClass}> ${fieldName}s;`;
                    }

                case 'composition':
                    return `
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.camelToSnakeCase(className)}_id")
    private Set<${targetClass}> ${fieldName}s;`;

                case 'aggregation':
                    return `
    @OneToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    @JoinColumn(name = "${this.camelToSnakeCase(className)}_id")
    private Set<${targetClass}> ${fieldName}s;`;

                default:
                    return `// Relación ${rel.type} con ${targetClass}`;
            }
        }
        return '';
    }).filter(rel => rel).join('\n');
}

generateRepository(cls) {
    const className = cls.name;

    return `package ${this.packageName}.domain.repository;

import ${this.packageName}.domain.model.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para ${className}
 * Generado automáticamente desde diagrama UML
 */
@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {

    // Métodos de consulta básicos (SIN soft delete)

    List<${className}> findByOrderByCreatedAtDesc();

    List<${className}> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT e FROM ${className} e ORDER BY e.createdAt DESC")
    List<${className}> findAllOrderedByDate();

    // Buscar por ID con validación
    @Query("SELECT e FROM ${className} e WHERE e.id = :id")
    Optional<${className}> findByIdSafe(@Param("id") Long id);

    // TODO: Agregar métodos de consulta específicos según necesidades del negocio
    // Ejemplo:
    // List<${className}> findByNombreContaining(String nombre);
}`;
}

    generateService(cls) {
        const className = cls.name;

        return `package ${this.packageName}.domain.service;

import ${this.packageName}.domain.model.${className};
import ${this.packageName}.domain.repository.${className}Repository;
import ${this.packageName}.web.dto.${className}RequestDTO;
import ${this.packageName}.web.dto.${className}ResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de negocio para ${className}
 * Generado automáticamente desde diagrama UML
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ${className}Service {

    private final ${className}Repository ${this.decapitalizeFirst(className)}Repository;

    /**
     * Crear nueva entidad ${className}
     */
    public ${className}ResponseDTO create(${className}RequestDTO requestDTO) {
        log.info("Creando nueva entidad ${className}: {}", requestDTO);

        ${className} entity = new ${className}();
        mapRequestToEntity(requestDTO, entity);

        ${className} savedEntity = ${this.decapitalizeFirst(className)}Repository.save(entity);

        log.info("Entidad ${className} creada con ID: {}", savedEntity.getId());
        return mapEntityToResponse(savedEntity);
    }

    /**
     * Obtener entidad por ID
     */
    @Transactional(readOnly = true)
    public ${className}ResponseDTO findById(Long id) {
        log.debug("Buscando ${className} con ID: {}", id);

        ${className} entity = ${this.decapitalizeFirst(className)}Repository.findById(id)
            .orElseThrow(() -> new RuntimeException("${className} no encontrado con ID: " + id));

        return mapEntityToResponse(entity);
    }

    /**
     * Obtener todas las entidades
     */
    @Transactional(readOnly = true)
    public List<${className}ResponseDTO> findAll() {
        log.debug("Obteniendo todas las entidades ${className}");

        return ${this.decapitalizeFirst(className)}Repository.findByOrderByCreatedAtDesc()
            .stream()
            .map(this::mapEntityToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Actualizar entidad existente
     */
    public ${className}ResponseDTO update(Long id, ${className}RequestDTO requestDTO) {
        log.info("Actualizando ${className} con ID: {}", id);

        ${className} entity = ${this.decapitalizeFirst(className)}Repository.findById(id)
            .orElseThrow(() -> new RuntimeException("${className} no encontrado con ID: " + id));

        mapRequestToEntity(requestDTO, entity);
        ${className} updatedEntity = ${this.decapitalizeFirst(className)}Repository.save(entity);

        log.info("Entidad ${className} actualizada: {}", updatedEntity.getId());
        return mapEntityToResponse(updatedEntity);
    }

    /**
     * Eliminar entidad (soft delete)
     */
    public void delete(Long id) {
        log.info("Eliminando ${className} con ID: {}", id);

        ${className} entity = ${this.decapitalizeFirst(className)}Repository.findById(id)
            .orElseThrow(() -> new RuntimeException("${className} no encontrado con ID: " + id));

        // Implementar soft delete si es necesario
        ${this.decapitalizeFirst(className)}Repository.delete(entity);

        log.info("Entidad ${className} eliminada: {}", id);
    }

    // ==================== MÉTODOS DE MAPEO ====================

    private void mapRequestToEntity(${className}RequestDTO requestDTO, ${className} entity) {
        // TODO: Implementar mapeo específico de campos
        // Ejemplo básico:
        ${this.generateDtoToEntityMapping(cls.attributes)}
    }

    private ${className}ResponseDTO mapEntityToResponse(${className} entity) {
        ${className}ResponseDTO responseDTO = new ${className}ResponseDTO();
        responseDTO.setId(entity.getId());
        responseDTO.setCreatedAt(entity.getCreatedAt());
        responseDTO.setUpdatedAt(entity.getUpdatedAt());

        // TODO: Implementar mapeo específico de campos
        // Ejemplo básico:
        ${this.generateEntityToResponseMapping(cls.attributes)}

        return responseDTO;
    }
}`;
    }

    generateDtoToEntityMapping(attributes) {
        return attributes.map(attr => {
            const attrData = this.parseAttribute(attr);
            const fieldName = attrData.name;
            const capitalizedField = this.capitalizeFirst(fieldName);

            return `        if (requestDTO.get${capitalizedField}() != null) {
            entity.set${capitalizedField}(requestDTO.get${capitalizedField}());
        }`;
        }).join('\n');
    }

    generateEntityToResponseMapping(attributes) {
        return attributes.map(attr => {
            const attrData = this.parseAttribute(attr);
            const fieldName = attrData.name;
            const capitalizedField = this.capitalizeFirst(fieldName);

            return `        responseDTO.set${capitalizedField}(entity.get${capitalizedField}());`;
        }).join('\n');
    }

    generateController(cls) {
        const className = cls.name;
        const basePath = this.camelToKebabCase(className);

        return `package ${this.packageName}.web.controller;

import ${this.packageName}.domain.service.${className}Service;
import ${this.packageName}.web.dto.${className}RequestDTO;
import ${this.packageName}.web.dto.${className}ResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

/**
 * Controlador REST para ${className}
 * Generado automáticamente desde diagrama UML
 */
@RestController
@RequestMapping("/api/${basePath}")
@RequiredArgsConstructor
@Slf4j
@Validated
@CrossOrigin(origins = "*")
public class ${className}Controller {

    private final ${className}Service ${this.decapitalizeFirst(className)}Service;

    /**
     * Crear nuevo ${className}
     */
    @PostMapping
    public ResponseEntity<${className}ResponseDTO> create(@Valid @RequestBody ${className}RequestDTO requestDTO) {
        log.info("REST: Creando ${className}: {}", requestDTO);

        ${className}ResponseDTO responseDTO = ${this.decapitalizeFirst(className)}Service.create(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
    }

    /**
     * Obtener ${className} por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<${className}ResponseDTO> findById(@PathVariable Long id) {
        log.debug("REST: Obteniendo ${className} con ID: {}", id);

        ${className}ResponseDTO responseDTO = ${this.decapitalizeFirst(className)}Service.findById(id);

        return ResponseEntity.ok(responseDTO);
    }

    /**
     * Obtener todos los ${className}
     */
    @GetMapping
    public ResponseEntity<List<${className}ResponseDTO>> findAll() {
        log.debug("REST: Obteniendo todos los ${className}");

        List<${className}ResponseDTO> responseDTOs = ${this.decapitalizeFirst(className)}Service.findAll();

        return ResponseEntity.ok(responseDTOs);
    }

    /**
     * Actualizar ${className} existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<${className}ResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody ${className}RequestDTO requestDTO) {
        log.info("REST: Actualizando ${className} con ID: {}", id);

        ${className}ResponseDTO responseDTO = ${this.decapitalizeFirst(className)}Service.update(id, requestDTO);

        return ResponseEntity.ok(responseDTO);
    }

    /**
     * Eliminar ${className}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("REST: Eliminando ${className} con ID: {}", id);

        ${this.decapitalizeFirst(className)}Service.delete(id);

        return ResponseEntity.noContent().build();
    }
}`;
    }

    generateRequestDTO(cls) {
        const className = cls.name;

        return `package ${this.packageName}.web.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
/**
 * DTO de Request para ${className}
 * Generado automáticamente desde diagrama UML
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${className}RequestDTO {

${this.generateDTOAttributes(cls.attributes, true)}

    // TODO: Agregar validaciones específicas según reglas de negocio
}`;
    }

    generateResponseDTO(cls) {
        const className = cls.name;

        return `package ${this.packageName}.web.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

/**
 * DTO de Response para ${className}
 * Generado automáticamente desde diagrama UML
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${className}ResponseDTO {

    private Long id;

${this.generateDTOAttributes(cls.attributes, false)}

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
}`;
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

    mapUMLTypeToJava(umlType) {
        const typeMap = {
            'String': 'String',
            'int': 'Integer',
            'Integer': 'Integer',
            'long': 'Long',
            'Long': 'Long',
            'double': 'Double',
            'Double': 'Double',
            'float': 'Float',
            'Float': 'Float',
            'boolean': 'Boolean',
            'Boolean': 'Boolean',
            'Date': 'LocalDateTime',
            'LocalDateTime': 'LocalDateTime',
            'LocalDate': 'LocalDate',
            'BigDecimal': 'BigDecimal',
            'List<String>': 'List<String>',
            'Set<String>': 'Set<String>',
            'Map<String,String>': 'Map<String, String>'
        };
        return typeMap[umlType] || 'String';
    }

    generateDTOAttributes(attributes, isRequest) {
        return attributes.map(attr => {
            const attrData = this.parseAttribute(attr);
            const javaType = this.mapUMLTypeToJava(attrData.type);
            const validations = isRequest ? this.generateValidations(attrData.type, true) : '';

            return `
    ${validations}
    @JsonProperty("${this.camelToSnakeCase(attrData.name)}")
    private ${javaType} ${attrData.name};`;
        }).join('\n');
    }

    generateValidations(type, nullable) {
        const validations = [];

        if (!nullable) {
            validations.push('@NotNull');
        }

        if (type === 'String') {
            validations.push('@NotBlank');
            validations.push('@Size(max = 255)');
        }

        if (type.includes('Email') || type.includes('email')) {
            validations.push('@Email');
        }

        return validations.length > 0 ? '    ' + validations.join('\n    ') : '';
    }

    generateStandaloneService(cls) {
        const className = cls.name;
        return `package ${this.packageName}.domain.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio ${className}
 * Generado automáticamente desde diagrama UML
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ${className} {

${this.generateServiceMethods(cls.methods)}
}`;
    }

    generateStandaloneRepository(cls) {
        return `package ${this.packageName}.domain.repository;

import org.springframework.stereotype.Repository;

/**
 * Repositorio ${cls.name}
 * Generado automáticamente desde diagrama UML
 */
@Repository
public interface ${cls.name} {

${this.generateRepositoryMethods(cls.methods)}
}`;
    }

    generateStandaloneController(cls) {
        return `package ${this.packageName}.web.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador ${cls.name}
 * Generado automáticamente desde diagrama UML
 */
@RestController
@RequestMapping("/api/${this.camelToKebabCase(cls.name)}")
@RequiredArgsConstructor
@Slf4j
public class ${cls.name} {

${this.generateControllerMethods(cls.methods)}
}`;
    }

    generateUtilityClass(cls) {
        return `package ${this.packageName}.util;

/**
 * Clase utilitaria ${cls.name}
 * Generada automáticamente desde diagrama UML
 */
public final class ${cls.name} {

    private ${cls.name}() {
        // Utility class
    }

${this.generateUtilityMethods(cls.methods)}
}`;
    }

    generateServiceMethods(methods) {
        return methods.map(method => {
            const methodData = this.parseMethod(method);
            return `
    /**
     * ${methodData.name}
     */
    public ${methodData.returnType} ${methodData.name}() {
        log.info("Ejecutando ${methodData.name}");
        // TODO: Implementar lógica de negocio
        ${methodData.returnType === 'void' ? '' : `return ${this.getDefaultValue(methodData.returnType)};`}
    }`;
        }).join('\n');
    }

    generateRepositoryMethods(methods) {
        return methods.map(method => {
            const methodData = this.parseMethod(method);
            return `    ${methodData.returnType} ${methodData.name}();`;
        }).join('\n\n');
    }

    generateControllerMethods(methods) {
        return methods.map(method => {
            const methodData = this.parseMethod(method);
            return `
    @GetMapping("/${this.camelToKebabCase(methodData.name)}")
    public ${methodData.returnType} ${methodData.name}() {
        log.info("REST: ${methodData.name}");
        // TODO: Implementar endpoint
        ${methodData.returnType === 'void' ? '' : `return ${this.getDefaultValue(methodData.returnType)};`}
    }`;
        }).join('\n');
    }

    generateUtilityMethods(methods) {
        return methods.map(method => {
            const methodData = this.parseMethod(method);
            return `
    /**
     * ${methodData.name}
     */
    public static ${methodData.returnType} ${methodData.name}() {
        // TODO: Implementar método utilitario
        ${methodData.returnType === 'void' ? '' : `return ${this.getDefaultValue(methodData.returnType)};`}
    }`;
        }).join('\n');
    }

    parseMethod(methodString) {
        const match = methodString.match(/^([+\-#~])\s*([^()]+)\(\):\s*(.+)$/);
        if (match) {
            return {
                visibility: match[1],
                name: match[2].trim(),
                returnType: this.mapUMLTypeToJava(match[3].trim())
            };
        }
        return { visibility: '+', name: methodString.replace(/[()]/g, ''), returnType: 'void' };
    }

    getDefaultValue(javaType) {
        const defaults = {
            'String': 'null',
            'Integer': '0',
            'Long': '0L',
            'Double': '0.0',
            'Float': '0.0f',
            'Boolean': 'false',
            'LocalDateTime': 'LocalDateTime.now()',
            'LocalDate': 'LocalDate.now()',
            'BigDecimal': 'BigDecimal.ZERO'
        };
        return defaults[javaType] || 'null';
    }

    // ==================== GENERADORES DE ARCHIVOS DE CONFIGURACIÓN ====================

    generatePomXml() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>${this.groupId}</groupId>
    <artifactId>${this.artifactId}</artifactId>
    <version>${this.version}</version>
    <name>${this.projectName}</name>
    <description>Proyecto Spring Boot generado desde diagrama UML</description>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.33</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- H2 Database for Testing -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;
    }

    generateApplicationProperties() {
        return `# Configuración generada automáticamente desde diagrama UML
# ${this.projectName} - Spring Boot Application

# Server Configuration
server.port=8080
server.servlet.context-path=/

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/${this.artifactId.replace(/-/g, '_')}_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.format-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect

# Logging
logging.level.${this.packageName}=DEBUG
logging.level.org.springframework.web=INFO
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

# Jackson JSON Configuration
spring.jackson.default-property-inclusion=NON_NULL
spring.jackson.date-format=yyyy-MM-dd HH:mm:ss
spring.jackson.time-zone=GMT-5

# Profile
spring.profiles.active=dev`;
    }

    generateDevProperties() {
        return `# Configuración de Desarrollo
# ${this.projectName} - Development Environment

# Database Development
spring.datasource.url=jdbc:mysql://localhost:3306/${this.artifactId.replace(/-/g, '_')}_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root

# JPA Development
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.format-sql=true

# Logging Development
logging.level.root=INFO
logging.level.${this.packageName}=DEBUG`;
    }

    generateProdProperties() {
        return `# Configuración de Producción
# ${this.projectName} - Production Environment

# Database Production
spring.datasource.url=\${DATABASE_URL:jdbc:mysql://localhost:3306/${this.artifactId.replace(/-/g, '_')}_prod}
spring.datasource.username=\${DATABASE_USERNAME:prod_user}
spring.datasource.password=\${DATABASE_PASSWORD:prod_pass}

# JPA Production
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.format-sql=false

# Logging Production
logging.level.root=WARN
logging.level.${this.packageName}=INFO`;
    }

    generateMainClass() {
        const className = this.capitalizeFirst(this.projectName.replace(/\s+/g, ''));
        return `package ${this.packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal de la aplicación Spring Boot
 * Generada automáticamente desde diagrama UML
 */
@SpringBootApplication
public class ${className}Application {

    public static void main(String[] args) {
        SpringApplication.run(${className}Application.class, args);
    }
}`;
    }

    generateReadme(classes) {
        return `# ${this.projectName}

Proyecto Spring Boot generado automáticamente desde diagrama UML.

## Descripción

Este proyecto contiene ${classes.length} clases principales:

${classes.map(cls => `- **${cls.name}** (${cls.stereotype}): ${cls.responsibilities.join(', ') || 'Sin descripción'}`).join('\n')}

## Estructura del Proyecto

\`\`\`
src/main/java/${this.packageName.replace(/\./g, '/')}/
├── domain/
│   ├── model/          # Entidades JPA
│   ├── repository/     # Repositorios
│   └── service/        # Servicios de negocio
├── web/
│   ├── controller/     # Controladores REST
│   └── dto/           # DTOs Request/Response
└── util/              # Clases utilitarias
\`\`\`

## Tecnologías

- **Spring Boot 3.2.0**
- **Java 17**
- **Spring Data JPA**
- **MySQL 8.0**
- **Lombok**
- **Bean Validation**

## Configuración

### Opción 1: Docker (Recomendado)

1. **Ejecutar MySQL con Docker:**
   \`\`\`bash
   docker run --name ${this.artifactId}-mysql \\
     -e MYSQL_ROOT_PASSWORD=root \\
     -e MYSQL_DATABASE=${this.artifactId.replace(/-/g, '_')}_db \\
     -p 3306:3306 -d mysql:8.0
   \`\`\`

2. **Ejecutar aplicación:**
   \`\`\`bash
   mvn spring-boot:run
   \`\`\`

3. **Comandos útiles:**
   \`\`\`bash
   # Ver el contenedor
   docker ps

   # Detener MySQL
   docker stop ${this.artifactId}-mysql

   # Iniciar MySQL existente
   docker start ${this.artifactId}-mysql

   # Eliminar contenedor
   docker rm -f ${this.artifactId}-mysql
   \`\`\`

### Opción 2: MySQL Local

1. Crear base de datos: \`CREATE DATABASE ${this.artifactId.replace(/-/g, '_')}_db;\`
2. Configurar credenciales en \`application.properties\`
3. Ejecutar: \`mvn spring-boot:run\`

## Inicio Rápido

\`\`\`bash
# 1. Crear base de datos MySQL
docker run --name ${this.artifactId}-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=${this.artifactId.replace(/-/g, '_')}_db -p 3306:3306 -d mysql:8.0

# 2. Esperar 30 segundos para que MySQL inicie
sleep 30

# 3. Ejecutar aplicación Spring Boot
mvn spring-boot:run

# 4. Probar API
curl http://localhost:8080/api/usuario
\`\`\`

## Endpoints Generados

${classes.filter(c => c.stereotype === 'entity').map(cls => {
    const basePath = this.camelToKebabCase(cls.name);
    return `### ${cls.name}
- GET    \`/api/${basePath}\`     - Listar todos
- GET    \`/api/${basePath}/{id}\` - Obtener por ID
- POST   \`/api/${basePath}\`     - Crear nuevo
- PUT    \`/api/${basePath}/{id}\` - Actualizar
- DELETE \`/api/${basePath}/{id}\` - Eliminar`;
}).join('\n\n')}

## Notas

- Los DTOs y validaciones deben completarse según reglas de negocio
- Los métodos de mapeo en Services requieren implementación específica
- Se recomienda agregar tests unitarios e integración
- Configurar profiles para diferentes ambientes

---
*Generado automáticamente por UML Diagrammer*`;
    }

    generateGitignore() {
        return `# Compiled class file
*.class

# Log file
*.log

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files #
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.mvn/wrapper/maven-wrapper.jar

# IDE
.idea/
*.iws
*.iml
*.ipr
.vscode/
.settings/
.project
.classpath

# OS
.DS_Store
Thumbs.db

# Application
application-local.properties
*.env`;
    }

    // ==================== MÉTODOS UTILITARIOS ====================

    sanitizeProjectName(name) {
        return name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    camelToSnakeCase(str) {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    camelToKebabCase(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    decapitalizeFirst(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    downloadProject(zip) {
        const filename = `${this.artifactId}-SpringBoot.zip`;

        zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 100);

            console.log('📥 Proyecto Spring Boot descargado:', filename);
        });
    }
}

// Método estático para uso rápido
SimpleJavaGenerator.quickGenerateJava = function(editor) {
    const generator = new SimpleJavaGenerator(editor);
    generator.generateJavaProject();
};
