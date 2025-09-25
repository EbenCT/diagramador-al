<?php
// app/Models/DiagramSession.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DiagramSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'diagram_id',
        'title',
        'status',
        'started_at',
        'ended_at',
        'max_collaborators',
        'allow_anonymous',
        'permissions',
        'invite_token',
        'invite_expires_at',
        'is_public',
        'current_state',
        'cursor_positions',
        'active_users_count',
        'owner_id',
        'active_users',      // ← AGREGAR
        'changes_log'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'invite_expires_at' => 'datetime',
        'permissions' => 'array',
        'current_state' => 'array',
        'cursor_positions' => 'array',
        'allow_anonymous' => 'boolean',
        'is_public' => 'boolean',
        'active_users' => 'array',    // ← AGREGAR
        'changes_log' => 'array'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {
            if (!$session->session_id) {
                $session->session_id = (string) Str::uuid();
            }
            if (!$session->invite_token) {
                $session->invite_token = Str::random(32);
            }
            if (!$session->started_at) {
                $session->started_at = now();
            }
        });
    }

    // Relaciones
    public function diagram(): BelongsTo
    {
        return $this->belongsTo(Diagram::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function collaborators(): HasMany
    {
        return $this->hasMany(Collaborator::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    // Métodos de negocio
    public function addCollaborator(User $user = null, string $role = 'viewer', array $permissions = []): Collaborator
    {
        return $this->collaborators()->create([
            'user_id' => $user?->id,
            'anonymous_name' => $user ? null : 'Usuario Anónimo',
            'anonymous_color' => $user ? null : $this->generateRandomColor(),
            'role' => $role,
            'permissions' => $permissions,
            'joined_at' => now(),
            'last_seen_at' => now(),
            'ip_address' => request()->ip()
        ]);
    }

    public function removeCollaborator($collaboratorId): bool
    {
        $collaborator = $this->collaborators()->find($collaboratorId);

        if ($collaborator) {
            $collaborator->update([
                'status' => 'offline',
                'left_at' => now()
            ]);
            $this->updateActiveUsersCount();
            return true;
        }

        return false;
    }

    public function updateActiveUsersCount(): void
    {
        $this->active_users_count = $this->collaborators()
            ->where('status', 'online')
            ->count();
        $this->save();
    }

    public function canAcceptMoreCollaborators(): bool
    {
        return $this->active_users_count < $this->max_collaborators;
    }

public function generateInviteUrl(): string
{
    return route('collaborate.join-with-token', [
        'sessionId' => $this->session_id,
        'token' => $this->invite_token
    ]);
}

    public function isInviteValid(): bool
    {
        return !$this->invite_expires_at || $this->invite_expires_at->isFuture();
    }

    public function end(): void
    {
        $this->update([
            'status' => 'ended',
            'ended_at' => now()
        ]);

        // Marcar todos los colaboradores como offline
        $this->collaborators()->update([
            'status' => 'offline',
            'left_at' => now()
        ]);
    }

    private function generateRandomColor(): string
    {
        $colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return $colors[array_rand($colors)];
    }
/**
 * Agregar cambio al log
 */
public function addChange($change)
{
    $changes = $this->changes_log ?? [];
    $changes[] = $change;

    // Mantener solo los últimos 1000 cambios para performance
    if (count($changes) > 1000) {
        $changes = array_slice($changes, -1000);
    }

    $this->update([
        'changes_log' => $changes,
        'last_activity' => now()
    ]);
}

/**
 * Actualizar actividad del usuario
 */
public function updateUserActivity($userId)
{
    /*
    \Log::info('=== updateUserActivity INICIO ===', [
        'userId' => $userId,
        'current_active_users' => $this->active_users
    ]);
*/
    $activeUsers = $this->active_users ?? [];
    $userExists = false;

    //\Log::info('Active users antes del loop', ['activeUsers' => $activeUsers]);

    // Buscar usuario existente
    foreach ($activeUsers as &$user) {
        if ($user['user_id'] == $userId) {
            $user['last_ping'] = now()->toISOString();
            $userExists = true;
            \Log::info('Usuario existente actualizado', ['user' => $user]);
            break;
        }
    }

    // Agregar usuario si no existe
    if (!$userExists) {
        $newUser = [
            'user_id' => $userId,
            'name' => auth()->user()->name ?? 'Usuario',
            'last_ping' => now()->toISOString()
        ];
        $activeUsers[] = $newUser;
       // \Log::info('Usuario agregado', ['newUser' => $newUser]);
    }

   // \Log::info('Active users antes de filtrar', ['activeUsers' => $activeUsers]);

    // Limpiar usuarios inactivos (más de 30 segundos sin ping)
    $activeUsers = array_filter($activeUsers, function($user) {
        $lastPing = \Carbon\Carbon::parse($user['last_ping']);
        $isActive = $lastPing->diffInSeconds(now()) < 30;
        \Log::info('Verificando usuario', [
            'user_id' => $user['user_id'],
            'last_ping' => $user['last_ping'],
            'seconds_diff' => $lastPing->diffInSeconds(now()),
            'is_active' => $isActive
        ]);
        return $isActive;
    });

    //\Log::info('Active users después de filtrar', ['activeUsers' => array_values($activeUsers)]);

    $result = $this->update(['active_users' => array_values($activeUsers)]);
/*
    \Log::info('=== updateUserActivity RESULTADO ===', [
        'update_result' => $result,
        'final_active_users' => array_values($activeUsers)
    ]);*/
}

/**
 * Obtener usuarios activos
 */
public function getActiveUsers()
{
    return $this->active_users ?? [];
}
/**
 * Obtener cambios desde un timestamp específico de otros usuarios
 */
public function getChangesSince($lastSync, $currentUserId)
{
    $allChanges = $this->changes_log ?? [];

    // Filtrar cambios:
    // 1. Que sean posteriores a lastSync
    // 2. Que NO sean del usuario actual
    $filteredChanges = array_filter($allChanges, function($change) use ($lastSync, $currentUserId) {
        $isAfterLastSync = ($change['timestamp'] ?? 0) > $lastSync;
        $isFromOtherUser = ($change['user_id'] ?? null) != $currentUserId;

        return $isAfterLastSync && $isFromOtherUser;
    });

    // Re-indexar array (importante para JSON)
    return array_values($filteredChanges);
}

}

