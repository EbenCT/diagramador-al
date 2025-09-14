<?php
// app/Models/Diagram.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Diagram extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'slug',
        'data',
        'metadata',
        'settings',
        'visibility',
        'password',
        'elements_count',
        'classes_count',
        'relationships_count',
        'version',
        'last_saved_at',
        'user_id',
        'is_template',
        'preview_image',
        'exported_at'
    ];

    protected $casts = [
        'data' => 'array',
        'metadata' => 'array',
        'settings' => 'array',
        'last_saved_at' => 'datetime',
        'exported_at' => 'datetime',
        'is_template' => 'boolean'
    ];

    protected $dates = [
        'last_saved_at',
        'exported_at'
    ];

    // Relaciones
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(DiagramSession::class);
    }

    public function activeSession()
    {
        return $this->sessions()
            ->where('status', 'active')
            ->latest()
            ->first();
    }

    // Mutators y Accessors
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value) . '-' . Str::random(8);
    }

    public function getIsEmptyAttribute(): bool
    {
        return $this->elements_count === 0;
    }

    public function getIsSharedAttribute(): bool
    {
        return $this->visibility === 'shared' || $this->visibility === 'public';
    }

    // Scopes
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    public function scopeTemplates($query)
    {
        return $query->where('is_template', true);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecentlyUpdated($query)
    {
        return $query->orderBy('last_saved_at', 'desc');
    }

    // Métodos de negocio
    public function updateStats(): void
    {
        $data = $this->data ?? [];
        $cells = $data['cells'] ?? [];

        $this->elements_count = count($cells);
        $this->classes_count = collect($cells)->where('type', 'like', '%Class%')->count();
        $this->relationships_count = collect($cells)->where('type', 'like', '%Link%')->count();
        $this->last_saved_at = now();

        $this->save();
    }

    public function incrementVersion(): void
    {
        $this->increment('version');
        $this->last_saved_at = now();
        $this->save();
    }

    public function duplicate(string $title = null): self
    {
        $newDiagram = $this->replicate([
            'slug',
            'last_saved_at',
            'exported_at'
        ]);

        $newDiagram->title = $title ?? $this->title . ' (Copia)';
        $newDiagram->version = 1;
        $newDiagram->save();

        return $newDiagram;
    }

    public function canBeEditedBy(User $user): bool
    {
        // El propietario siempre puede editar
        if ($this->user_id === $user->id) {
            return true;
        }

        // Verificar si tiene sesión activa como editor
        $activeSession = $this->activeSession();
        if (!$activeSession) {
            return false;
        }

        $collaborator = $activeSession->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'online')
            ->first();

        return $collaborator && in_array($collaborator->role, ['owner', 'editor']);
    }

    public function generatePreviewImage(): string
    {
        // Placeholder para generación de imagen preview
        // Se implementará cuando tengamos la funcionalidad de exportación
        return '';
    }

    // Métodos estáticos
    public static function createFromTemplate(string $templateSlug, User $user, string $title): ?self
    {
        $template = self::templates()->where('slug', $templateSlug)->first();

        if (!$template) {
            return null;
        }

        return $template->duplicate($title)->tap(function ($diagram) use ($user) {
            $diagram->user_id = $user->id;
            $diagram->is_template = false;
            $diagram->visibility = 'private';
            $diagram->save();
        });
    }
}
