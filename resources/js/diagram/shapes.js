// resources/js/diagram/shapes.js - VERSIÓN MEJORADA CON MULTIPLICIDAD
import * as joint from 'jointjs';

// Crear namespace para shapes UML
joint.shapes.uml = {};

// Clase UML mejorada (mantener la que ya tienes funcionando)
joint.shapes.uml.Class = joint.dia.Element.extend({
    markup: [
        '<g class="rotatable">',
        '<rect class="uml-class-name-rect"/>',
        '<rect class="uml-class-attrs-rect"/>',
        '<rect class="uml-class-methods-rect"/>',
        '<text class="uml-class-name-text"/>',
        '<text class="uml-class-attrs-text"/>',
        '<text class="uml-class-methods-text"/>',
        '</g>'
    ].join(''),

    defaults: joint.util.deepSupplement({
        type: 'uml.Class',
        attrs: {
            '.uml-class-name-rect': {
                'stroke': '#2563eb',
                'stroke-width': 2,
                'fill': '#dbeafe'
            },
            '.uml-class-attrs-rect': {
                'stroke': '#2563eb',
                'stroke-width': 1,
                'fill': '#ffffff'
            },
            '.uml-class-methods-rect': {
                'stroke': '#2563eb',
                'stroke-width': 1,
                'fill': '#f8fafc'
            },
            '.uml-class-name-text': {
                'ref': '.uml-class-name-rect',
                'ref-y': 0.5,
                'ref-x': 0.5,
                'text-anchor': 'middle',
                'y-alignment': 'middle',
                'font-weight': 'bold',
                'fill': '#1e40af',
                'font-size': 14,
                'font-family': 'Arial, helvetica, sans-serif'
            },
            '.uml-class-attrs-text': {
                'ref': '.uml-class-attrs-rect',
                'ref-y': 8,
                'ref-x': 8,
                'fill': '#374151',
                'font-size': 11,
                'font-family': 'Consolas, monospace'
            },
            '.uml-class-methods-text': {
                'ref': '.uml-class-methods-rect',
                'ref-y': 8,
                'ref-x': 8,
                'fill': '#374151',
                'font-size': 11,
                'font-family': 'Consolas, monospace'
            }
        },
        className: 'MiClase',
        attributes: ['- id: int', '- nombre: String'],
        methods: ['+ getId(): int', '+ getNombre(): String'],
        size: { width: 200, height: 120 }
    }, joint.dia.Element.prototype.defaults),

    initialize: function() {
        this.on('change:className change:attributes change:methods', this.updateLayout, this);
        this.updateLayout();
        joint.dia.Element.prototype.initialize.apply(this, arguments);
    },

    updateLayout: function() {
        const className = this.get('className') || 'MiClase';
        const attributes = this.get('attributes') || [];
        const methods = this.get('methods') || [];

        const lineHeight = 16;
        const padding = 8;
        const headerHeight = lineHeight + padding * 2;

        const attrsHeight = Math.max(lineHeight + padding, attributes.length * lineHeight + padding);
        const methodsHeight = Math.max(lineHeight + padding, methods.length * lineHeight + padding);
        const totalHeight = headerHeight + attrsHeight + methodsHeight;

        const width = 200;

        const attrs = joint.util.cloneDeep(this.get('attrs') || {});

        // Header
        attrs['.uml-class-name-rect'].width = width;
        attrs['.uml-class-name-rect'].height = headerHeight;
        attrs['.uml-class-name-text'].text = className;

        // Atributos
        attrs['.uml-class-attrs-rect'].width = width;
        attrs['.uml-class-attrs-rect'].height = attrsHeight;
        attrs['.uml-class-attrs-rect'].y = headerHeight;
        attrs['.uml-class-attrs-text'].text = attributes.length > 0 ? attributes.join('\n') : '';

        // Métodos
        attrs['.uml-class-methods-rect'].width = width;
        attrs['.uml-class-methods-rect'].height = methodsHeight;
        attrs['.uml-class-methods-rect'].y = headerHeight + attrsHeight;
        attrs['.uml-class-methods-text'].text = methods.length > 0 ? methods.join('\n') : '';

        this.set('size', { width: width, height: totalHeight });
        this.set('attrs', attrs);
    }
});

// RELACIONES UML MEJORADAS CON MULTIPLICIDAD Y ETIQUETAS EDITABLES

