// resources/js/diagram/DiagramRelationshipManager.js - REFACTORIZADO COMPLETO
// Mantiene TODA la funcionalidad original pero usa DiagramElementFactory para métodos duplicados

import * as joint from 'jointjs';
import { DiagramElementFactory } from './DiagramElementFactory.js';

export class DiagramRelationshipManager {
    constructor(editor) {
        this.editor = editor;
        this.firstElementSelected = null;

        // Usar la factory SOLO para métodos específicos duplicados
        this.elementFactory = new DiagramElementFactory();
    }

    // ==================== CREACIÓN MEJORADA DE RELACIONES ====================

    handleRelationshipClick(element) {
        if (!this.firstElementSelected) {
            this.firstElementSelected = element;
            this.editor.highlightElement(element, true, '#f59e0b');

            // Mostrar ayuda visual
            this.showRelationshipHelp(this.editor.selectedTool);
            console.log('Primera clase seleccionada para', this.editor.selectedTool);
        } else {
            if (this.firstElementSelected.id !== element.id) {
                this.createRelationshipImproved(this.firstElementSelected, element);
            }

            this.editor.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
            this.hideRelationshipHelp();
            this.editor.selectTool('select');
        }
    }

    showRelationshipHelp(toolType) {
        const helpText = {
            'association': '↔️ Asociación: Relación general entre clases',
            'aggregation': '◇ Agregación: "Tiene un" (composición débil)',
            'composition': '◆ Composición: "Parte de" (composición fuerte)',
            'inheritance': '△ Herencia: "Es un" (especialización)'
        };

        // Crear tooltip temporal
        const tooltip = document.createElement('div');
        tooltip.id = 'relationship-tooltip';
        tooltip.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        tooltip.textContent = helpText[toolType] + ' - Selecciona la segunda clase';
        document.body.appendChild(tooltip);
    }

