#!/usr/bin/env python3
import json
import logging
from typing import Any, Dict, Optional
import uvicorn
from fastapi import FastAPI, Request, Header, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from mcp.server.fastmcp import FastMCP
from config import config, setup_logging
from websocket_manager import websocket_manager, create_ui_command

setup_logging()
logger = logging.getLogger(__name__)

mcp = FastMCP(config.name)

@mcp.tool()
def add_product(name: str, price: float, quantity: int) -> str:
    """Add a new product to the system
    
    Args:
        name: Product name
        price: Product price in USD
        quantity: Product quantity in stock
        
    Returns:
        Success message with product details
    """
    logger.info(f"Adding product: {name} (${price}, qty: {quantity})")
    return f"Product '{name}' added successfully with price ${price} and quantity {quantity}"

@mcp.tool()
def remove_product(product_id: str) -> str:
    """Remove a product from the system
    
    Args:
        product_id: Unique identifier of the product to remove
        
    Returns:
        Success message confirming removal
    """
    logger.info(f"Removing product: {product_id}")
    return f"Product {product_id} removed successfully"

@mcp.tool()
def search_product(query: str, filters: Optional[Dict[str, Any]] = None) -> str:
    """Search for products with optional filters
    
    Args:
        query: Search query string
        filters: Optional dictionary of search filters
        
    Returns:
        Search results summary
    """
    if filters is None:
        filters = {}
    logger.info(f"Searching products: '{query}' with filters: {filters}")
    return f"Search executed successfully for query '{query}' with filters: {filters}"

@mcp.tool()
def click_element(selector: str) -> str:
    """Click on a UI element using CSS selector
    
    Args:
        selector: CSS selector for the element to click
        
    Returns:
        Success message confirming the click
    """
    logger.info(f"Clicking element: {selector}")
    
    command = create_ui_command("clickElement", {
        "selector": selector
    })
    
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(websocket_manager.broadcast_command(command))
        else:
            asyncio.run(websocket_manager.broadcast_command(command))
    except Exception as e:
        logger.error(f"Error sending click element command to clients: {e}")
    
    return f"Element '{selector}' clicked successfully"

@mcp.tool()
def fill_form(fields: Dict[str, Any], form_selector: str = "form") -> str:
    """Fill a form with the provided data
    
    Args:
        fields: Dictionary mapping field names to values
        form_selector: CSS selector for the form (defaults to "form")
        
    Returns:
        Success message with form filling details
    """
    logger.info(f"Filling form '{form_selector}' with {len(fields)} fields")
    field_names = ", ".join(fields.keys())
    return f"Form '{form_selector}' filled successfully with fields: {field_names}"

@mcp.tool()
def swipe_tab(tab_name: str, direction: str = "right") -> str:
    """Swipe to navigate between tabs
    
    Args:
        tab_name: Name of the tab to navigate to
        direction: Swipe direction ("left" or "right")
        
    Returns:
        Success message confirming tab navigation
    """
    if direction not in ["left", "right"]:
        raise ValueError("Direction must be 'left' or 'right'")
    
    logger.info(f"Swiping {direction} to tab: {tab_name}")
    return f"Swiped {direction} to tab '{tab_name}' successfully"

@mcp.tool()
def update_ui(component: str, action: str, data: Optional[Dict[str, Any]] = None) -> str:
    """Update a UI component with the specified action
    
    Args:
        component: Name of the UI component to update
        action: Action to perform on the component
        data: Optional additional data for the update
        
    Returns:
        Success message confirming the UI update
    """
    logger.info(f"Updating UI component '{component}' with action '{action}'")
    
    command = create_ui_command("updateUI", {
        "component": component,
        "action": action,
        "data": data
    })
    
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(websocket_manager.broadcast_command(command))
        else:
            asyncio.run(websocket_manager.broadcast_command(command))
    except Exception as e:
        logger.error(f"Error sending update UI command to clients: {e}")
    
    data_info = f" with data: {data}" if data else ""
    return f"UI component '{component}' updated with action '{action}'{data_info}"