// Asociación con multiplicidad configurable
joint.shapes.uml.Association = joint.shapes.standard.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'uml.Association',
        attrs: {
            line: {
                stroke: '#2563eb',
                'stroke-width': 2,
                'stroke-dasharray': '0'
            }
        },
        labels: [
            {
                markup: [
                    '<rect class="label-bg"/>',
                    '<text class="label-text"/>'
                ].join(''),
                attrs: {
                    '.label-bg': {
                        fill: 'white',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 3,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.label-text': {
                        text: '1',
                        'font-size': 12,
                        'font-family': 'Arial, sans-serif',
                        fill: '#2563eb',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.15, offset: 15 }
            },
            {
                markup: [
                    '<rect class="label-bg"/>',
                    '<text class="label-text"/>'
                ].join(''),
                attrs: {
                    '.label-bg': {
                        fill: 'white',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 3,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.label-text': {
                        text: '*',
                        'font-size': 12,
                        'font-family': 'Arial, sans-serif',
                        fill: '#2563eb',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.85, offset: 15 }
            }
        ],
        // Metadatos UML
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        relationshipName: '',
        relationshipType: 'association'
    }, joint.shapes.standard.Link.prototype.defaults),

    // Método para actualizar multiplicidad
    setMultiplicity: function(source, target) {
        const labels = this.get('labels') || [];
        if (labels[0]) labels[0].attrs['.label-text'].text = source;
        if (labels[1]) labels[1].attrs['.label-text'].text = target;

        this.set('labels', labels);
        this.set('sourceMultiplicity', source);
        this.set('targetMultiplicity', target);
    },

    // Método para añadir nombre de relación
    setRelationshipName: function(name) {
        const labels = this.get('labels') || [];

        // Añadir etiqueta central para el nombre
        if (name && name.trim()) {
            labels.push({
                markup: [
                    '<rect class="name-bg"/>',
                    '<text class="name-text"/>'
                ].join(''),
                attrs: {
                    '.name-bg': {
                        fill: '#f0f9ff',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 5,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.name-text': {
                        text: name,
                        'font-size': 11,
                        'font-family': 'Arial, sans-serif',
                        'font-style': 'italic',
                        fill: '#1e40af',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.5, offset: -20 }
            });
        }

        this.set('labels', labels);
        this.set('relationshipName', name);
    }
});

// Herencia (flecha vacía)
joint.shapes.uml.Inheritance = joint.shapes.standard.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'uml.Inheritance',
        attrs: {
            line: {
                stroke: '#2563eb',
                'stroke-width': 2,
                'target-marker': {
                    'type': 'path',
                    'd': 'M 15 -8 0 0 15 8 z',
                    'fill': 'white',
                    'stroke': '#2563eb',
                    'stroke-width': 2
                }
            }
        },
        relationshipType: 'inheritance'
    }, joint.shapes.standard.Link.prototype.defaults),

    // Herencia no necesita multiplicidad, pero puede tener nombre
    setRelationshipName: function(name) {
        if (!name || !name.trim()) return;

        const labels = [{
            markup: [
                '<rect class="name-bg"/>',
                '<text class="name-text"/>'
            ].join(''),
            attrs: {
                '.name-bg': {
                    fill: '#f0f9ff',
                    stroke: '#2563eb',
                    'stroke-width': 1,
                    rx: 5,
                    ry: 3,
                    'ref-width': 1,
                    'ref-height': 1,
                    'ref-x': -0.5,
                    'ref-y': -0.5
                },
                '.name-text': {
                    text: name,
                    'font-size': 11,
                    'font-family': 'Arial, sans-serif',
                    'font-style': 'italic',
                    fill: '#1e40af',
                    'text-anchor': 'middle',
                    'y-alignment': 'middle'
                }
            },
            position: { distance: 0.5, offset: -20 }
        }];

        this.set('labels', labels);
        this.set('relationshipName', name);
    }
});

// Agregación (diamante vacío)
joint.shapes.uml.Aggregation = joint.shapes.standard.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'uml.Aggregation',
        attrs: {
            line: {
                stroke: '#2563eb',
                'stroke-width': 2,
                'source-marker': {
                    'type': 'path',
                    'd': 'M 15 -6 8 0 15 6 22 0 z',
                    'fill': 'white',
                    'stroke': '#2563eb',
                    'stroke-width': 2
                }
            }
        },
        labels: [
            {
                markup: [
                    '<rect class="label-bg"/>',
                    '<text class="label-text"/>'
                ].join(''),
                attrs: {
                    '.label-bg': {
                        fill: 'white',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 3,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.label-text': {
                        text: '1',
                        'font-size': 12,
                        'font-family': 'Arial, sans-serif',
                        fill: '#2563eb',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.15, offset: 15 }
            },
            {
                markup: [
                    '<rect class="label-bg"/>',
                    '<text class="label-text"/>'
                ].join(''),
                attrs: {
                    '.label-bg': {
                        fill: 'white',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 3,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.label-text': {
                        text: '*',
                        'font-size': 12,
                        'font-family': 'Arial, sans-serif',
                        fill: '#2563eb',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.85, offset: 15 }
            }
        ],
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        relationshipType: 'aggregation'
    }, joint.shapes.standard.Link.prototype.defaults),

    setMultiplicity: function(source, target) {
        const labels = this.get('labels') || [];
        if (labels[0]) labels[0].attrs['.label-text'].text = source;
        if (labels[1]) labels[1].attrs['.label-text'].text = target;

        this.set('labels', labels);
        this.set('sourceMultiplicity', source);
        this.set('targetMultiplicity', target);
    },

    setRelationshipName: function(name) {
        const labels = this.get('labels') || [];

        if (name && name.trim()) {
            labels.push({
                markup: [
                    '<rect class="name-bg"/>',
                    '<text class="name-text"/>'
                ].join(''),
                attrs: {
                    '.name-bg': {
                        fill: '#f0f9ff',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 5,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.name-text': {
                        text: name,
                        'font-size': 11,
                        'font-family': 'Arial, sans-serif',
                        'font-style': 'italic',
                        fill: '#1e40af',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.5, offset: -20 }
            });
        }

        this.set('labels', labels);
        this.set('relationshipName', name);
    }
});

