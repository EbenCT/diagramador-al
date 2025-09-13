import './bootstrap';
import Alpine from 'alpinejs';
import * as joint from 'jointjs';
import $ from 'jquery';

// Hacer jQuery y JointJS disponibles globalmente
window.$ = window.jQuery = $;
window.joint = joint;

// Configurar Alpine.js
window.Alpine = Alpine;
Alpine.start();

// Definir formas UML personalizadas para JointJS
joint.shapes.uml = {};

// Clase UML
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
            '.uml-class-name-rect': { 'stroke': '#333333', 'stroke-width': 2, 'fill': '#ffffff' },
            '.uml-class-attrs-rect': { 'stroke': '#333333', 'stroke-width': 1, 'fill': '#ffffff' },
            '.uml-class-methods-rect': { 'stroke': '#333333', 'stroke-width': 1, 'fill': '#ffffff' },
            '.uml-class-name-text': {
                'ref': '.uml-class-name-rect', 'ref-y': 0.5, 'ref-x': 0.5, 'text-anchor': 'middle',
                'y-alignment': 'middle', 'font-weight': 'bold', 'fill': '#333333', 'font-size': 12,
                'font-family': 'Arial, helvetica, sans-serif'
            },
            '.uml-class-attrs-text': {
                'ref': '.uml-class-attrs-rect', 'ref-y': 5, 'ref-x': 5,
                'fill': '#333333', 'font-size': 10, 'font-family': 'Arial, helvetica, sans-serif'
            },
            '.uml-class-methods-text': {
                'ref': '.uml-class-methods-rect', 'ref-y': 5, 'ref-x': 5,
                'fill': '#333333', 'font-size': 10, 'font-family': 'Arial, helvetica, sans-serif'
            }
        },
        name: 'Class',
        attributes: [],
        methods: [],
        size: { width: 150, height: 120 }
    }, joint.dia.Element.prototype.defaults),

    initialize: function() {
        this.on('change:name change:attributes change:methods', function() {
            this.updateRectangles();
            this.trigger('uml-update');
        }, this);

        this.updateRectangles();
        joint.dia.Element.prototype.initialize.apply(this, arguments);
    },

    getClassName: function() {
        return this.get('name');
    },

    updateRectangles: function() {
        var attrs = this.get('attrs');
        var name = this.get('name');
        var attributes = this.get('attributes');
        var methods = this.get('methods');

        var nameHeight = 30;
        var attrsHeight = Math.max(30, attributes.length * 15 + 10);
        var methodsHeight = Math.max(30, methods.length * 15 + 10);

        var width = this.get('size').width;
        var totalHeight = nameHeight + attrsHeight + methodsHeight;

        attrs['.uml-class-name-rect'].width = width;
        attrs['.uml-class-name-rect'].height = nameHeight;

        attrs['.uml-class-attrs-rect'].width = width;
        attrs['.uml-class-attrs-rect'].height = attrsHeight;
        attrs['.uml-class-attrs-rect'].y = nameHeight;

        attrs['.uml-class-methods-rect'].width = width;
        attrs['.uml-class-methods-rect'].height = methodsHeight;
        attrs['.uml-class-methods-rect'].y = nameHeight + attrsHeight;

        attrs['.uml-class-name-text'].text = name;
        attrs['.uml-class-attrs-text'].text = attributes.join('\n');
        attrs['.uml-class-methods-text'].text = methods.join('\n');

        this.set('size', { width: width, height: totalHeight });
        this.set('attrs', attrs);
    }
});

// Interfaz UML
joint.shapes.uml.Interface = joint.shapes.uml.Class.extend({
    defaults: joint.util.deepSupplement({
        type: 'uml.Interface',
        attrs: {
            '.uml-class-name-rect': { 'stroke': '#1e88e5', 'fill': '#e8f4fd' },
            '.uml-class-attrs-rect': { 'stroke': '#1e88e5', 'fill': '#e8f4fd' },
            '.uml-class-methods-rect': { 'stroke': '#1e88e5', 'fill': '#e8f4fd' },
            '.uml-class-name-text': { 'text': '<<interface>>\nInterface' }
        }
    }, joint.shapes.uml.Class.prototype.defaults),

    updateRectangles: function() {
        joint.shapes.uml.Class.prototype.updateRectangles.apply(this, arguments);
        var attrs = this.get('attrs');
        attrs['.uml-class-name-text'].text = '<<interface>>\n' + this.get('name');
        this.set('attrs', attrs);
    }
});

// Clase Abstracta UML
joint.shapes.uml.Abstract = joint.shapes.uml.Class.extend({
    defaults: joint.util.deepSupplement({
        type: 'uml.Abstract',
        attrs: {
            '.uml-class-name-rect': { 'stroke': '#f57c00', 'fill': '#fff3e0' },
            '.uml-class-attrs-rect': { 'stroke': '#f57c00', 'fill': '#fff3e0' },
            '.uml-class-methods-rect': { 'stroke': '#f57c00', 'fill': '#fff3e0' },
            '.uml-class-name-text': { 'font-style': 'italic' }
        }
    }, joint.shapes.uml.Class.prototype.defaults)
});

// Importar el editor después de definir las formas
import './diagram/editor.js';
