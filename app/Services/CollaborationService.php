<?php

namespace App\Services;

use App\Models\DiagramSession;
use App\Models\User;
use App\Events\UserJoinedSession;
use App\Events\UserLeftSession;
use App\Events\DiagramUpdated;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class CollaborationService
{
    /**
     * Crear una sesión colaborativa optimizada
     */
    public function createOptimizedSession($diagramId, $ownerId, $permissions = 'edit', $duration = 24)
    {
        $session = DiagramSession::create([
            'diagram_id' => $diagramId,
            'session_token' => Str::random(32),
            'owner_id' => $ownerId,
            'permissions' => $permissions,
            'expires_at' => now()->addHours($duration),
            'is_active' => true,
            'settings' => [
                'max_collaborators' => 10,
                'allow_anonymous' => false,
                'auto_save' => true,
                'cursor_tracking' => true
            ]
        ]);

        // Cache la sesión para acceso rápido
        Cache::put("session:{$session->session_token}", $session, now()->addHours($duration));

        return $session;
    }

    /**
     * Validar y obtener sesión desde cache
     */
    public function getSession($sessionToken)
    {
        $session = Cache::get("session:{$sessionToken}");

        if (!$session) {
            $session = DiagramSession::where('session_token', $sessionToken)
                ->where('expires_at', '>', now())
                ->where('is_active', true)
                ->first();

            if ($session) {
                Cache::put("session:{$sessionToken}", $session, now()->addMinutes(30));
            }
        }

        return $session;
    }

    /**
     * Gestionar unión a sesión con validaciones
     */
    public function joinSessionSecurely($sessionToken, User $user)
    {
        $session = $this->getSession($sessionToken);

        if (!$session) {
            throw new \Exception('Sesión no válida o expirada');
        }

        // Verificar límite de colaboradores
        $currentCollaborators = $session->collaborators()
            ->wherePivot('last_seen', '>', now()->subMinutes(5))
            ->count();

        if ($currentCollaborators >= ($session->settings['max_collaborators'] ?? 10)) {
            throw new \Exception('Sesión llena. Máximo de colaboradores alcanzado.');
        }

        // Registrar/actualizar participación
        $session->collaborators()->syncWithoutDetaching([
            $user->id => [
                'joined_at' => now(),
                'last_seen' => now(),
                'session_data' => [
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent()
                ]
            ]
        ]);

        // Broadcast evento
        event(new UserJoinedSession($sessionToken, $user));

        // Invalidar cache para forzar recarga
        Cache::forget("session:{$sessionToken}");

        return $session;
    }

    /**
     * Gestionar salida de sesión
     */
    public function leaveSessionCleanly($sessionToken, User $user)
    {
        $session = $this->getSession($sessionToken);

        if ($session) {
            $session->collaborators()->detach($user->id);
            event(new UserLeftSession($sessionToken, $user));
            Cache::forget("session:{$sessionToken}");
        }
    }

    /**
     * Limpiar sesiones expiradas y optimizar rendimiento
     */
    public function cleanupExpiredSessions()
    {
        $expiredCount = 0;

        // Limpiar sesiones expiradas
        $expiredSessions = DiagramSession::where('expires_at', '<', now())
            ->orWhere('is_active', false)
            ->get();

        foreach ($expiredSessions as $session) {
            // Limpiar colaboradores
            $session->collaborators()->detach();

            // Limpiar cache
            Cache::forget("session:{$session->session_token}");

            // Marcar como inactiva en lugar de eliminar (para auditoría)
            $session->update(['is_active' => false]);

            $expiredCount++;
        }

        // Limpiar colaboradores inactivos (más de 10 minutos)
        $activeSessions = DiagramSession::where('is_active', true)
            ->where('expires_at', '>', now())
            ->get();

        foreach ($activeSessions as $session) {
            $inactiveUsers = $session->collaborators()
                ->wherePivot('last_seen', '<', now()->subMinutes(10))
                ->get();

            foreach ($inactiveUsers as $user) {
                $session->collaborators()->detach($user->id);
                event(new UserLeftSession($session->session_token, $user));
            }
        }

        return $expiredCount;
    }

    /**
     * Obtener estadísticas de colaboración
     */
    public function getCollaborationStats()
    {
        return [
            'active_sessions' => DiagramSession::where('is_active', true)
                ->where('expires_at', '>', now())
                ->count(),
            'total_collaborators' => DiagramSession::where('is_active', true)
                ->withCount('collaborators')
                ->get()
                ->sum('collaborators_count'),
            'sessions_created_today' => DiagramSession::whereDate('created_at', today())->count(),
            'average_session_duration' => DiagramSession::where('is_active', false)
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_duration')
                ->value('avg_duration'),
            'top_collaborative_diagrams' => DiagramSession::with('diagram')
                ->selectRaw('diagram_id, COUNT(*) as session_count')
                ->groupBy('diagram_id')
                ->orderBy('session_count', 'desc')
                ->limit(5)
                ->get()
        ];
    }

    /**
     * Validar permisos de colaboración
     */
    public function hasPermission($sessionToken, $userId, $action = 'edit')
    {
        $session = $this->getSession($sessionToken);

        if (!$session) {
            return false;
        }

        // Owner siempre tiene todos los permisos
        if ($session->owner_id === $userId) {
            return true;
        }

        // Verificar si es colaborador activo
        $isCollaborator = $session->collaborators()
            ->where('user_id', $userId)
            ->wherePivot('last_seen', '>', now()->subMinutes(5))
            ->exists();

        if (!$isCollaborator) {
            return false;
        }

        // Verificar permisos específicos
        switch ($action) {
            case 'view':
                return in_array($session->permissions, ['view', 'edit', 'admin']);
            case 'edit':
                return in_array($session->permissions, ['edit', 'admin']);
            case 'admin':
                return $session->permissions === 'admin';
            default:
                return false;
        }
    }
}