@mcp.tool()
def show_notification(
    message: str, 
    notification_type: str = "info", 
    duration: int = 3000
) -> str:
    """Display a notification to the user
    
    Args:
        message: The notification message to display
        notification_type: Type of notification ("info", "success", "warning", "error")
        duration: Duration in milliseconds to show the notification
        
    Returns:
        Success message confirming the notification was shown
    """
    valid_types = ["info", "success", "warning", "error"]
    if notification_type not in valid_types:
        raise ValueError(f"Notification type must be one of: {', '.join(valid_types)}")
    
    logger.info(f"Showing {notification_type} notification: {message}")
    
    command = create_ui_command("showNotification", {
        "message": message,
        "type": notification_type,
        "duration": duration
    })
    
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(websocket_manager.broadcast_command(command))
        else:
            asyncio.run(websocket_manager.broadcast_command(command))
    except Exception as e:
        logger.error(f"Error sending notification command to clients: {e}")
    
    return f"Notification displayed: '{message}' (type: {notification_type}, duration: {duration}ms)"

@mcp.tool()
def navigate_to(path: str, replace: bool = False) -> str:
    """Navigate to a specific path in the application
    
    Args:
        path: The path to navigate to
        replace: Whether to replace the current history entry
        
    Returns:
        Success message confirming navigation
    """
    logger.info(f"Navigating to path: {path} (replace: {replace})")
    
    command = create_ui_command("navigateTo", {
        "path": path,
        "replace": replace
    })
    
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(websocket_manager.broadcast_command(command))
        else:
            asyncio.run(websocket_manager.broadcast_command(command))
    except Exception as e:
        logger.error(f"Error sending navigate command to clients: {e}")
    
    action = "Replaced navigation to" if replace else "Navigated to"
    return f"{action} '{path}' successfully"

@mcp.resource("config://server-status")
def server_status():
    """Get current server status and configuration"""
    return {
        "status": "running",
        "name": config.name,
        "version": config.version,
        "debug_mode": config.debug,
        "log_level": config.log_level,
        "transport": "streamable_http",
        "tools_count": 9,
        "available_tools": [
            "add_product", "remove_product", "search_product",
            "click_element", "fill_form", "swipe_tab",
            "update_ui", "show_notification", "navigate_to"
        ]
    }

app = FastAPI(
    title="MCP UI Interaction Server",
    description="MCP Server for UI automation and interaction",
    version=config.version
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "server": config.name,
        "version": config.version,
        "transport": "streamable_http"
    }