    hideRelationshipHelp() {
        const tooltip = document.getElementById('relationship-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    createRelationshipImproved(source, target) {
        const relationshipType = this.editor.selectedTool;

        // Mostrar modal de configuración según el tipo de relación
        this.showRelationshipConfigModal(relationshipType, source, target);
    }

    // ==================== MODAL DE CONFIGURACIÓN DE RELACIONES ====================

    showRelationshipConfigModal(relationshipType, source, target) {
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

        const relationshipInfo = this.getRelationshipInfo(relationshipType);
        const showMultiplicity = relationshipType === 'association' || relationshipType === 'aggregation' || relationshipType === 'composition';
        const showName = relationshipType !== 'inheritance';

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                ${relationshipInfo.icon} Configurar ${relationshipInfo.name}
            </h3>

            <div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #1e40af;">
                <p style="margin: 0; color: #475569; font-size: 14px;">
                    <strong>De:</strong> ${source.get('umlData')?.className || 'Clase origen'} →
                    <strong>Hacia:</strong> ${target.get('umlData')?.className || 'Clase destino'}
                </p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px;">
                    ${relationshipInfo.description}
                </p>
            </div>

            ${showMultiplicity ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Multiplicidad Origen:
                        </label>
                        <select id="sourceMultiplicity" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="">Sin especificar</option>
                            <option value="1" selected>1 (uno)</option>
                            <option value="0..1">0..1 (cero o uno)</option>
                            <option value="1..*">1..* (uno o más)</option>
                            <option value="*">* (muchos)</option>
                            <option value="0..*">0..* (cero o más)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Multiplicidad Destino:
                        </label>
                        <select id="targetMultiplicity" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="">Sin especificar</option>
                            <option value="1">1 (uno)</option>
                            <option value="0..1">0..1 (cero o uno)</option>
                            <option value="1..*">1..* (uno o más)</option>
                            <option value="*" selected>* (muchos)</option>
                            <option value="0..*">0..* (cero o más)</option>
                        </select>
                    </div>
                </div>
            ` : ''}

            ${showName ? `
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                        Nombre de la relación:
                        <small style="color: #6b7280; font-weight: normal;">(opcional)</small>
                    </label>
                    <input type="text" id="relationName" placeholder="Ej: gestiona, pertenece a, contiene..."
                           style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">
                    🎯 Puntos de Conexión:
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Salida desde ${source.get('umlData')?.className || 'Origen'}:
                        </label>
                        <select id="sourceAnchor" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="auto">🤖 Automático</option>
                            <option value="top">⬆️ Arriba</option>
                            <option value="right">➡️ Derecha</option>
                            <option value="bottom">⬇️ Abajo</option>
                            <option value="left">⬅️ Izquierda</option>
                            <option value="center">🎯 Centro</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Llegada a ${target.get('umlData')?.className || 'Destino'}:
                        </label>
                        <select id="targetAnchor" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="auto">🤖 Automático</option>
                            <option value="top">⬆️ Arriba</option>
                            <option value="right">➡️ Derecha</option>
                            <option value="bottom">⬇️ Abajo</option>
                            <option value="left">⬅️ Izquierda</option>
                            <option value="center">🎯 Centro</option>
                        </select>
                    </div>
                </div>
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
                    💡 Usa "Automático" para evitar superposiciones, o selecciona manualmente los puntos específicos.
                </p>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelRelationBtn"
                        style="padding: 10px 20px; border: 2px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; color: #374151;">
                    Cancelar
                </button>
                <button id="createRelationBtn"
                        style="padding: 10px 20px; border: 2px solid #1e40af; background: #1e40af; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Crear Relación
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('cancelRelationBtn').onclick = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('createRelationBtn').onclick = () => {
            const sourceMultiplicity = showMultiplicity ? document.getElementById('sourceMultiplicity').value : '';
            const targetMultiplicity = showMultiplicity ? document.getElementById('targetMultiplicity').value : '';
            const relationName = showName ? document.getElementById('relationName').value.trim() : '';

            // Obtener los anchors seleccionados por el usuario
            const sourceAnchorChoice = document.getElementById('sourceAnchor').value;
            const targetAnchorChoice = document.getElementById('targetAnchor').value;

            this.createRelationshipFromConfig(relationshipType, source, target, {
                sourceMultiplicity,
                targetMultiplicity,
                name: relationName,
                sourceAnchor: sourceAnchorChoice,
                targetAnchor: targetAnchorChoice
            });

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
    }

    getRelationshipInfo(type) {
        const info = {
            'association': {
                name: 'Asociación',
                icon: '↔️',
                description: 'Relación general entre clases. Indica que una clase conoce o usa otra.'
            },
            'aggregation': {
                name: 'Agregación',
                icon: '◇',
                description: 'Relación "tiene un" (composición débil). Las partes pueden existir independientemente.'
            },
            'composition': {
                name: 'Composición',
                icon: '◆',
                description: 'Relación "parte de" (composición fuerte). Las partes no pueden existir sin el todo.'
            },
            'inheritance': {
                name: 'Herencia',
                icon: '△',
                description: 'Relación "es un". Una clase hereda propiedades y métodos de otra.'
            }
        };
        return info[type] || { name: 'Relación', icon: '→', description: 'Relación entre clases.' };
    }

    // ==================== SISTEMA SIMPLE ANTI-SUPERPOSICIÓN ====================

    calculateSimpleOffset(sourceElement, targetElement) {
        // Contar conexiones existentes en cada elemento
        const sourceConnections = this.getConnectionCount(sourceElement);
        const targetConnections = this.getConnectionCount(targetElement);

        // Calcular offsets basados en el número de conexiones
        const sourceOffset = sourceConnections * 15; // 15px por cada conexión existente
        const targetOffset = targetConnections * 15;

        return { sourceOffset, targetOffset };
    }

    getConnectionCount(element) {
        const links = this.editor.graph.getLinks();
        return links.filter(link => {
            const sourceId = link.get('source').id;
            const targetId = link.get('target').id;
            return sourceId === element.id || targetId === element.id;
        }).length;
    }

    selectSmartAnchor(sourceElement, targetElement, isSource = true) {
        const element = isSource ? sourceElement : targetElement;
        const otherElement = isSource ? targetElement : sourceElement;

        const connectionCount = this.getConnectionCount(element);
        const anchors = ['top', 'right', 'bottom', 'left'];

        // Seleccionar anchor basado en el número de conexiones (rotación simple)
        const baseAnchor = anchors[connectionCount % 4];

        return baseAnchor;
    }

    // ==================== CREACIÓN DE RELACIONES CON CONFIGURACIÓN ====================

    createRelationshipFromConfig(relationshipType, source, target, config) {
        let link;

        // Determinar anchors según la elección del usuario
        let sourceAnchor, targetAnchor;

        if (config.sourceAnchor === 'auto') {
            sourceAnchor = this.selectSmartAnchor(source, target, true);
        } else {
            sourceAnchor = config.sourceAnchor;
        }

        if (config.targetAnchor === 'auto') {
            targetAnchor = this.selectSmartAnchor(target, source, false);
        } else {
            targetAnchor = config.targetAnchor;
        }

        switch(relationshipType) {
            case 'association':
                link = new joint.shapes.standard.Link({
                    source: {
                        id: source.id,
                        anchor: { name: sourceAnchor }
                    },
                    target: {
                        id: target.id,
                        anchor: { name: targetAnchor }
                    },
                    attrs: this.elementFactory.getRelationshipAttrs('association'), // ← Usar factory
                    labels: this.createRelationLabelsImproved(
                        config.sourceMultiplicity,
                        config.targetMultiplicity,
                        config.name
                    ),
                    relationData: {
                        type: 'association',
                        sourceMultiplicity: config.sourceMultiplicity,
                        targetMultiplicity: config.targetMultiplicity,
                        name: config.name,
                        sourceAnchor: config.sourceAnchor,
                        targetAnchor: config.targetAnchor
                    }
                });
                break;

            case 'inheritance':
                link = new joint.shapes.standard.Link({
                    source: {
                        id: source.id,
                        anchor: { name: sourceAnchor }
                    },
                    target: {
                        id: target.id,
                        anchor: { name: targetAnchor }
                    },
                    attrs: this.elementFactory.getRelationshipAttrs('inheritance'), // ← Usar factory
                    labels: config.name ? [{
                        attrs: {
                            text: {
                                text: config.name,
                                fontSize: 14,
                                fontFamily: 'Arial, sans-serif',
                                fill: '#1e40af',
                                fontWeight: 'bold'
                            }
                        },
                        position: {
                            distance: 0.5,
                            offset: -18
                        }
                    }] : [],
                    relationData: {
                        type: 'inheritance',
                        sourceMultiplicity: '',
                        targetMultiplicity: '',
                        name: config.name,
                        sourceAnchor: config.sourceAnchor,
                        targetAnchor: config.targetAnchor
                    }
                });
                break;

            case 'aggregation':
                link = new joint.shapes.standard.Link({
                    source: {
                        id: source.id,
                        anchor: { name: sourceAnchor }
                    },
                    target: {
                        id: target.id,
                        anchor: { name: targetAnchor }
                    },
                    attrs: this.elementFactory.getRelationshipAttrs('aggregation'), // ← Usar factory
                    labels: this.createRelationLabelsImproved(
                        config.sourceMultiplicity,
                        config.targetMultiplicity,
                        config.name
                    ),
                    relationData: {
                        type: 'aggregation',
                        sourceMultiplicity: config.sourceMultiplicity,
                        targetMultiplicity: config.targetMultiplicity,
                        name: config.name,
                        sourceAnchor: config.sourceAnchor,
                        targetAnchor: config.targetAnchor
                    }
                });
                break;

            case 'composition':
                link = new joint.shapes.standard.Link({
                    source: {
                        id: source.id,
                        anchor: { name: sourceAnchor }
                    },
                    target: {
                        id: target.id,
                        anchor: { name: targetAnchor }
                    },
                    attrs: this.elementFactory.getRelationshipAttrs('composition'), // ← Usar factory
                    labels: this.createRelationLabelsImproved(
                        config.sourceMultiplicity,
                        config.targetMultiplicity,
                        config.name
                    ),
                    relationData: {
                        type: 'composition',
                        sourceMultiplicity: config.sourceMultiplicity,
                        targetMultiplicity: config.targetMultiplicity,
                        name: config.name,
                        sourceAnchor: config.sourceAnchor,
                        targetAnchor: config.targetAnchor
                    }
                });
                break;

            default:
                console.error('Tipo de relación no soportado:', relationshipType);
                return;
        }

        // Añadir doble click para editar
        link.on('cell:pointerdblclick', () => {
            this.editRelationshipImproved(link);
        });

        this.editor.graph.addCell(link);
        this.editor.updateCanvasInfo();

        console.log('✅ Relación', relationshipType, 'creada con anti-superposición');

        // Retornar el link creado para que pueda ser usado por otros métodos
        return link;
    }

    // ==================== LABELS MEJORADAS ====================

    createRelationLabelsImproved(sourceMultiplicity, targetMultiplicity, relationName) {
        const labels = [];

        // Label de multiplicidad origen (cerca del source)
        if (sourceMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: sourceMultiplicity,
                        fontSize: 13,
                        fontFamily: 'Arial, sans-serif',
                        fill: '#374151',
                        fontWeight: 'bold'
                    }
                },
                position: {
                    distance: 0.15,
                    offset: -18
                }
            });
        }

