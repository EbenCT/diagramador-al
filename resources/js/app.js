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

// Tabla de Base de Datos
joint.shapes.db.Table = joint.dia.Element.extend({
    markup: [
        '<g class="rotatable">',
        '<rect class="table-header-rect"/>',
        '<rect class="table-columns-rect"/>',
        '<text class="table-name-text"/>',
        '<text class="table-columns-text"/>',
        '</g>'
    ].join(''),

    defaults: joint.util.deepSupplement({
        type: 'db.Table',
        attrs: {
            '.table-header-rect': { 'stroke': '#2563eb', 'stroke-width': 2, 'fill': '#dbeafe' },
            '.table-columns-rect': { 'stroke': '#2563eb', 'stroke-width': 1, 'fill': '#ffffff' },
            '.table-name-text': {
                'ref': '.table-header-rect', 'ref-y': 0.5, 'ref-x': 0.5, 'text-anchor': 'middle',
                'y-alignment': 'middle', 'font-weight': 'bold', 'fill': '#1e40af', 'font-size': 14,
                'font-family': 'Arial, helvetica, sans-serif'
            },
            '.table-columns-text': {
                'ref': '.table-columns-rect', 'ref-y': 5, 'ref-x': 8,
                'fill': '#374151', 'font-size': 11, 'font-family': 'Consolas, monospace'
            }
        },
        tableName: 'tabla',
        columns: [
            'id (PK) - INT',
            'nombre - VARCHAR(100)',
            'email - VARCHAR(255)',
            'created_at - TIMESTAMP'
        ],
        size: { width: 200, height: 120 }
    }, joint.dia.Element.prototype.defaults),

    initialize: function() {
        this.on('change:tableName change:columns', function() {
            this.updateRectangles();
            this.trigger('db-update');
        }, this);

        this.updateRectangles();
        joint.dia.Element.prototype.initialize.apply(this, arguments);
    },

    getTableName: function() {
        return this.get('tableName');
    },

    updateRectangles: function() {
        var attrs = this.get('attrs');
        var tableName = this.get('tableName');
        var columns = this.get('columns');

        var headerHeight = 35;
        var columnsHeight = Math.max(60, columns.length * 16 + 15);

        var width = this.get('size').width;
        var totalHeight = headerHeight + columnsHeight;

        attrs['.table-header-rect'].width = width;
        attrs['.table-header-rect'].height = headerHeight;

        attrs['.table-columns-rect'].width = width;
        attrs['.table-columns-rect'].height = columnsHeight;
        attrs['.table-columns-rect'].y = headerHeight;

        attrs['.table-name-text'].text = tableName.toUpperCase();
        attrs['.table-columns-text'].text = columns.join('\n');

        this.set('size', { width: width, height: totalHeight });
        this.set('attrs', attrs);
    }
});

// Vista de Base de Datos
joint.shapes.db.View = joint.shapes.db.Table.extend({
    defaults: joint.util.deepSupplement({
        type: 'db.View',
        attrs: {
            '.table-header-rect': { 'stroke': '#059669', 'fill': '#d1fae5' },
            '.table-columns-rect': { 'stroke': '#059669', 'fill': '#f0fdf4' },
            '.table-name-text': { 'fill': '#065f46' }
        }
    }, joint.shapes.db.Table.prototype.defaults),

    updateRectangles: function() {
        joint.shapes.db.Table.prototype.updateRectangles.apply(this, arguments);
        var attrs = this.get('attrs');
        attrs['.table-name-text'].text = 'VIEW: ' + this.get('tableName').toUpperCase();
        this.set('attrs', attrs);
    }
});

// Importar el editor después de definir las formas
import './diagram/editor.js';
