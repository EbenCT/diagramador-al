<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DiagramSession;
use App\Models\Diagram;
use App\Services\DiagramService;
use App\Events\UserJoinedSession;
use App\Events\UserLeftSession;

class CollaborationController extends Controller
{
    protected $diagramService;

    public function __construct(DiagramService $diagramService)
    {
        $this->diagramService = $diagramService;
    }

    /**
     * Crear sesión colaborativa
     */
public function createSession(Request $request, $diagram = null)
{
    // Si viene de la URL /api/diagrams/{diagram}/create-collab
    if ($diagram) {
        $diagramId = $diagram;
    } else {
        // Si viene del body del request
        $request->validate([
            'diagram_id' => 'required|exists:diagrams,id'
        ]);
        $diagramId = $request->diagram_id;
    }

    $diagram = \App\Models\Diagram::findOrFail($diagramId);

    if ($diagram->user_id !== auth()->id()) {
        return response()->json(['error' => 'No autorizado'], 403);
    }

    // Crear sesión usando DiagramService
    $session = $this->diagramService->createCollaborativeSession($diagram, [
        'max_collaborators' => $request->max_collaborators ?? 10,
        'allow_anonymous' => $request->allow_anonymous ?? false
    ]);

    return response()->json([
        'success' => true,
        'session_token' => $session->invite_token, // ✅ IMPORTANTE: devolver invite_token
        'session_id' => $session->session_id,
        'invite_url' => route('collaborate.join-with-token', [
            'sessionId' => $session->session_id,
            'token' => $session->invite_token
        ])
    ]);
}

    /**
     * Unirse a sesión
     */
public function joinSession($sessionId, $token)
{
    $session = $this->diagramService->joinSession($sessionId, $token, auth()->user());

    if (!$session) {
        return redirect()->route('diagrams.index')
            ->with('error', 'Sesión no válida o expirada');
    }

    // IMPORTANTE: Guardar en la sesión de Laravel
    session(['collaboration_session' => $session->session_id]);

    return redirect()->route('diagrams.editor', $session->diagram->id)
        ->with([
            'success' => 'Te uniste a la sesión colaborativa'
        ]);
}

/**
 * Sincronizar cambios (POLLING)
 */
public function sync($sessionToken, Request $request)
{
    // DEBUG: Agregar estas líneas AL INICIO
    \Log::info('=== SYNC DEBUG ===', [
        'sessionToken' => $sessionToken,
        'authenticated' => auth()->check(),
        'user_id' => auth()->id(),
        'request_changes' => count($request->input('changes', [])),
        'last_sync' => $request->input('last_sync')
    ]);

    $session = DiagramSession::where('invite_token', $sessionToken)
        ->where('status', 'active')
        ->first();

    if (!$session) {
        \Log::warning('Sesión no encontrada', ['token' => $sessionToken]);
        return response()->json(['error' => 'Sesión no válida'], 404);
    }

    \Log::info('Sesión encontrada', [
        'session_id' => $session->id,
        'diagram_id' => $session->diagram_id
    ]);

    $userId = auth()->id();
    $lastSync = $request->input('last_sync', 0);

    // 1. RECIBIR Y GUARDAR cambios del usuario actual
    $incomingChanges = $request->input('changes', []);
    foreach ($incomingChanges as $change) {
        $change['user_id'] = $userId;
        $change['timestamp'] = now()->timestamp * 1000; // milliseconds
        $session->addChange($change);
    }

    // 2. OBTENER cambios de otros usuarios desde last_sync
    $allChanges = $session->changes_log ?? [];
    $newChanges = array_filter($allChanges, function($change) use ($lastSync, $userId) {
        return $change['timestamp'] > $lastSync && $change['user_id'] !== $userId;
    });

    // 3. ACTUALIZAR lista de usuarios activos
    \Log::info('ANTES de updateUserActivity', ['user_id' => $userId]);

    try {
        $session->updateUserActivity($userId);
        \Log::info('updateUserActivity COMPLETADO');

        // Recargar la sesión para ver los cambios
        $session->refresh();

        \Log::info('active_users después de updateUserActivity', [
            'active_users' => $session->active_users ?? [],
            'count' => count($session->active_users ?? [])
        ]);

    } catch (\Exception $e) {
        \Log::error('ERROR en updateUserActivity', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }

    return response()->json([
        'success' => true,
        'changes' => array_values($newChanges),
        'active_users' => $session->getActiveUsers(),
        'server_time' => now()->timestamp * 1000
    ]);
}

}