        // Label del nombre de la relación (centro)
        if (relationName) {
            labels.push({
                attrs: {
                    text: {
                        text: relationName,
                        fontSize: 14,
                        fontFamily: 'Arial, sans-serif',
                        fill: '#1e40af',
                        fontWeight: 'bold'
                    }
                },
                position: {
                    distance: 0.5,
                    offset: -18
                }
            });
        }

        // Label de multiplicidad destino (cerca del target)
        if (targetMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: targetMultiplicity,
                        fontSize: 13,
                        fontFamily: 'Arial, sans-serif',
                        fill: '#374151',
                        fontWeight: 'bold'
                    }
                },
                position: {
                    distance: 0.85,
                    offset: -18
                }
            });
        }

        return labels;
    }

    // ==================== EDICIÓN MEJORADA DE RELACIONES ====================

    editRelationshipImproved(link) {
        const relationData = link.get('relationData') || {};
        const currentType = relationData.type || 'association';
        const currentSource = relationData.sourceMultiplicity || '';
        const currentTarget = relationData.targetMultiplicity || '';
        const currentName = relationData.name || '';

        this.showEditRelationshipModal(link, currentType, currentSource, currentTarget, currentName);
    }

    showEditRelationshipModal(link, relationshipType, currentSource, currentTarget, currentName) {
        // Obtener los anchors actuales del relationData
        const relationData = link.get('relationData') || {};
        const currentSourceAnchor = relationData.sourceAnchor || 'auto';
        const currentTargetAnchor = relationData.targetAnchor || 'auto';

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

        const relationshipInfo = this.getRelationshipInfo(relationshipType);
        const showMultiplicity = relationshipType === 'association' || relationshipType === 'aggregation' || relationshipType === 'composition';
        const showName = relationshipType !== 'inheritance';

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                ${relationshipInfo.icon} Editar ${relationshipInfo.name}
            </h3>

            ${showMultiplicity ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Multiplicidad Origen:
                        </label>
                        <select id="editSourceMultiplicity" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="">Sin especificar</option>
                            <option value="1">1 (uno)</option>
                            <option value="0..1">0..1 (cero o uno)</option>
                            <option value="1..*">1..* (uno o más)</option>
                            <option value="*">* (muchos)</option>
                            <option value="0..*">0..* (cero o más)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Multiplicidad Destino:
                        </label>
                        <select id="editTargetMultiplicity" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="">Sin especificar</option>
                            <option value="1">1 (uno)</option>
                            <option value="0..1">0..1 (cero o uno)</option>
                            <option value="1..*">1..* (uno o más)</option>
                            <option value="*">* (muchos)</option>
                            <option value="0..*">0..* (cero o más)</option>
                        </select>
                    </div>
                </div>
            ` : ''}

            ${showName ? `
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                        Nombre de la relación:
                    </label>
                    <input type="text" id="editRelationName" value="${currentName}"
                           style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">
                    🎯 Puntos de Conexión:
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Salida desde Origen:
                        </label>
                        <select id="editSourceAnchor" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="auto">🤖 Automático</option>
                            <option value="top">⬆️ Arriba</option>
                            <option value="right">➡️ Derecha</option>
                            <option value="bottom">⬇️ Abajo</option>
                            <option value="left">⬅️ Izquierda</option>
                            <option value="center">🎯 Centro</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 4px; font-weight: 500; color: #374151;">
                            Llegada a Destino:
                        </label>
                        <select id="editTargetAnchor" style="width: 100%; padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px;">
                            <option value="auto">🤖 Automático</option>
                            <option value="top">⬆️ Arriba</option>
                            <option value="right">➡️ Derecha</option>
                            <option value="bottom">⬇️ Abajo</option>
                            <option value="left">⬅️ Izquierda</option>
                            <option value="center">🎯 Centro</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelEditBtn"
                        style="padding: 10px 20px; border: 2px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; color: #374151;">
                    Cancelar
                </button>
                <button id="saveEditBtn"
                        style="padding: 10px 20px; border: 2px solid #1e40af; background: #1e40af; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Guardar
                </button>
                <button id="deleteRelationBtn"
                        style="padding: 10px 20px; border: 2px solid #dc2626; background: #dc2626; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                    Eliminar
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Establecer valores actuales
        if (showMultiplicity) {
            document.getElementById('editSourceMultiplicity').value = currentSource;
            document.getElementById('editTargetMultiplicity').value = currentTarget;
        }

        // Establecer anchors actuales
        document.getElementById('editSourceAnchor').value = currentSourceAnchor;
        document.getElementById('editTargetAnchor').value = currentTargetAnchor;

        // Event listeners
        document.getElementById('cancelEditBtn').onclick = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('saveEditBtn').onclick = () => {
            const newSourceMultiplicity = showMultiplicity ? document.getElementById('editSourceMultiplicity').value : '';
            const newTargetMultiplicity = showMultiplicity ? document.getElementById('editTargetMultiplicity').value : '';
            const newRelationName = showName ? document.getElementById('editRelationName').value.trim() : '';

            // Obtener los nuevos anchors seleccionados
            const newSourceAnchor = document.getElementById('editSourceAnchor').value;
            const newTargetAnchor = document.getElementById('editTargetAnchor').value;

            // Actualizar labels
            const newLabels = this.createRelationLabelsImproved(
                newSourceMultiplicity,
                newTargetMultiplicity,
                newRelationName
            );
            link.set('labels', newLabels);

            // Actualizar anchors si no son automáticos
            if (newSourceAnchor !== 'auto') {
                link.prop('source/anchor', { name: newSourceAnchor });
            }
            if (newTargetAnchor !== 'auto') {
                link.prop('target/anchor', { name: newTargetAnchor });
            }

            // Actualizar datos
            const relationData = link.get('relationData') || {};
            relationData.sourceMultiplicity = newSourceMultiplicity;
            relationData.targetMultiplicity = newTargetMultiplicity;
            relationData.name = newRelationName;
            relationData.sourceAnchor = newSourceAnchor;
            relationData.targetAnchor = newTargetAnchor;
            link.set('relationData', relationData);

            document.body.removeChild(modal);
            console.log('✅ Relación editada con nuevos puntos de conexión');
        };

        document.getElementById('deleteRelationBtn').onclick = () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta relación?')) {
                link.remove();
                document.body.removeChild(modal);
                console.log('✅ Relación eliminada');
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

    // ==================== UTILIDADES ====================

    resetFirstElementSelected() {
        if (this.firstElementSelected) {
            this.editor.highlightElement(this.firstElementSelected, false);
            this.firstElementSelected = null;
            this.hideRelationshipHelp();
        }
    }

    getFirstElementSelected() {
        return this.firstElementSelected;
    }

    // Método legacy para compatibilidad
    editRelationship(link) {
        this.editRelationshipImproved(link);
    }
}
