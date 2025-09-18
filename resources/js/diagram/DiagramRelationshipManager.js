// resources/js/diagram/DiagramRelationshipManager.js
// Módulo encargado de relaciones UML - TAL COMO ESTABA EN EL EDITOR ORIGINAL

import * as joint from 'jointjs';

export class DiagramRelationshipManager {
    constructor(editor) {
        this.editor = editor;
        this.firstElementSelected = null;
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
        var helpText = {
            'association': '↔️ Asociación: Relación general entre clases',
            'aggregation': '◇ Agregación: "Tiene un" (composición débil)',
            'composition': '◆ Composición: "Parte de" (composición fuerte)',
            'inheritance': '△ Herencia: "Es un" (especialización)'
        };

        // Crear tooltip temporal
        var tooltip = document.createElement('div');
        tooltip.id = 'relationship-tooltip';
        tooltip.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        tooltip.textContent = helpText[toolType] + ' - Selecciona la segunda clase';
        document.body.appendChild(tooltip);
    }

    hideRelationshipHelp() {
        var tooltip = document.getElementById('relationship-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    createRelationshipImproved(source, target) {
        var link;

        switch(this.editor.selectedTool) {
            case 'association':
                var result = this.promptForAssociation();
                if (!result) return;

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            targetMarker: {
                                type: 'path',
                                d: 'M 10 -5 0 0 10 5',
                                stroke: '#1e40af',
                                fill: 'none',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: this.createRelationLabelsImproved(
                        result.sourceMultiplicity,
                        result.targetMultiplicity,
                        result.name
                    ),
                    relationData: {
                        type: 'association',
                        sourceMultiplicity: result.sourceMultiplicity,
                        targetMultiplicity: result.targetMultiplicity,
                        name: result.name
                    }
                });
                break;

            case 'inheritance':
                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            targetMarker: {
                                type: 'path',
                                d: 'M 10 0 L 0 5 L 10 10 z',
                                fill: 'white',
                                stroke: '#1e40af',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: [{
                        attrs: {
                            text: {
                                text: '',
                                fontSize: 12,
                                fontFamily: 'Arial, sans-serif'
                            }
                        }
                    }],
                    relationData: {
                        type: 'inheritance',
                        sourceMultiplicity: '',
                        targetMultiplicity: '',
                        name: ''
                    }
                });
                break;

            case 'aggregation':
                var result = this.promptForAssociation();
                if (!result) return;

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            sourceMarker: {
                                type: 'path',
                                d: 'M 16 -6 8 0 16 6 24 0 z',
                                fill: 'white',
                                stroke: '#1e40af',
                                strokeWidth: 2
                            },
                            targetMarker: {
                                type: 'path',
                                d: 'M 10 -5 0 0 10 5',
                                stroke: '#1e40af',
                                fill: 'none',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: this.createRelationLabelsImproved(
                        result.sourceMultiplicity,
                        result.targetMultiplicity,
                        result.name
                    ),
                    relationData: {
                        type: 'aggregation',
                        sourceMultiplicity: result.sourceMultiplicity,
                        targetMultiplicity: result.targetMultiplicity,
                        name: result.name
                    }
                });
                break;

            case 'composition':
                var result = this.promptForAssociation();
                if (!result) return;

                link = new joint.shapes.standard.Link({
                    source: { id: source.id },
                    target: { id: target.id },
                    attrs: {
                        line: {
                            stroke: '#1e40af',
                            strokeWidth: 2,
                            sourceMarker: {
                                type: 'path',
                                d: 'M 16 -6 8 0 16 6 24 0 z',
                                fill: '#1e40af',
                                stroke: '#1e40af',
                                strokeWidth: 2
                            }
                        }
                    },
                    labels: this.createRelationLabelsImproved(
                        result.sourceMultiplicity,
                        result.targetMultiplicity,
                        result.name
                    ),
                    relationData: {
                        type: 'composition',
                        sourceMultiplicity: result.sourceMultiplicity,
                        targetMultiplicity: result.targetMultiplicity,
                        name: result.name
                    }
                });
                break;

