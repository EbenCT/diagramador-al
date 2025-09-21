<?php
// app/Livewire/DiagramEditor.php - ACTUALIZADO CON PERSISTENCIA

namespace App\Livewire;

use App\Models\Diagram;
use App\Services\DiagramService;
use Livewire\Attributes\On;
use Livewire\Component;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DiagramEditor extends Component
{
    // Props principales
    public $diagramId = null;
    public $diagram = null;
    public $diagramData = '[]';
    public $diagramTitle = 'Nuevo Diagrama UML *';
    public $diagramDescription = '';

    // Estado del editor
    public $elementCount = 0;
    public $lastSaved = null;
    public $isDirty = false;
    public $autoSaveEnabled = true;

    // Configuración
    public $settings = [
        'zoom' => 1,
        'panX' => 0,
        'panY' => 0,
        'gridSize' => 20,
        'snapToGrid' => true
    ];

    protected $diagramService;

    public function boot(DiagramService $diagramService)
    {
        $this->diagramService = $diagramService;
    }

    public function mount($diagramId = null)
    {
        $this->diagramId = $diagramId;

        if ($diagramId) {
            $this->loadExistingDiagram($diagramId);
        } else {
            $this->initializeNewDiagram();
        }

        Log::info("DiagramEditor mounted", [
            'diagramId' => $this->diagramId,
            'user_id' => Auth::id()
        ]);
    }

    private function loadExistingDiagram($diagramId)
    {
        $this->diagram = $this->diagramService->loadById($diagramId);

        if (!$this->diagram) {
            session()->flash('error', 'Diagrama no encontrado o sin permisos');
            return redirect()->route('diagrams.index');
        }

        $this->diagramData = json_encode($this->diagram->data);
        $this->diagramTitle = $this->diagram->title;
        $this->diagramDescription = $this->diagram->description ?? '';
        $this->settings = $this->diagram->settings ?? $this->settings;
        $this->elementCount = $this->diagram->elements_count;
        $this->lastSaved = $this->diagram->last_saved_at;
        $this->isDirty = false;
    }

    private function initializeNewDiagram()
    {
        $this->diagramData = json_encode(['cells' => []]);
        $this->diagramTitle = 'Nuevo Diagrama UML *';
        $this->diagramDescription = '';
        $this->elementCount = 0;
        $this->isDirty = false;
    }

    /**
     * Guardar diagrama - FUNCIÓN PRINCIPAL
     */
    #[On('save-diagram')]
    public function saveDiagram($diagramData = null, $title = null)
    {
        try {
            if (!Auth::check()) {
                session()->flash('error', 'Debes iniciar sesión para guardar');
                return;
            }

            // Actualizar datos locales
            if ($diagramData) {
                $this->diagramData = $diagramData;
                $this->updateElementCount($diagramData);
            }

            // Actualizar título si se proporciona
            if ($title) {
                $this->diagramTitle = $title;
            }

            // Crear o actualizar diagrama
            if ($this->diagram) {
                $success = $this->diagramService->save($this->diagram, [
                    'data' => json_decode($this->diagramData, true),
                    'settings' => $this->settings,
                    'title' => $this->diagramTitle,
                    'description' => $this->diagramDescription
                ]);

                $message = 'Diagrama actualizado exitosamente';
            } else {
                $this->diagram = $this->diagramService->create([
                    'title' => $this->diagramTitle,
                    'description' => $this->diagramDescription,
                    'data' => json_decode($this->diagramData, true),
                    'settings' => $this->settings
                ]);

                $this->diagramId = $this->diagram->id;
                $success = true;
                $message = 'Diagrama creado y guardado exitosamente';

                // Actualizar URL sin recarga y notificar a JavaScript
                $this->dispatch('diagram-created', [
                    'id' => $this->diagram->id,
                    'title' => $this->diagram->title
                ]);
            }

            if ($success) {
                $this->lastSaved = now();
                $this->isDirty = false;
                session()->flash('message', $message);

                Log::info("Diagram saved successfully", [
                    'diagram_id' => $this->diagram->id,
                    'title' => $this->diagramTitle,
                    'elements_count' => $this->elementCount
                ]);
            } else {
                throw new \Exception('Error al guardar en la base de datos');
            }

        } catch (\Exception $e) {
            Log::error("Error saving diagram", [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            session()->flash('error', 'Error al guardar: ' . $e->getMessage());
        }
    }

    /**
     * Auto-guardado silencioso
     */
    #[On('auto-save-diagram')]
    public function autoSave($diagramData)
    {
        if (!$this->autoSaveEnabled || !$this->diagram) {
            return;
        }

        try {
            $this->diagramService->save($this->diagram, [
                'data' => json_decode($diagramData, true)
            ]);

            $this->lastSaved = now();
            $this->isDirty = false;

            Log::debug("Auto-save performed", ['diagram_id' => $this->diagram->id]);

        } catch (\Exception $e) {
            Log::warning("Auto-save failed", [
                'diagram_id' => $this->diagram->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Actualizar título del diagrama
     */
    public function updateTitle()
    {
        $this->validate([
            'diagramTitle' => 'required|string|max:255'
        ]);

        if ($this->diagram) {
            $this->diagramService->save($this->diagram, [
                'title' => $this->diagramTitle
            ]);
        }

        $this->isDirty = true;
        session()->flash('message', 'Título actualizado');
    }

    /**
     * Actualizar descripción
     */
    public function updateDescription()
    {
        if ($this->diagram) {
            $this->diagramService->save($this->diagram, [
                'description' => $this->diagramDescription
            ]);
        }

        $this->isDirty = true;
        session()->flash('message', 'Descripción actualizada');
    }

    /**
     * Limpiar diagrama
     */
    public function clearDiagram()
    {
        $this->diagramData = json_encode(['cells' => []]);
        $this->elementCount = 0;
        $this->isDirty = true;

        $this->dispatch('clear-diagram');
        session()->flash('message', 'Diagrama limpiado');
    }

    /**
     * Duplicar diagrama
     */
    public function duplicateDiagram()
    {
        if (!$this->diagram) {
            session()->flash('error', 'Guarda el diagrama primero');
            return;
        }

        try {
            $duplicate = $this->diagramService->duplicate(
                $this->diagram,
                $this->diagramTitle . ' (Copia)'
            );

            session()->flash('message', 'Diagrama duplicado exitosamente');

            // Redirigir al duplicado
            return redirect()->route('diagrams.editor', ['diagram' => $duplicate->id]);

        } catch (\Exception $e) {
            session()->flash('error', 'Error al duplicar: ' . $e->getMessage());
        }
    }

    /**
     * Crear sesión colaborativa
     */
    public function createCollaborativeSession()
    {
        if (!$this->diagram) {
            session()->flash('error', 'Guarda el diagrama primero');
            return;
        }

        try {
            $session = $this->diagramService->createCollaborativeSession($this->diagram, [
                'allow_anonymous' => true,
                'max_collaborators' => 10
            ]);

            $inviteUrl = $session->generateInviteUrl();

            session()->flash('message', 'Sesión colaborativa creada');
            session()->flash('invite_url', $inviteUrl);

            $this->dispatch('session-created', [
                'sessionId' => $session->session_id,
                'inviteUrl' => $inviteUrl
            ]);

        } catch (\Exception $e) {
            session()->flash('error', 'Error creando sesión: ' . $e->getMessage());
        }
    }

    /**
     * Exportar diagrama
     */
    public function exportDiagram($format = 'json')
    {
        if (!$this->diagram) {
            session()->flash('error', 'Guarda el diagrama primero');
            return;
        }

        try {
            $result = $this->diagramService->exportDiagram($this->diagram, $format);

            if ($result['success']) {
                $this->dispatch('download-export', $result);
                session()->flash('message', 'Exportación lista para descarga');
            } else {
                session()->flash('error', $result['message']);
            }

        } catch (\Exception $e) {
            session()->flash('error', 'Error al exportar: ' . $e->getMessage());
        }
    }

    /**
     * Alternar auto-guardado
     */
    public function toggleAutoSave()
    {
        $this->autoSaveEnabled = !$this->autoSaveEnabled;

        $message = $this->autoSaveEnabled ? 'Auto-guardado activado' : 'Auto-guardado desactivado';
        session()->flash('message', $message);
    }

    /**
     * Obtener estadísticas del diagrama
     */
    public function getStats()
    {
        try {
            $data = json_decode($this->diagramData, true) ?? [];
            $cells = $data['cells'] ?? [];

            return [
                'totalElements' => count($cells),
                'classes' => collect($cells)->where('type', 'like', '%Class%')->count(),
                'relationships' => collect($cells)->where('type', 'like', '%Link%')->count(),
                'lastSaved' => $this->lastSaved?->diffForHumans(),
                'isDirty' => $this->isDirty,
                'autoSaveEnabled' => $this->autoSaveEnabled,
                'diagramId' => $this->diagramId
            ];

        } catch (\Exception $e) {
            Log::error("Error getting stats", ['error' => $e->getMessage()]);
            return ['error' => 'Error obteniendo estadísticas'];
        }
    }

    private function updateElementCount($diagramData)
    {
        try {
            $data = json_decode($diagramData, true);
            $this->elementCount = count($data['cells'] ?? []);
        } catch (\Exception $e) {
            $this->elementCount = 0;
        }
    }

/**
 * Render del componente
 */
public function render()
{
    // NUEVO: Obtener sesión colaborativa
    $collaborationSession = session('collaboration_session');

    return view('livewire.diagram-editor', [
        'stats' => $this->getStats(),
        'canExport' => $this->diagram && !empty($this->diagramData) && $this->diagramData !== '[]',
        'hasChanges' => $this->isDirty,
        'isNewDiagram' => !$this->diagram,
        'diagramId' => $this->diagramId,
        'diagramData' => $this->diagramData,
        'diagramTitle' => $this->diagramTitle,
        // NUEVO: Pasar sesión colaborativa a la vista
        'collaborationSession' => $collaborationSession
    ]);
}
}