@app.websocket("/mcp")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time UI commands"""
    user_id = None
    try:
        user_id = websocket.query_params.get("user_id")
        
        await websocket_manager.connect(websocket, user_id)
        
        logger.info(f"WebSocket client connected: {user_id}")
        
        while True:
            try:
                message = await websocket.receive_text()
                
                try:
                    data = json.loads(message)
                    message_type = data.get("type")
                    
                    if message_type == "ping":
                        await websocket.send_text(json.dumps({"type": "pong", "timestamp": data.get("timestamp")}))
                    elif message_type == "status":
                        stats = websocket_manager.get_connection_stats()
                        await websocket.send_text(json.dumps({"type": "stats", "data": stats}))
                    else:
                        logger.warning(f"Unknown message type from client: {message_type}")
                        
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from client: {message}")
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket client disconnected: {user_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected during handshake: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        await websocket_manager.disconnect(websocket)

@app.get("/mcp/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return websocket_manager.get_connection_stats()

@app.post("/mcp")
async def mcp_endpoint(
    request: Request,
    user_id: Optional[str] = Header(None, alias="User-ID"),
    content_type: Optional[str] = Header(None, alias="Content-Type")
):
    """Main MCP endpoint for streamable HTTP transport"""
    try:
        body = await request.body()
        
        if config.debug:
            logger.debug(f"MCP Request from user {user_id}: {body.decode()}")
        
        import json
        
        try:
            mcp_request = json.loads(body.decode())
        except json.JSONDecodeError:
            return {"error": "Invalid JSON in request body"}
        
        response = await handle_mcp_request(mcp_request, user_id)
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing MCP request: {e}")
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": -32603,
                "message": str(e)
            },
            "id": mcp_request.get("id") if 'mcp_request' in locals() else None
        }

async def handle_mcp_request(request: Dict[str, Any], user_id: Optional[str]) -> Dict[str, Any]:
    """Handle MCP protocol requests"""
    method = request.get("method")
    params = request.get("params", {})
    request_id = request.get("id")
    
    logger.info(f"Handling MCP request: {method} from user: {user_id}")
    
    try:
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {},
                        "resources": {}
                    },
                    "serverInfo": {
                        "name": config.name,
                        "version": config.version
                    }
                }
            }
        
        elif method == "tools/list":
            tools_list = []
            
            tools_list = [
                {
                    "name": "add_product",
                    "description": "Add a new product to the system",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Product name"},
                            "price": {"type": "number", "description": "Product price in USD"},
                            "quantity": {"type": "integer", "description": "Product quantity in stock"}
                        },
                        "required": ["name", "price", "quantity"]
                    }
                },
                {
                    "name": "remove_product",
                    "description": "Remove a product from the system",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "product_id": {"type": "string", "description": "Unique identifier of the product to remove"}
                        },
                        "required": ["product_id"]
                    }
                },
                {
                    "name": "search_product",
                    "description": "Search for products with optional filters",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query string"},
                            "filters": {"type": "object", "description": "Optional dictionary of search filters"}
                        },
                        "required": ["query"]
                    }
                },
                {
                    "name": "click_element",
                    "description": "Click on a UI element using CSS selector",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "selector": {"type": "string", "description": "CSS selector for the element to click"}
                        },
                        "required": ["selector"]
                    }
                },
                {
                    "name": "fill_form",
                    "description": "Fill a form with the provided data",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "fields": {"type": "object", "description": "Dictionary mapping field names to values"},
                            "form_selector": {"type": "string", "description": "CSS selector for the form", "default": "form"}
                        },
                        "required": ["fields"]
                    }
                },
                {
                    "name": "swipe_tab",
                    "description": "Swipe to navigate between tabs",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "tab_name": {"type": "string", "description": "Name of the tab to navigate to"},
                            "direction": {"type": "string", "description": "Swipe direction", "default": "right"}
                        },
                        "required": ["tab_name"]
                    }
                },
                {
                    "name": "update_ui",
                    "description": "Update a UI component with the specified action",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "component": {"type": "string", "description": "Name of the UI component to update"},
                            "action": {"type": "string", "description": "Action to perform on the component"},
                            "data": {"type": "object", "description": "Optional additional data for the update"}
                        },
                        "required": ["component", "action"]
                    }
                },
                {
                    "name": "show_notification",
                    "description": "Display a notification to the user",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string", "description": "The notification message to display"},
                            "notification_type": {"type": "string", "description": "Type of notification", "default": "info"},
                            "duration": {"type": "integer", "description": "Duration in milliseconds", "default": 3000}
                        },
                        "required": ["message"]
                    }
                },
                {
                    "name": "navigate_to",
                    "description": "Navigate to a specific path in the application",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path to navigate to"},
                            "replace": {"type": "boolean", "description": "Whether to replace the current history entry", "default": False}
                        },
                        "required": ["path"]
                    }
                }
            ]
            
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "tools": tools_list
                }
            }
        
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            result = await execute_tool_function(tool_name, arguments, user_id)
            
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": result
                        }
                    ]
                }
            }
        
        elif method == "resources/list":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "resources": [
                        {
                            "uri": "config://server-status",
                            "name": "Server Status",
                            "description": "Current server status and configuration"
                        }
                    ]
                }
            }
        
        elif method == "resources/read":
            resource_uri = params.get("uri")
            if resource_uri == "config://server-status":
                status = server_status()
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "contents": [
                            {
                                "type": "text",
                                "text": json.dumps(status, indent=2)
                            }
                        ]
                    }
                }
        
        else:
            raise ValueError(f"Unknown method: {method}")
            
    except Exception as e:
        logger.error(f"Error handling MCP request: {e}")
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": -32603,
                "message": str(e)
            }
        }

async def execute_tool_function(tool_name: str, arguments: Dict[str, Any], user_id: Optional[str]) -> str:
    """Execute tool functions"""
    logger.info(f"Executing tool: {tool_name} for user: {user_id}")
    
    user_context = f"[User: {user_id}] " if user_id else ""
    
    if tool_name == "add_product":
        return add_product(**arguments)
    elif tool_name == "remove_product":
        return remove_product(**arguments)
    elif tool_name == "search_product":
        return search_product(**arguments)
    elif tool_name == "click_element":
        return click_element(**arguments)
    elif tool_name == "fill_form":
        return fill_form(**arguments)
    elif tool_name == "swipe_tab":
        return swipe_tab(**arguments)
    elif tool_name == "update_ui":
        return update_ui(**arguments)
    elif tool_name == "show_notification":
        return show_notification(**arguments)
    elif tool_name == "navigate_to":
        return navigate_to(**arguments)
    else:
        raise ValueError(f"Unknown tool: {tool_name}")

def main():
    """Main entry point for HTTP server"""
    logger.info(f"Starting {config.name} HTTP server...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level=config.log_level.lower(),
        access_log=config.debug
    )

if __name__ == "__main__":
    main()