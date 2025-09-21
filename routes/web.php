<?php
// routes/web.php - ARCHIVO COMPLETO

use App\Http\Controllers\DiagramController;
use App\Http\Controllers\CollaborationController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Aquí es donde puedes registrar las rutas web para tu aplicación. Estas
| rutas son cargadas por el RouteServiceProvider y todas serán asignadas
| al grupo de middleware "web".
|
*/

// Ruta raíz - redirigir según autenticación
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('diagrams.index');
    }

    // Si no está autenticado, mostrar página de bienvenida
    return view('welcome');
})->name('home');

// Rutas de autenticación (descomenta si usas Laravel Breeze/Jetstream/UI)
 require __DIR__.'/auth.php';

// Rutas protegidas por autenticación
Route::middleware('auth')->group(function () {

    // Dashboard principal - redirigir a diagramas
    Route::get('/dashboard', function () {
        return redirect()->route('diagrams.index');
    })->name('dashboard');
   // Rutas de diagramas
    Route::prefix('diagrams')->name('diagrams.')->group(function () {

        // === RUTAS PRINCIPALES ===

        // Lista de diagramas del usuario
        Route::get('/', [DiagramController::class, 'index'])->name('index');

        // Formulario para crear nuevo diagrama (si necesitas un form separado)
        Route::get('/create', [DiagramController::class, 'create'])->name('create');

        // Guardar nuevo diagrama
        Route::post('/', [DiagramController::class, 'store'])->name('store');
        //colaborativo
        Route::post('/diagrams/{diagram}/collaborate', [CollaborationController::class, 'createSession'])->name('diagrams.collaborate');
        // Editor de diagrama - puede ser nuevo o existente
        Route::get('/editor/{diagram?}', function ($diagram = null) {
            if ($diagram) {
                // Verificar que el diagrama existe
                $diagramModel = \App\Models\Diagram::findOrFail($diagram);

                // Verificar permisos
                if (!$diagramModel->canBeEditedBy(Auth::user())) {
                    abort(403, 'No tienes permisos para editar este diagrama');
                }

                return view('diagrams.editor', ['diagramId' => $diagramModel->id]);
            }

            // Nuevo diagrama
            return view('diagrams.editor');
        })->name('editor');

        // === RUTAS ESPECÍFICAS DE DIAGRAMA ===

        // Ver diagrama específico (solo lectura para el propietario)
        Route::get('/{diagram}', [DiagramController::class, 'show'])->name('show');

        // Formulario de edición (si necesitas un form separado del editor)
        Route::get('/{diagram}/edit', [DiagramController::class, 'edit'])->name('edit');

        // Actualizar diagrama existente
        Route::put('/{diagram}', [DiagramController::class, 'update'])->name('update');
        Route::patch('/{diagram}', [DiagramController::class, 'update'])->name('patch');

        // === ACCIONES ESPECÍFICAS ===

        // Duplicar/clonar diagrama
        Route::post('/{diagram}/duplicate', [DiagramController::class, 'duplicate'])->name('duplicate');

        // Eliminar diagrama
        Route::delete('/{diagram}', [DiagramController::class, 'destroy'])->name('destroy');

        // Exportar diagrama en diferentes formatos
        Route::post('/{diagram}/export', [DiagramController::class, 'export'])->name('export');

        // Cambiar visibilidad del diagrama
        Route::post('/{diagram}/visibility', function (\App\Models\Diagram $diagram, \Illuminate\Http\Request $request) {
            // Solo el propietario puede cambiar visibilidad
            if ($diagram->user_id !== Auth::id()) {
                abort(403);
            }

            $request->validate([
                'visibility' => 'required|in:private,public,shared'
            ]);

            $diagram->update(['visibility' => $request->visibility]);

            return redirect()->back()->with('success', 'Visibilidad actualizada');
        })->name('visibility');

        // Marcar/desmarcar como template
        Route::post('/{diagram}/template', function (\App\Models\Diagram $diagram) {
            if ($diagram->user_id !== Auth::id()) {
                abort(403);
            }

            $diagram->update(['is_template' => !$diagram->is_template]);

            $message = $diagram->is_template ? 'Marcado como template' : 'Desmarcado como template';
            return redirect()->back()->with('success', $message);
        })->name('template');

        // === API ENDPOINTS ===
        Route::prefix('api')->name('api.')->group(function () {

            // Auto-guardado (para el JavaScript del editor)
            Route::post('/{diagram}/autosave', [DiagramController::class, 'autosave'])->name('autosave');

            // Obtener estadísticas del diagrama
            Route::get('/{diagram}/stats', [DiagramController::class, 'stats'])->name('stats');

            // Obtener datos raw del diagrama (JSON)
            Route::get('/{diagram}/data', function (\App\Models\Diagram $diagram) {
                if ($diagram->visibility === 'private' && $diagram->user_id !== Auth::id()) {
                    abort(403);
                }

                return response()->json([
                    'success' => true,
                    'data' => $diagram->data,
                    'metadata' => $diagram->metadata,
                    'settings' => $diagram->settings
                ]);
            })->name('data');

            // Actualizar solo los datos del diagrama (para auto-save optimizado)
            Route::patch('/{diagram}/data', function (\App\Models\Diagram $diagram, \Illuminate\Http\Request $request) {
                if (!$diagram->canBeEditedBy(Auth::user())) {
                    abort(403);
                }

                $request->validate([
                    'data' => 'required|array'
                ]);

                $diagram->update([
                    'data' => $request->data
                ]);

                $diagram->updateStats();

                return response()->json([
                    'success' => true,
                    'version' => $diagram->version,
                    'last_saved' => $diagram->last_saved_at
                ]);
            })->name('update-data');

            // Buscar diagramas (para autocomplete o búsquedas rápidas)
            Route::get('/search', function (\Illuminate\Http\Request $request) {
                $query = $request->get('q', '');
                $limit = min($request->get('limit', 10), 50);

                $diagrams = Auth::user()->accessibleDiagrams()
                    ->where('title', 'like', "%{$query}%")
                    ->select('id', 'title', 'description', 'visibility', 'updated_at')
                    ->limit($limit)
                    ->get();

                return response()->json($diagrams);
            })->name('search');
        });
    });
});

// === RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ===

// Ver diagrama compartido públicamente
Route::get('/shared/{diagram:slug}', function (\App\Models\Diagram $diagram) {
    // Solo diagramas públicos son accesibles sin autenticación
    if ($diagram->visibility !== 'public') {
        abort(404, 'Diagrama no encontrado o no es público');
    }

    return view('diagrams.shared', compact('diagram'));
})->name('diagrams.shared');

// API pública para diagramas compartidos
Route::get('/api/shared/{diagram:slug}/data', function (\App\Models\Diagram $diagram) {
    if ($diagram->visibility !== 'public') {
        abort(404);
    }

    return response()->json([
        'success' => true,
        'diagram' => [
            'id' => $diagram->id,
            'title' => $diagram->title,
            'description' => $diagram->description,
            'data' => $diagram->data,
            'stats' => [
                'elements_count' => $diagram->elements_count,
                'classes_count' => $diagram->classes_count,
                'relationships_count' => $diagram->relationships_count,
                'version' => $diagram->version
            ],
            'author' => $diagram->user->name,
            'created_at' => $diagram->created_at,
            'updated_at' => $diagram->updated_at
        ]
    ]);
})->name('api.shared.data');

// === RUTAS PARA COLABORACIÓN (DÍA 4) ===
Route::prefix('collaborate')->name('collaborate.')->group(function () {

    // Página para unirse a sesión colaborativa (sin auth requerido inicialmente)
    Route::get('/{sessionId}', function ($sessionId) {
        // Buscar la sesión
        $session = \App\Models\DiagramSession::where('session_id', $sessionId)
            ->where('status', 'active')
            ->with('diagram')
            ->first();

        if (!$session || !$session->isInviteValid()) {
            abort(404, 'Sesión no encontrada o expirada');
        }

        return view('collaboration.join', compact('session'));
    })->name('join');

    // Unirse a sesión con token
    Route::get('/{sessionId}/{token}', function ($sessionId, $token) {
        $session = \App\Models\DiagramSession::where('session_id', $sessionId)
            ->where('invite_token', $token)
            ->where('status', 'active')
            ->with('diagram')
            ->first();

        if (!$session || !$session->isInviteValid()) {
            abort(404, 'Enlace de invitación no válido o expirado');
        }

        // Si el usuario está autenticado, unirlo directamente
        if (Auth::check()) {
            $collaborationService = app(\App\Services\DiagramService::class);
            $result = $collaborationService->joinSession($sessionId, $token, Auth::user());

            if ($result) {
                return redirect()->route('diagrams.editor', $session->diagram->id)
                    ->with('success', 'Te uniste a la sesión colaborativa');
            }
        }

        return view('collaboration.join', compact('session', 'token'));
    })->name('join-with-token');
});

