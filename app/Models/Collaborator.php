<?php


// app/Models/Collaborator.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Collaborator extends Model
{
    use HasFactory;

    protected $fillable = [
        'diagram_session_id',
        'user_id',
        'anonymous_name',
        'anonymous_color',
        'socket_id',
        'ip_address',
        'user_agent',
        'role',
        'status',
        'permissions',
        'joined_at',
        'last_seen_at',
        'left_at',
        'cursor_position',
        'current_selection',
        'edits_count',
        'elements_created',
        'elements_modified',
        'chat_messages',
        'invited_by_email',
        'invitation_sent_at',
        'invitation_accepted_at'
    ];

    protected $casts = [
        'permissions' => 'array',
        'cursor_position' => 'array',
        'current_selection' => 'array',
        'joined_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'left_at' => 'datetime',
        'invitation_sent_at' => 'datetime',
        'invitation_accepted_at' => 'datetime'
    ];

    // Relaciones
    public function session(): BelongsTo
    {
        return $this->belongsTo(DiagramSession::class, 'diagram_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Accessors
    public function getDisplayNameAttribute(): string
    {
        return $this->user?->name ?? $this->anonymous_name ?? 'Usuario Anónimo';
    }

    public function getIsAnonymousAttribute(): bool
    {
        return is_null($this->user_id);
    }

    public function getIsOnlineAttribute(): bool
    {
        return $this->status === 'online' &&
               $this->last_seen_at->diffInMinutes(now()) < 5;
    }

    // Scopes
    public function scopeOnline($query)
    {
        return $query->where('status', 'online')
                    ->where('last_seen_at', '>', now()->subMinutes(5));
    }

    public function scopeEditors($query)
    {
        return $query->whereIn('role', ['owner', 'editor']);
    }

    public function scopeViewers($query)
    {
        return $query->where('role', 'viewer');
    }

    // Métodos de negocio
    public function updateLastSeen(): void
    {
        $this->last_seen_at = now();
        $this->save();
    }

    public function updateCursorPosition(float $x, float $y, string $elementId = null): void
    {
        $this->cursor_position = [
            'x' => $x,
            'y' => $y,
            'elementId' => $elementId,
            'timestamp' => now()->toISOString()
        ];
        $this->save();
    }

    public function incrementEdit(): void
    {
        $this->increment('edits_count');
        $this->updateLastSeen();
    }

    public function canEdit(): bool
    {
        return in_array($this->role, ['owner', 'editor']);
    }

    public function canView(): bool
    {
        return in_array($this->role, ['owner', 'editor', 'viewer']);
    }

    public function promoteToEditor(): bool
    {
        if ($this->role === 'viewer') {
            $this->role = 'editor';
            $this->save();
            return true;
        }
        return false;
    }

    public function demoteToViewer(): bool
    {
        if ($this->role === 'editor') {
            $this->role = 'viewer';
            $this->save();
            return true;
        }
        return false;
    }
}
