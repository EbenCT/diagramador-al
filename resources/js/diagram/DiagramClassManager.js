// resources/js/diagram/DiagramClassManager.js - REFACTORIZADO
// Versión limpia que usa DiagramElementFactory para evitar duplicación

import * as joint from 'jointjs';
import { DiagramElementFactory } from './DiagramElementFactory.js';

export class DiagramClassManager {
    constructor(editor) {
        this.editor = editor;
        this.classCounter = 1;
        this.interfaceCounter = 1;

        // Usar la factory factorizada
        this.elementFactory = new DiagramElementFactory();
    }

    createClassImproved(x, y) {
        const className = `Class ${this.classCounter++}`;
        const attributes = ['- attribute1: String', '- attribute2: int'];
        const methods = ['+ method1(): void', '+ method2(): String'];

        // Usar el método factorizado
        const element = this.elementFactory.createClassElement(
            className, attributes, methods, x, y, 'class', this.editor.graph
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

        // Usar el método factorizado
        const element = this.elementFactory.createClassElement(
            interfaceName, [], methods, x, y, 'interface', this.editor.graph
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

    updateClassElement(element, className, attributes, methods, type) {
        // Usar el método factorizado para actualizar
        this.elementFactory.updateClassElement(element, className, attributes, methods, type);
        console.log('Clase actualizada:', className);
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
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 18px;">
                Editar ${currentType === 'interface' ? 'Interface' : 'Clase'}
            </h3>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">
                    ${currentType === 'interface' ? 'Nombre de la Interface:' : 'Nombre de la Clase:'}
                </label>
                <input
                    id="className"
                    type="text"
                    value="${currentName}"
                    style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                />
            </div>

            ${currentType === 'class' ? `
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">
                        Atributos <small style="color: #6b7280;">(uno por línea)</small>:
                    </label>
                    <textarea
                        id="classAttributes"
                        rows="4"
                        style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 13px; resize: vertical;"
                        placeholder="- atributo1: String&#10;+ atributo2: int"
                    >${currentAttrs.join('\n')}</textarea>
                </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #374151;">
                    Métodos <small style="color: #6b7280;">(uno por línea)</small>:
                </label>
                <textarea
                    id="classMethods"
                    rows="4"
                    style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: 'Fira Code', monospace; font-size: 13px; resize: vertical;"
                    placeholder="+ metodo1(): void&#10;- metodo2(): String"
                >${currentMethods.join('\n')}</textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button
                    id="cancelBtn"
                    style="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
                >
                    Cancelar
                </button>
                <button
                    id="deleteBtn"
                    style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 10px;"
                >
                    Eliminar
                </button>
                <button
                    id="saveBtn"
                    style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
                >
                    Guardar
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        setTimeout(() => {
            document.getElementById('className').focus();
            document.getElementById('className').select();
        }, 100);

        // Event listeners
        document.getElementById('cancelBtn').onclick = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('saveBtn').onclick = () => {
            const newName = document.getElementById('className').value || 'Clase';
            const newAttrs = currentType === 'class' ?
                document.getElementById('classAttributes').value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line) : [];
            const newMethods = document.getElementById('classMethods').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line);

            this.updateClassElement(element, newName, newAttrs, newMethods, currentType);
            document.body.removeChild(modal);
        };

        document.getElementById('deleteBtn').onclick = () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
                element.remove();
                document.body.removeChild(modal);
            }
        };

        // Cerrar con Escape
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }
}
