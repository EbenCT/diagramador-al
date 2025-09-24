<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('diagram_sessions', function (Blueprint $table) {
            $table->json('active_users')->nullable()->after('cursor_positions');
        });
    }

    public function down()
    {
        Schema::table('diagram_sessions', function (Blueprint $table) {
            $table->dropColumn('active_users');
        });
    }
};
