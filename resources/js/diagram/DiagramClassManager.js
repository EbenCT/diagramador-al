// resources/js/diagram/DiagramClassManager.js - CON EXTENSIÓN UML 2.5
// Mantiene retrocompatibilidad pero agrega soporte opcional para UML 2.5

import * as joint from 'jointjs';
import { DiagramElementFactory } from './DiagramElementFactory.js';

export class DiagramClassManager {
    constructor(editor) {
        this.editor = editor;
        this.classCounter = 1;
        this.interfaceCounter = 1;

        // Usar la factory factorizada con soporte UML 2.5
        this.elementFactory = new DiagramElementFactory();
    }

    createClassImproved(x, y) {
        const className = `Class ${this.classCounter++}`;
        const attributes = ['- attribute1: String', '- attribute2: int'];
        const methods = ['+ method1(): void', '+ method2(): String'];

        // Crear con configuración básica (retrocompatible)
        const element = this.elementFactory.createClassElement(
            className, attributes, methods, x, y, 'class', this.editor.graph, null
        );

        this.makeElementEditable(element);
        this.editor.updateCanvasInfo();
        this.editor.selectTool('select');

        setTimeout(() => {
            this.showEditDialog(element, className, attributes, methods, 'class');
        }, 100);

        return element;
    }

    createInterface(x, y) {
        const interfaceName = `Interface ${this.interfaceCounter++}`;
        const methods = ['+ method1(): void', '+ method2(): String'];

        // Crear con configuración básica (retrocompatible)
        const element = this.elementFactory.createClassElement(
            interfaceName, [], methods, x, y, 'interface', this.editor.graph, null
        );

        this.makeElementEditable(element);
        this.editor.updateCanvasInfo();
        this.editor.selectTool('select');

        setTimeout(() => {
            this.showEditDialog(element, interfaceName, [], methods, 'interface');
        }, 100);

        return element;
    }

    editClassImproved(element) {
        const umlData = element.get('umlData') || {};
        const currentName = umlData.className || 'Clase';
        const currentAttrs = umlData.attributes || [];
        const currentMethods = umlData.methods || [];
        const currentType = umlData.type || 'class';

        this.showEditDialog(element, currentName, currentAttrs, currentMethods, currentType);
    }

    updateClassElement(element, className, attributes, methods, type, uml25Config = null) {
        // Usar el método factorizado para actualizar
        this.elementFactory.updateClassElement(element, className, attributes, methods, type, uml25Config);
        this.editor.updateCanvasInfo();
        console.log('Clase actualizada:', className, uml25Config ? '(UML 2.5)' : '');
    }

    makeElementEditable(element) {
        element.on('change:position', () => {
            // Mantener sincronizado si se mueve
        });
    }

