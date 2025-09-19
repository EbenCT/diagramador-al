<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class UserJoinedSession implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sessionId;
    public $user;

    public function __construct($sessionId, User $user)
    {
        $this->sessionId = $sessionId;
        $this->user = $user;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("diagram.{$this->sessionId}");
    }

    public function broadcastAs()
    {
        return 'UserJoinedSession';
    }

    public function broadcastWith()
    {
        return [
            'sessionId' => $this->sessionId,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar ?? null,
                'email' => $this->user->email
            ],
            'timestamp' => now()->timestamp
        ];
    }
}