// Composición (diamante lleno)
joint.shapes.uml.Composition = joint.shapes.standard.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'uml.Composition',
        attrs: {
            line: {
                stroke: '#2563eb',
                'stroke-width': 2,
                'source-marker': {
                    'type': 'path',
                    'd': 'M 15 -6 8 0 15 6 22 0 z',
                    'fill': '#2563eb',
                    'stroke': '#2563eb',
                    'stroke-width': 2
                }
            }
        },
        labels: [
            {
                markup: [
                    '<rect class="label-bg"/>',
                    '<text class="label-text"/>'
                ].join(''),
                attrs: {
                    '.label-bg': {
                        fill: 'white',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 3,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.label-text': {
                        text: '1',
                        'font-size': 12,
                        'font-family': 'Arial, sans-serif',
                        fill: '#2563eb',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.15, offset: 15 }
            },
            {
                markup: [
                    '<rect class="label-bg"/>',
                    '<text class="label-text"/>'
                ].join(''),
                attrs: {
                    '.label-bg': {
                        fill: 'white',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 3,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.label-text': {
                        text: '*',
                        'font-size': 12,
                        'font-family': 'Arial, sans-serif',
                        fill: '#2563eb',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.85, offset: 15 }
            }
        ],
        sourceMultiplicity: '1',
        targetMultiplicity: '*',
        relationshipType: 'composition'
    }, joint.shapes.standard.Link.prototype.defaults),

    setMultiplicity: function(source, target) {
        const labels = this.get('labels') || [];
        if (labels[0]) labels[0].attrs['.label-text'].text = source;
        if (labels[1]) labels[1].attrs['.label-text'].text = target;

        this.set('labels', labels);
        this.set('sourceMultiplicity', source);
        this.set('targetMultiplicity', target);
    },

    setRelationshipName: function(name) {
        const labels = this.get('labels') || [];

        if (name && name.trim()) {
            labels.push({
                markup: [
                    '<rect class="name-bg"/>',
                    '<text class="name-text"/>'
                ].join(''),
                attrs: {
                    '.name-bg': {
                        fill: '#f0f9ff',
                        stroke: '#2563eb',
                        'stroke-width': 1,
                        rx: 5,
                        ry: 3,
                        'ref-width': 1,
                        'ref-height': 1,
                        'ref-x': -0.5,
                        'ref-y': -0.5
                    },
                    '.name-text': {
                        text: name,
                        'font-size': 11,
                        'font-family': 'Arial, sans-serif',
                        'font-style': 'italic',
                        fill: '#1e40af',
                        'text-anchor': 'middle',
                        'y-alignment': 'middle'
                    }
                },
                position: { distance: 0.5, offset: -20 }
            });
        }

        this.set('labels', labels);
        this.set('relationshipName', name);
    }
});

// Utilidades para trabajar con multiplicidad
export const UMLMultiplicity = {
    // Opciones comunes de multiplicidad
    options: [
        '1',      // Exactamente uno
        '0..1',   // Cero o uno
        '1..*',   // Uno o más
        '0..*',   // Cero o más (equivale a *)
        '*',      // Muchos
        'n',      // N específico
        '1..n'    // De 1 a n
    ],

    // Validar multiplicidad
    isValid: function(multiplicity) {
        if (!multiplicity || typeof multiplicity !== 'string') return false;

        const validPatterns = [
            /^\d+$/,              // Número específico: 5
            /^\d+\.\.\d+$/,       // Rango: 1..5
            /^\d+\.\.\*$/,        // Desde número: 1..*
            /^0\.\.1$/,           // Opcional: 0..1
            /^\*$/,               // Muchos: *
            /^n$/                 // Variable: n
        ];

        return validPatterns.some(pattern => pattern.test(multiplicity.trim()));
    },

    // Obtener descripción de multiplicidad
    getDescription: function(multiplicity) {
        const descriptions = {
            '1': 'Exactamente uno',
            '0..1': 'Cero o uno (opcional)',
            '1..*': 'Uno o más',
            '0..*': 'Cero o más',
            '*': 'Muchos',
            'n': 'N elementos',
            '1..n': 'De 1 a N'
        };

        return descriptions[multiplicity] || `Multiplicidad: ${multiplicity}`;
    }
};

export default joint.shapes.uml;