    showEditDialog(element, currentName, currentAttrs, currentMethods, currentType) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 600px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        `;

        // Obtener configuración UML 2.5 existente
        const existingUmlData = element.get('umlData') || {};
        const existingUml25 = this.elementFactory.getUML25Config(existingUmlData);

        dialog.innerHTML = this.buildEditDialogHTML(
            currentName, currentAttrs, currentMethods, currentType, existingUml25
        );

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Configurar event listeners
        this.setupEditDialogEventListeners(modal, dialog, element, currentType);

        // Foco inicial
        setTimeout(() => {
            document.getElementById('className').focus();
            document.getElementById('className').select();
        }, 100);
    }

    buildEditDialogHTML(currentName, currentAttrs, currentMethods, currentType, uml25Config) {
        return `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-semibold text-blue-600">
                    ${currentType === 'interface' ? 'Editar Interface' : 'Editar Clase'}
                </h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">Modo:</span>
                    <button id="toggleUml25" class="px-3 py-1 rounded text-sm font-medium transition-colors ${
                        this.elementFactory.isUML25Element({ uml25: uml25Config })
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }">
                        UML 2.5 ${this.elementFactory.isUML25Element({ uml25: uml25Config }) ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            <!-- Configuración Básica -->
            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ${currentType === 'interface' ? 'Nombre de la Interface' : 'Nombre de la Clase'}:
                    </label>
                    <input
                        id="className"
                        type="text"
                        value="${currentName}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                ${currentType === 'class' ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Atributos <span class="text-gray-500">(uno por línea)</span>:
                        </label>
                        <textarea
                            id="classAttributes"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="- atributo1: String&#10;+ atributo2: int"
                        >${currentAttrs.join('\n')}</textarea>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Métodos <span class="text-gray-500">(uno por línea)</span>:
                    </label>
                    <textarea
                        id="classMethods"
                        rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+ metodo1(): void&#10;- metodo2(): String"
                    >${currentMethods.join('\n')}</textarea>
                </div>
            </div>

            <!-- Configuración UML 2.5 -->
            <div id="uml25Section" class="space-y-4 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200"
                 style="display: ${this.elementFactory.isUML25Element({ uml25: uml25Config }) ? 'block' : 'none'}">

                <h4 class="text-lg font-medium text-purple-800 mb-3">🚀 Características UML 2.5</h4>

                <!-- Estereotipo -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Estereotipo:
                    </label>
                    <select id="uml25Stereotype" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500">
                        <option value="">Sin estereotipo</option>
                        <option value="entity" ${uml25Config.stereotype === 'entity' ? 'selected' : ''}><<entity>> - Entidad de dominio</option>
                        <option value="enumeration" ${uml25Config.stereotype === 'enumeration' ? 'selected' : ''}><<enumeration>> - Enumeración</option>
                        <option value="datatype" ${uml25Config.stereotype === 'datatype' ? 'selected' : ''}><<datatype>> - Tipo de dato</option>
                        <option value="service" ${uml25Config.stereotype === 'service' ? 'selected' : ''}><<service>> - Servicio</option>
                        <option value="repository" ${uml25Config.stereotype === 'repository' ? 'selected' : ''}><<repository>> - Repositorio</option>
                        <option value="controller" ${uml25Config.stereotype === 'controller' ? 'selected' : ''}><<controller>> - Controlador</option>
                        <option value="utility" ${uml25Config.stereotype === 'utility' ? 'selected' : ''}><<utility>> - Utilidad</option>
                    </select>
                </div>

                ${currentType === 'class' ? `
                    <!-- Atributos Derivados -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Atributos Derivados <span class="text-gray-500">(se marcarán con /)</span>:
                        </label>
                        <div id="derivedAttributesContainer" class="space-y-2 max-h-32 overflow-y-auto">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>
                ` : ''}

                <!-- Responsabilidades -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Responsabilidades <span class="text-gray-500">(una por línea)</span>:
                    </label>
                    <textarea
                        id="uml25Responsibilities"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-vertical focus:ring-2 focus:ring-purple-500"
                        placeholder="Responsable de validar datos&#10;Gestionar estado de la entidad"
                    >${uml25Config.responsibilities.join('\n')}</textarea>
                </div>

                <!-- Restricciones -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Restricciones <span class="text-gray-500">(una por línea, usar {constraint})</span>:
                    </label>
                    <textarea
                        id="uml25Constraints"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-vertical focus:ring-2 focus:ring-purple-500"
                        placeholder="{edad >= 0}&#10;{nombre no vacío}"
                    >${uml25Config.constraints.join('\n')}</textarea>
                </div>

                <!-- Visibilidad Extendida -->
                <div>
                    <label class="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="uml25ExtendedVisibility"
                            ${uml25Config.extendedVisibility ? 'checked' : ''}
                            class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span class="text-sm text-gray-700">
                            Usar visibilidad de paquete <code class="bg-gray-100 px-1 rounded">~</code>
                        </span>
                    </label>
                </div>

                <div class="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p class="text-sm text-blue-800">
                        💡 <strong>UML 2.5:</strong> Estas características se guardarán en la base de datos y serán retrocompatibles con versiones anteriores.
                    </p>
                </div>
            </div>

            <!-- Botones de Acción -->
            <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                    id="cancelBtn"
                    class="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    id="deleteBtn"
                    class="px-4 py-2 text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                    Eliminar
                </button>
                <button
                    id="saveBtn"
                    class="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Guardar
                </button>
            </div>
        `;
    }

    setupEditDialogEventListeners(modal, dialog, element, currentType) {
        // Toggle UML 2.5
        document.getElementById('toggleUml25').onclick = () => {
            const section = document.getElementById('uml25Section');
            const button = document.getElementById('toggleUml25');
            const isVisible = section.style.display !== 'none';

            if (isVisible) {
                section.style.display = 'none';
                button.textContent = 'UML 2.5 OFF';
                button.className = 'px-3 py-1 rounded text-sm font-medium transition-colors bg-gray-100 text-gray-600 border border-gray-300';
            } else {
                section.style.display = 'block';
                button.textContent = 'UML 2.5 ON';
                button.className = 'px-3 py-1 rounded text-sm font-medium transition-colors bg-purple-100 text-purple-700 border border-purple-300';
                this.updateDerivedAttributesUI();
            }
        };

        // Actualizar checkboxes de atributos derivados cuando cambien los atributos
        if (currentType === 'class') {
            document.getElementById('classAttributes').addEventListener('input', () => {
                this.updateDerivedAttributesUI();
            });
        }

        // Cancelar
        document.getElementById('cancelBtn').onclick = () => {
            document.body.removeChild(modal);
        };

        // Eliminar
        document.getElementById('deleteBtn').onclick = () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
                element.remove();
                this.editor.updateCanvasInfo();
                document.body.removeChild(modal);
            }
        };

        // Guardar
        document.getElementById('saveBtn').onclick = () => {
            this.saveElementFromDialog(element, currentType);
            document.body.removeChild(modal);
        };

        // Cerrar con Escape
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Inicializar UI de atributos derivados si es clase
        if (currentType === 'class') {
            this.updateDerivedAttributesUI();
        }
    }

    updateDerivedAttributesUI() {
        const attributesText = document.getElementById('classAttributes').value;
        const container = document.getElementById('derivedAttributesContainer');

        if (!attributesText.trim()) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Primero agrega atributos para marcarlos como derivados.</p>';
            return;
        }

        const attributes = attributesText.split('\n').filter(line => line.trim());
        container.innerHTML = '';

        attributes.forEach((attr, index) => {
            const checkbox = document.createElement('label');
            checkbox.className = 'flex items-center space-x-2 text-sm';
            checkbox.innerHTML = `
                <input
                    type="checkbox"
                    class="derived-attr-checkbox rounded border-gray-300 text-purple-600"
                    data-index="${index}"
                />
                <code class="bg-gray-100 px-2 py-1 rounded text-xs">${attr.substring(0, 50)}${attr.length > 50 ? '...' : ''}</code>
            `;
            container.appendChild(checkbox);
        });
    }

    saveElementFromDialog(element, type) {
        const newName = document.getElementById('className').value || 'Clase';
        const newAttrs = type === 'class' ?
            document.getElementById('classAttributes').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line) : [];
        const newMethods = document.getElementById('classMethods').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);

        // Verificar si UML 2.5 está activado
        const isUml25Active = document.getElementById('uml25Section').style.display !== 'none';
        let uml25Config = null;

        if (isUml25Active) {
            // Recopilar atributos derivados
            const derivedIndices = [];
            document.querySelectorAll('.derived-attr-checkbox:checked').forEach(checkbox => {
                derivedIndices.push(parseInt(checkbox.dataset.index));
            });

            // Recopilar configuración UML 2.5
            uml25Config = {
                stereotype: document.getElementById('uml25Stereotype').value || null,
                derivedAttributes: derivedIndices,
                responsibilities: document.getElementById('uml25Responsibilities').value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line),
                constraints: document.getElementById('uml25Constraints').value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line),
                extendedVisibility: document.getElementById('uml25ExtendedVisibility').checked
            };

            // Solo pasar configuración si hay algo configurado
            if (!uml25Config.stereotype &&
                uml25Config.derivedAttributes.length === 0 &&
                uml25Config.responsibilities.length === 0 &&
                uml25Config.constraints.length === 0 &&
                !uml25Config.extendedVisibility) {
                uml25Config = null;
            }
        }

        // Actualizar elemento
        this.updateClassElement(element, newName, newAttrs, newMethods, type, uml25Config);

        console.log('✅ Elemento guardado', uml25Config ? 'con características UML 2.5' : 'en modo estándar');
    }
}
