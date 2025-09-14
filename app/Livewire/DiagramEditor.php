<?php

namespace App\Livewire;

use Livewire\Attributes\On;
use Livewire\Component;
use Illuminate\Support\Facades\Log;

class DiagramEditor extends Component
{
    // Props principales
    public $diagramData = '[]';
    public $diagramTitle = 'Diagrama de Clases UML';
    public $diagramId = null;

    // Estado del diagrama
    public $elementCount = 0;
    public $lastSaved = null;
    public $isDirty = false;

    public function mount($diagramId = null)
    {
        $this->diagramId = $diagramId;
        $this->diagramData = json_encode(['cells' => []]);
        $this->lastSaved = now();

        // Si se pasa un ID, cargar el diagrama
        if ($diagramId) {
            $this->loadDiagram($diagramId);
        }

        Log::info("DiagramEditor mounted", ['diagramId' => $diagramId]);
    }

    /**
     * Guardar diagrama - FUNCIÓN PRINCIPAL DE LIVEWIRE
     */
    #[On('save-diagram')]
    public function saveDiagram($diagramData = null)
    {
        try {
            if ($diagramData) {
                $this->diagramData = $diagramData;

                // Contar elementos para estadísticas
                $data = json_decode($diagramData, true);
                $this->elementCount = count($data['cells'] ?? []);
            }

            // Aquí iría la lógica de guardado en BD
            // Por ahora, solo guardamos en sesión para testing
            session()->put('diagram_data', $this->diagramData);
            session()->put('diagram_title', $this->diagramTitle);

            $this->lastSaved = now();
            $this->isDirty = false;

            session()->flash('message', 'Diagrama guardado exitosamente');

            Log::info("Diagram saved", [
                'elementCount' => $this->elementCount,
                'dataSize' => strlen($this->diagramData)
            ]);

        } catch (\Exception $e) {
            Log::error("Error saving diagram", ['error' => $e->getMessage()]);
            session()->flash('error', 'Error al guardar el diagrama: ' . $e->getMessage());
        }
    }

    /**
     * Limpiar diagrama
     */
    public function clearDiagram()
    {
        $this->diagramData = json_encode(['cells' => []]);
        $this->elementCount = 0;
        $this->isDirty = true;

        // Notificar a JavaScript que limpie el canvas
        $this->dispatch('clear-diagram');

        session()->flash('message', 'Diagrama limpiado');

        Log::info("Diagram cleared");
    }

    /**
     * Exportar diagrama - placeholder para futuras implementaciones
     */
    public function exportDiagram($format = 'png')
    {
        try {
            // Por ahora solo mostrar mensaje
            // En el futuro: generar imagen, PDF, código Java, etc.

            switch($format) {
                case 'png':
                    session()->flash('message', 'Exportación PNG próximamente - usa clic derecho > Guardar imagen por ahora');
                    break;
                case 'java':
                    session()->flash('message', 'Generación de código Java próximamente');
                    break;
                case 'xmi':
                    session()->flash('message', 'Exportación XMI próximamente');
                    break;
                default:
                    session()->flash('message', 'Formato de exportación no soportado');
            }

        } catch (\Exception $e) {
            Log::error("Export error", ['format' => $format, 'error' => $e->getMessage()]);
            session()->flash('error', 'Error al exportar: ' . $e->getMessage());
        }
    }

    /**
     * Cargar diagrama desde BD
     */
    public function loadDiagram($diagramId)
    {
        try {
            // Por ahora cargar desde sesión
            $savedData = session()->get('diagram_data');
            $savedTitle = session()->get('diagram_title');

            if ($savedData) {
                $this->diagramData = $savedData;
                $this->diagramTitle = $savedTitle ?? $this->diagramTitle;

                // Contar elementos
                $data = json_decode($savedData, true);
                $this->elementCount = count($data['cells'] ?? []);

                $this->isDirty = false;

                Log::info("Diagram loaded", ['elementCount' => $this->elementCount]);
            }

        } catch (\Exception $e) {
            Log::error("Error loading diagram", ['error' => $e->getMessage()]);
            session()->flash('error', 'Error al cargar diagrama');
        }
    }

    /**
     * Cambiar título del diagrama
     */
    public function updateTitle($title)
    {
        $this->diagramTitle = trim($title) ?: 'Diagrama de Clases UML';
        $this->isDirty = true;

        session()->flash('message', 'Título actualizado');
    }

    /**
     * Auto-save periódico (llamado desde JavaScript cada X minutos)
     */
    #[On('auto-save-diagram')]
    public function autoSave($diagramData)
    {
        if ($diagramData !== $this->diagramData) {
            $this->diagramData = $diagramData;

            // Guardar en sesión sin mostrar mensaje
            session()->put('diagram_data', $this->diagramData);
            $this->lastSaved = now();

            Log::debug("Auto-save performed");
        }
    }

    /**
     * Obtener estadísticas del diagrama
     */
    public function getStats()
    {
        try {
            $data = json_decode($this->diagramData, true);
            $cells = $data['cells'] ?? [];

            $stats = [
                'totalElements' => count($cells),
                'classes' => 0,
                'relationships' => 0,
                'lastSaved' => $this->lastSaved?->diffForHumans(),
                'isDirty' => $this->isDirty
            ];

            foreach ($cells as $cell) {
                if (isset($cell['type'])) {
                    if (str_contains($cell['type'], 'Class')) {
                        $stats['classes']++;
                    } elseif (str_contains($cell['type'], 'Link') ||
                             str_contains($cell['type'], 'Association') ||
                             str_contains($cell['type'], 'Inheritance')) {
                        $stats['relationships']++;
                    }
                }
            }

            return $stats;

        } catch (\Exception $e) {
            Log::error("Error getting stats", ['error' => $e->getMessage()]);
            return ['error' => 'Error obteniendo estadísticas'];
        }
    }

    /**
     * Validation helpers para futuro uso
     */
    private function validateDiagramData($data)
    {
        if (!is_string($data)) {
            return false;
        }

        $decoded = json_decode($data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        return isset($decoded['cells']) && is_array($decoded['cells']);
    }

    /**
     * Render del componente
     */
    public function render()
    {
        // Pasar datos adicionales a la vista si es necesario
        return view('livewire.diagram-editor', [
            'stats' => $this->getStats(),
            'canExport' => !empty($this->diagramData) && $this->diagramData !== '[]'
        ]);
    }

    /**
     * Métodos para debugging en desarrollo
     */
    public function debugInfo()
    {
        if (app()->environment('local')) {
            dump([
                'diagramId' => $this->diagramId,
                'elementCount' => $this->elementCount,
                'dataSize' => strlen($this->diagramData),
                'isDirty' => $this->isDirty,
                'lastSaved' => $this->lastSaved,
                'stats' => $this->getStats()
            ]);
        }
    }
}