// === RUTAS ADMINISTRATIVAS (FUTURO) ===
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    // Dashboard administrativo
    Route::get('/dashboard', function () {
        $stats = app(\App\Services\DiagramService::class)->getSystemStats();
        return view('admin.dashboard', compact('stats'));
    })->name('dashboard');

    // Gestión de diagramas
    Route::get('/diagrams', function () {
        $diagrams = \App\Models\Diagram::with('user')
            ->latest()
            ->paginate(20);
        return view('admin.diagrams', compact('diagrams'));
    })->name('diagrams');

    // Gestión de usuarios
    Route::get('/users', function () {
        $users = \App\Models\User::withCount('diagrams')
            ->latest()
            ->paginate(20);
        return view('admin.users', compact('users'));
    })->name('users');

    // Limpiar sesiones manualmente
    Route::post('/cleanup-sessions', function () {
        $count = app(\App\Services\DiagramService::class)->cleanupExpiredSessions();
        return redirect()->back()->with('success', "Se limpiaron {$count} sesiones expiradas");
    })->name('cleanup-sessions');
});

// === RUTAS DE DESARROLLO (SOLO EN LOCAL) ===
if (app()->environment('local')) {

    Route::prefix('dev')->name('dev.')->group(function () {

        // Crear datos de prueba
        Route::get('/seed', function () {
            // Crear usuario de prueba si no existe
            $user = \App\Models\User::firstOrCreate(
                ['email' => 'test@example.com'],
                [
                    'name' => 'Usuario de Prueba',
                    'password' => bcrypt('password')
                ]
            );

            // Crear algunos diagramas de ejemplo
            if ($user->diagrams()->count() === 0) {
                $diagrams = [
                    [
                        'title' => 'Sistema de Gestión de Usuarios',
                        'description' => 'Diagrama UML para sistema de usuarios con roles',
                        'visibility' => 'public'
                    ],
                    [
                        'title' => 'E-commerce - Gestión de Productos',
                        'description' => 'Clases para manejo de catálogo de productos',
                        'visibility' => 'private'
                    ],
                    [
                        'title' => 'Template - Patrón MVC',
                        'description' => 'Template con patrón MVC básico',
                        'visibility' => 'public',
                        'is_template' => true
                    ]
                ];

                foreach ($diagrams as $diagramData) {
                    $user->diagrams()->create(array_merge($diagramData, [
                        'data' => ['cells' => []],
                        'version' => 1
                    ]));
                }
            }

            return redirect('/')->with('success', 'Datos de prueba creados. Usuario: test@example.com, Password: password');
        });

        // Ver info del sistema
        Route::get('/info', function () {
            return response()->json([
                'environment' => app()->environment(),
                'diagrams_count' => \App\Models\Diagram::count(),
                'users_count' => \App\Models\User::count(),
                'sessions_count' => \App\Models\DiagramSession::count(),
                'collaborators_count' => \App\Models\Collaborator::count(),
                'version' => config('app.version', '1.0.0')
            ]);
        });
    });
}

// === FALLBACK PARA 404 PERSONALIZADOS ===
Route::fallback(function () {
    return response()->view('errors.404', [], 404);
});
