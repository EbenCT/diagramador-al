<?php
// routes/web.php - ARCHIVO COMPLETO CORREGIDO

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

// ¡IMPORTANTE! Habilitar las rutas de autenticación de Breeze
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

        // ¡CORREGIDO! Editor de diagrama - usa el método editor() del controlador
        Route::get('/editor/{diagram?}', [DiagramController::class, 'editor'])->name('editor');

        // Mostrar diagrama específico
        Route::get('/{diagram}', [DiagramController::class, 'show'])->name('show');

        // Actualizar diagrama existente
        Route::put('/{diagram}', [DiagramController::class, 'update'])->name('update');

        // Eliminar diagrama
        Route::delete('/{diagram}', [DiagramController::class, 'destroy'])->name('destroy');

        // === RUTAS DE COLABORACIÓN ===

        // Crear sesión colaborativa
        Route::post('/{diagram}/collaborate', [CollaborationController::class, 'createSession'])->name('collaborate');

        // Unirse a sesión colaborativa
        Route::get('/collaborate/{token}', [CollaborationController::class, 'joinSession'])->name('join-collaboration');

        // === RUTAS AJAX/API ===

        // Autoguardado
        Route::patch('/{diagram}/autosave', [DiagramController::class, 'autosave'])->name('autosave');

        // Duplicar diagrama
        Route::post('/{diagram}/duplicate', [DiagramController::class, 'duplicate'])->name('duplicate');

        // Exportar diagrama
        Route::post('/{diagram}/export', [DiagramController::class, 'export'])->name('export');

        // Obtener estadísticas del diagrama
        Route::get('/{diagram}/stats', [DiagramController::class, 'stats'])->name('stats');
    });

    // Rutas de colaboración en tiempo real
    Route::prefix('collaboration')->name('collaboration.')->group(function () {

        // Obtener estado de la sesión
        Route::get('/{token}/status', [CollaborationController::class, 'getSessionStatus'])->name('status');

        // Enviar cambios en tiempo real
        Route::post('/{token}/changes', [CollaborationController::class, 'broadcastChanges'])->name('changes');

        // Obtener lista de participantes
        Route::get('/{token}/participants', [CollaborationController::class, 'getParticipants'])->name('participants');

        // Salir de la sesión
        Route::delete('/{token}/leave', [CollaborationController::class, 'leaveSession'])->name('leave');
    });
});
