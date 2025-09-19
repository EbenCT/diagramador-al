<?php
// app/Events/DiagramUpdated.php - Evento principal de colaboración

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DiagramUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sessionId;
    public $userId;
    public $updateType;
    public $data;
    public $timestamp;

    public function __construct($sessionId, $userId, $updateType, $data)
    {
        $this->sessionId = $sessionId;
        $this->userId = $userId;
        $this->updateType = $updateType;
        $this->data = $data;
        $this->timestamp = now()->timestamp;
    }

    public function broadcastOn()
    {
        return new PrivateChannel("diagram.{$this->sessionId}");
    }

    public function broadcastAs()
    {
        return 'DiagramUpdated';
    }

    public function broadcastWith()
    {
        return [
            'sessionId' => $this->sessionId,
            'userId' => $this->userId,
            'updateType' => $this->updateType,
            'data' => $this->data,
            'timestamp' => $this->timestamp
        ];
    }
}
