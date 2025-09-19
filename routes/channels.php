<?php

use Illuminate\Support\Facades\Broadcast;

// Canal para colaboración de diagramas
Broadcast::channel('diagram.{sessionId}', function ($user, $sessionId) {
    // Por ahora, cualquier usuario autenticado puede acceder
    // Más tarde agregamos validaciones específicas
    return $user ? [
        'id' => $user->id,
        'name' => $user->name
    ] : false;
});
