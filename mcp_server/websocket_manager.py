import json
import logging
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class MCPCommand:
    """MCP Command structure to send to client"""
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: int

@dataclass 
class UICommand:
    """UI Command to be executed by client"""
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: int = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = int(datetime.now().timestamp() * 1000)

class WebSocketConnectionManager:
    """Manages WebSocket connections and broadcasts commands to clients"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        self.command_queue: List[UICommand] = []
        self.max_queue_size = 100
        
    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        metadata = {
            "user_id": user_id,
            "connected_at": datetime.now(),
            "commands_sent": 0
        }
        self.connection_metadata[websocket] = metadata
        
        logger.info(f"WebSocket connected. User: {user_id}. Total connections: {len(self.active_connections)}")
        
        await self._send_queued_commands(websocket)
        
    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            metadata = self.connection_metadata.pop(websocket, {})
            user_id = metadata.get("user_id", "unknown")
            commands_sent = metadata.get("commands_sent", 0)
            
            logger.info(f"WebSocket disconnected. User: {user_id}. Commands sent: {commands_sent}. "
                       f"Remaining connections: {len(self.active_connections)}")
    
    async def _send_queued_commands(self, websocket: WebSocket):
        """Send queued commands to a newly connected client"""
        if not self.command_queue:
            return
            
        logger.info(f"Sending {len(self.command_queue)} queued commands to new client")
        
        for command in self.command_queue:
            try:
                await self._send_to_websocket(websocket, command)
            except Exception as e:
                logger.error(f"Error sending queued command to client: {e}")
                break
        
        self.command_queue.clear()
    
    async def _send_to_websocket(self, websocket: WebSocket, command: UICommand):
        """Send command to a specific websocket"""
        try:
            message = {
                "type": "command",
                "payload": {
                    "id": command.id,
                    "type": command.type,
                    "payload": command.payload,
                    "timestamp": command.timestamp
                }
            }
            
            logger.info(f"Sending command to client: {message}")
            await websocket.send_text(json.dumps(message))
            
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["commands_sent"] += 1
                
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {e}")
            await self.disconnect(websocket)
            raise
    
    async def broadcast_command(self, command: UICommand):
        """Broadcast a UI command to all connected clients"""
        if not self.active_connections:
            self._queue_command(command)
            logger.warning(f"No active WebSocket connections. Queuing command: {command.type}")
            return
        
        logger.info(f"Broadcasting command '{command.type}' to {len(self.active_connections)} clients")
        
        disconnected_websockets = []
        for websocket in self.active_connections.copy():
            try:
                await self._send_to_websocket(websocket, command)
            except Exception as e:
                logger.error(f"Error sending command to client: {e}")
                disconnected_websockets.append(websocket)
        
        for websocket in disconnected_websockets:
            await self.disconnect(websocket)
    
    def _queue_command(self, command: UICommand):
        """Queue a command when no clients are connected"""
        self.command_queue.append(command)
        
        if len(self.command_queue) > self.max_queue_size:
            removed = self.command_queue.pop(0)
            logger.warning(f"Command queue full. Removed oldest command: {removed.type}")
    
    async def send_to_user(self, user_id: str, command: UICommand):
        """Send command to a specific user"""
        target_websockets = [
            ws for ws, metadata in self.connection_metadata.items() 
            if metadata.get("user_id") == user_id
        ]
        
        if not target_websockets:
            self._queue_command(command)
            logger.warning(f"User {user_id} not connected. Queuing command: {command.type}")
            return
        
        logger.info(f"Sending command '{command.type}' to user {user_id}")
        
        for websocket in target_websockets:
            try:
                await self._send_to_websocket(websocket, command)
            except Exception as e:
                logger.error(f"Error sending command to user {user_id}: {e}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections"""
        return {
            "total_connections": len(self.active_connections),
            "connected_users": [
                {
                    "user_id": metadata.get("user_id"),
                    "connected_at": metadata.get("connected_at").isoformat() if metadata.get("connected_at") else None,
                    "commands_sent": metadata.get("commands_sent", 0)
                }
                for metadata in self.connection_metadata.values()
            ],
            "queued_commands": len(self.command_queue)
        }

websocket_manager = WebSocketConnectionManager()

def create_ui_command(command_type: str, payload: Dict[str, Any], command_id: Optional[str] = None) -> UICommand:
    """Helper function to create UI commands"""
    if command_id is None:
        command_id = f"{command_type}_{int(datetime.now().timestamp() * 1000)}"
    
    return UICommand(
        id=command_id,
        type=command_type,
        payload=payload
    )