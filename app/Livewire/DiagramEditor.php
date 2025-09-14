<?php

namespace App\Livewire;

use Livewire\Attributes\On;
use Livewire\Component;

class DiagramEditor extends Component
{
    public $diagramData = '[]';
    public $selectedTool = 'select';
    public $diagramTitle = 'Diagrama de Clases UML';

    // Herramientas UML disponibles
    public $tools = [
        'select' => 'Seleccionar',
        'class' => 'Clase',
        'association' => 'Asociación',
        'inheritance' => 'Herencia',
        'aggregation' => 'Agregación',
        'composition' => 'Composición'
    ];

    public function mount()
    {
        $this->diagramData = json_encode(['cells' => []]);
    }

    public function selectTool($tool)
    {
        logger("🔧 PHP: Herramienta seleccionada: {$tool}");
        logger("🔧 PHP: Herramienta anterior: {$this->selectedTool}");

        $this->selectedTool = $tool;

        logger("🔧 PHP: Dispatching tool-selected event con: {$tool}");
        $this->dispatch('tool-selected', $tool);

        logger("🔧 PHP: Evento dispatched exitosamente");
    }

    #[On('save-diagram')]
    public function saveDiagram($diagramData = null)
    {
        if ($diagramData) {
            $this->diagramData = $diagramData;
        }

        session()->flash('message', 'Diagrama guardado exitosamente');
    }

    public function clearDiagram()
    {
        $this->diagramData = json_encode(['cells' => []]);
        $this->dispatch('clear-diagram');
        session()->flash('message', 'Diagrama limpiado');
    }

    public function exportDiagram()
    {
        session()->flash('message', 'Funcionalidad de exportación próximamente');
    }

    public function render()
    {
        return view('livewire.diagram-editor');
    }
}
