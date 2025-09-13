<?php

namespace App\Livewire;

use Livewire\Component;

class DiagramEditor extends Component
{
    public $diagramData = '[]'; // JSON del diagrama
    public $selectedTool = 'select'; // Herramienta seleccionada
    public $diagramTitle = 'Mi Diagrama UML';

    // Herramientas disponibles
    public $tools = [
        'select' => 'Seleccionar',
        'class' => 'Clase',
        'interface' => 'Interfaz',
        'abstract' => 'Clase Abstracta',
        'association' => 'Asociación',
        'inheritance' => 'Herencia',
        'aggregation' => 'Agregación',
        'composition' => 'Composición'
    ];

    public function mount()
    {
        // Inicializar diagrama vacío
        $this->diagramData = json_encode([
            'cells' => []
        ]);
    }

    public function selectTool($tool)
    {
        $this->selectedTool = $tool;
        $this->dispatch('tool-selected', $tool);
    }

    public function saveDiagram($diagramData)
    {
        $this->diagramData = $diagramData;
        // Aquí luego guardaremos en BD
        session()->flash('message', 'Diagrama guardado exitosamente');
    }

    public function clearDiagram()
    {
        $this->diagramData = json_encode(['cells' => []]);
        $this->dispatch('clear-diagram');
    }

    public function render()
    {
        return view('livewire.diagram-editor');
    }
}
