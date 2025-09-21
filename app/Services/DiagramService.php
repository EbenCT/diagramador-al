<?php
// app/Services/DiagramService.php

namespace App\Services;

use App\Models\Diagram;
use App\Models\DiagramSession;
use App\Models\Collaborator;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DiagramService
{
    /**
     * Crear un nuevo diagrama
     */
    public function create(array $data): Diagram
    {
        $user = Auth::user();

        $diagram = Diagram::create([
            'title' => $data['title'] ?? 'Nuevo Diagrama UML *',
            'description' => $data['description'] ?? null,
            'data' => $data['data'] ?? ['cells' => []],
            'user_id' => $user->id,
            'visibility' => $data['visibility'] ?? 'private',
            'settings' => $data['settings'] ?? [
                'zoom' => 1,
                'panX' => 0,
                'panY' => 0,
                'gridSize' => 20,
                'snapToGrid' => true
            ]
        ]);

        // Actualizar estadísticas
        $diagram->updateStats();

        Log::info('Nuevo diagrama creado', [
            'diagram_id' => $diagram->id,
            'user_id' => $user->id,
            'title' => $diagram->title
        ]);

        return $diagram;
    }

    /**
     * Guardar cambios en un diagrama existente
     */
    public function save(Diagram $diagram, array $data): bool
    {
        try {
            $diagram->fill([
                'data' => $data['data'] ?? $diagram->data,
                'settings' => $data['settings'] ?? $diagram->settings,
                'title' => $data['title'] ?? $diagram->title,
                'description' => $data['description'] ?? $diagram->description
            ]);

            // Actualizar estadísticas automáticamente
            $diagram->updateStats();
            $diagram->incrementVersion();

            Log::info('Diagrama guardado', [
                'diagram_id' => $diagram->id,
                'version' => $diagram->version,
                'elements_count' => $diagram->elements_count
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error guardando diagrama', [
                'diagram_id' => $diagram->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Cargar un diagrama por slug
     */
    public function loadBySlug(string $slug): ?Diagram
    {
        return Diagram::where('slug', $slug)
            ->with(['user', 'sessions'])
            ->first();
    }

    /**
     * Cargar diagrama por ID con verificación de permisos
     */
    public function loadById(int $id, User $user = null): ?Diagram
    {
        $user = $user ?? Auth::user();

        $diagram = Diagram::with(['user', 'sessions'])->find($id);

        if (!$diagram) {
            return null;
        }

        // Verificar permisos
        if ($diagram->visibility === 'private' && $diagram->user_id !== $user->id) {
            // Verificar si el usuario tiene acceso a través de una sesión colaborativa
            $hasAccess = $diagram->sessions()
                ->whereHas('collaborators', function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                          ->where('status', 'online');
                })
                ->exists();

            if (!$hasAccess) {
                return null;
            }
        }

        return $diagram;
    }

    /**
     * Duplicar un diagrama
     */
    public function duplicate(Diagram $diagram, string $newTitle = null): Diagram
    {
        $user = Auth::user();

        $newDiagram = $diagram->duplicate($newTitle);
        $newDiagram->user_id = $user->id;
        $newDiagram->save();

        Log::info('Diagrama duplicado', [
            'original_id' => $diagram->id,
            'new_id' => $newDiagram->id,
            'user_id' => $user->id
        ]);

        return $newDiagram;
    }

    /**
     * Crear sesión colaborativa
     */
    public function createCollaborativeSession(Diagram $diagram, array $options = []): DiagramSession
    {
        $user = Auth::user();

        // Terminar sesiones activas previas
        $diagram->sessions()
            ->where('status', 'active')
            ->update(['status' => 'paused']);

        $session = $diagram->sessions()->create(array_merge([
            'owner_id' => $user->id,
            'title' => $diagram->title . ' - Colaboración',
            'max_collaborators' => 10,
            'allow_anonymous' => true,
            'is_public' => false,
            'invite_expires_at' => Carbon::now()->addHours(24),
            'current_state' => $diagram->data
        ], $options));

        // Agregar al owner como colaborador
        $session->addCollaborator($user, 'owner');

        Log::info('Sesión colaborativa creada', [
            'session_id' => $session->session_id,
            'diagram_id' => $diagram->id,
            'owner_id' => $user->id
        ]);

        return $session;
    }

    /**
     * Unirse a una sesión colaborativa
     */
    public function joinSession(string $sessionId, string $inviteToken, User $user = null): ?DiagramSession
    {
        $session = DiagramSession::where('session_id', $sessionId)
            ->where('invite_token', $inviteToken)
            ->where('status', 'active')
            ->first();

        if (!$session || !$session->isInviteValid()) {
            return null;
        }

        if (!$session->canAcceptMoreCollaborators()) {
            return null;
        }

        // Verificar si ya es colaborador
        if ($user) {
            $existingCollaborator = $session->collaborators()
                ->where('user_id', $user->id)
                ->first();

            if ($existingCollaborator) {
                // Reactivar colaboración existente
                $existingCollaborator->update([
                    'status' => 'online',
                    'last_seen_at' => now()
                ]);

                return $session;
            }
        }

        // Agregar nuevo colaborador
        $role = $session->allow_anonymous && !$user ? 'viewer' : 'editor';
        $session->addCollaborator($user, $role);

        Log::info('Usuario se unió a sesión colaborativa', [
            'session_id' => $session->session_id,
            'user_id' => $user?->id ?? 'anonymous',
            'role' => $role
        ]);

        return $session;
    }

    /**
     * Obtener diagramas accesibles por un usuario
     */
    public function getUserDiagrams(User $user = null, array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $user = $user ?? Auth::user();

        $query = Diagram::with(['user'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('visibility', 'public')
                  ->orWhereHas('sessions.collaborators', function ($subQ) use ($user) {
                      $subQ->where('user_id', $user->id);
                  });
            });

        // Aplicar filtros
        if (isset($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        if (isset($filters['is_template'])) {
            $query->where('is_template', $filters['is_template']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('last_saved_at', 'desc')
                    ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Exportar diagrama a diferentes formatos
     */
    public function exportDiagram(Diagram $diagram, string $format = 'json'): array
    {
        switch ($format) {
            case 'json':
                return [
                    'success' => true,
                    'data' => $diagram->data,
                    'filename' => $diagram->slug . '.json',
                    'content_type' => 'application/json'
                ];

            case 'png':
                // Placeholder - se implementará con html2canvas
                return [
                    'success' => false,
                    'message' => 'Exportación PNG próximamente'
                ];

            case 'java':
                // Placeholder - se implementará en días siguientes
                return [
                    'success' => false,
                    'message' => 'Generación de código Java próximamente'
                ];

            default:
                return [
                    'success' => false,
                    'message' => 'Formato no soportado'
                ];
        }
    }

    /**
     * Limpiar sesiones expiradas
     */
    public function cleanupExpiredSessions(): int
    {
        $expiredSessions = DiagramSession::where('status', 'active')
            ->where('invite_expires_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expiredSessions as $session) {
            $session->end();
            $count++;
        }

        Log::info('Sesiones expiradas limpiadas', ['count' => $count]);

        return $count;
    }

    /**
     * Estadísticas generales del sistema
     */
    public function getSystemStats(): array
    {
        return [
            'total_diagrams' => Diagram::count(),
            'active_sessions' => DiagramSession::where('status', 'active')->count(),
            'online_collaborators' => Collaborator::where('status', 'online')
                ->where('last_seen_at', '>', now()->subMinutes(5))
                ->count(),
            'diagrams_created_today' => Diagram::whereDate('created_at', today())->count(),
            'most_active_user' => User::withCount('diagrams')
                ->orderBy('diagrams_count', 'desc')
                ->first()?->name ?? 'N/A'
        ];
    }
}