            default:
                console.error('Tipo de relación no soportado:', this.editor.selectedTool);
                return;
        }

        this.editor.graph.addCell(link);
        this.editor.updateCanvasInfo();

        console.log('✅ Relación', this.editor.selectedTool, 'creada');
    }

    promptForAssociation() {
        var sourceMultiplicity = prompt(
            '📊 Multiplicidad origen:\n\n1 = uno\n0..1 = cero o uno\n1..* = uno o más\n* = muchos\n0..* = cero o más',
            '1'
        );
        if (sourceMultiplicity === null) return null;

        var targetMultiplicity = prompt(
            '📊 Multiplicidad destino:\n\n1 = uno\n0..1 = cero o uno\n1..* = uno o más\n* = muchos\n0..* = cero o más',
            '*'
        );
        if (targetMultiplicity === null) return null;

        var name = prompt('🏷️ Nombre de la relación (opcional):', '');

        return {
            sourceMultiplicity: sourceMultiplicity.trim(),
            targetMultiplicity: targetMultiplicity.trim(),
            name: name ? name.trim() : ''
        };
    }

    createRelationLabelsImproved(sourceMultiplicity, targetMultiplicity, relationName) {
        var labels = [];

        // Label de multiplicidad origen (cerca del source)
        if (sourceMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: sourceMultiplicity,
                        fontSize: 11,
                        fontFamily: 'Arial, sans-serif',
                        fill: '#374151',
                        fontWeight: 'bold'
                    }
                },
                position: {
                    distance: 0.15,
                    offset: -15
                }
            });
        }

        // Label del nombre de la relación (centro)
        if (relationName) {
            labels.push({
                attrs: {
                    text: {
                        text: relationName,
                        fontSize: 12,
                        fontFamily: 'Arial, sans-serif',
                        fill: '#1e40af',
                        fontWeight: 'bold'
                    }
                },
                position: {
                    distance: 0.5,
                    offset: -15
                }
            });
        }

        // Label de multiplicidad destino (cerca del target)
        if (targetMultiplicity) {
            labels.push({
                attrs: {
                    text: {
                        text: targetMultiplicity,
                        fontSize: 11,
                        fontFamily: 'Arial, sans-serif',
                        fill: '#374151',
                        fontWeight: 'bold'
                    }
                },
                position: {
                    distance: 0.85,
                    offset: -15
                }
            });
        }

        return labels;
    }

    // ==================== EDICIÓN DE RELACIONES ====================

    editRelationship(link) {
        var relationData = link.get('relationData') || {};
        var currentSource = relationData.sourceMultiplicity || '';
        var currentTarget = relationData.targetMultiplicity || '';
        var currentName = relationData.name || '';

        var newSource = prompt(
            `📊 Multiplicidad origen (actual: ${currentSource}):\n\n1, 0..1, 1..*, *, 0..*`,
            currentSource
        );
        if (newSource === null) return;

        var newTarget = prompt(
            `📊 Multiplicidad destino (actual: ${currentTarget}):\n\n1, 0..1, 1..*, *, 0..*`,
            currentTarget
        );
        if (newTarget === null) return;

        var newName = prompt(
            `🏷️ Nombre de la relación (actual: "${currentName}"):`,
            currentName
        );
        if (newName === null) return;

        // Actualizar labels
        var newLabels = this.createRelationLabelsImproved(
            newSource.trim(),
            newTarget.trim(),
            newName.trim()
        );
        link.set('labels', newLabels);

        // Actualizar datos
        relationData.sourceMultiplicity = newSource.trim();
        relationData.targetMultiplicity = newTarget.trim();
        relationData.name = newName.trim();
        link.set('relationData', relationData);

        console.log('✅ Relación editada');
    }

    // ==================== UTILIDADES ====================

    // Resetear selección de primera clase
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
}
