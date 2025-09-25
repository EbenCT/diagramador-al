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
    \Log::info('=== SYNC DEBUG COMPLETO ===', [
        'sessionToken' => $sessionToken,
        'authenticated' => auth()->check(),
        'auth_user_id' => auth()->id(),
        'auth_user_name' => auth()->user()?->name,
        'request_changes_count' => count($request->input('changes', [])),
    ]);

    $session = DiagramSession::where('invite_token', $sessionToken)
        ->where('status', 'active')
        ->first();

    if (!$session) {
        \Log::error('Sesión no encontrada', ['token' => $sessionToken]);
        return response()->json(['error' => 'Sesión no válida'], 404);
    }

    $userId = auth()->id();

    \Log::info('Usuario para sync', [
        'userId' => $userId,
        'session_id' => $session->id,
        'authenticated' => auth()->check()
    ]);

    // FORZAR userId si no está autenticado (SOLO PARA DEBUG)
    if (!$userId) {
        $userId = rand(3, 4); // Usuario aleatorio para testing
        \Log::warning('USANDO USERID ALEATORIO PARA DEBUG', ['userId' => $userId]);
    }

    // Procesar cambios
    $incomingChanges = $request->input('changes', []);
    foreach ($incomingChanges as $change) {
        $change['user_id'] = $userId;
        $change['timestamp'] = now()->timestamp * 1000;
        $session->addChange($change);
    }

    // CRÍTICO: Actualizar actividad del usuario
    \Log::info('ANTES de updateUserActivity', [
        'userId' => $userId,
        'current_active_users' => $session->active_users
    ]);

    $session->updateUserActivity($userId);
    $session->refresh();

    \Log::info('DESPUÉS de updateUserActivity', [
        'userId' => $userId,
        'active_users' => $session->active_users,
        'count' => count($session->active_users ?? [])
    ]);

    $activeUsers = $session->getActiveUsers();

    \Log::info('RESPUESTA FINAL', [
        'active_users_returned' => $activeUsers,
        'count' => count($activeUsers)
    ]);

    return response()->json([
        'success' => true,
        'changes' => [],
        'active_users' => $activeUsers,
        'server_time' => now()->timestamp * 1000
    ]);
}

}
