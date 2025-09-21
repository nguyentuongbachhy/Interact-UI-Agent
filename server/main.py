from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, AsyncGenerator
from contextlib import asynccontextmanager
import json

from langgraph.graph.state import CompiledStateGraph

from core import settings
from database import create_tables
from auth import router as auth_router, get_current_user, User
from products import router as products_router
from notifications import router as notification_router
from agent import create_ui_agent, mcp_client_instance

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    print(f"🚀 {settings.PROJECT_NAME} started on {settings.API_V1_PREFIX}")
    yield
    await mcp_client_instance.disconnect()
    user_agents.clear()
    print("🛑 Server shutdown complete")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(products_router, prefix=settings.API_V1_PREFIX)
app.include_router(notification_router, prefix=settings.API_V1_PREFIX)

user_agents: Dict[str, CompiledStateGraph] = {}

class ChatMessage(BaseModel):
    message: str
    stream: bool = True

class AgentStatus(BaseModel):
    user_id: str
    agent_active: bool
    mcp_connected: bool
    available_tools: List[str]

@app.post("/api/agent/create", response_model=Dict[str, str])
async def create_agent(current_user: User = Depends(get_current_user)):
    user_id = str(current_user.id)
    
    try:
        agent = await create_ui_agent(user_id)
        user_agents[user_id] = agent
        
        return {
            "message": f"Agent created successfully for user {current_user.name}",
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {str(e)}"
        )

async def stream_agent_response(agent: CompiledStateGraph, message: str) -> AsyncGenerator[str, None]:
    try:
        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": message}]},
            version="v2"
        ):
            event_type = event["event"]
            event_data = event.get("data", {})
            run_id = event.get("run_id", "")
            event_name = event.get("name", "")
            
            if event_type == "on_chat_model_start":
                yield f"thinking: {json.dumps({'run_id': run_id, 'name': event_name, 'input': event_data.get('input')})}\n\n"
            
            elif event_type == "on_chat_model_stream":
                chunk = event_data.get("chunk")
                
                if chunk and hasattr(chunk, 'content') and chunk.content:
                    yield f"token: {json.dumps({'content': chunk.content, 'run_id': run_id})}\n\n"
                
                if chunk and hasattr(chunk, 'tool_calls') and chunk.tool_calls:
                    for tool_call in chunk.tool_calls:
                        if tool_call.get('name'):
                            yield f"tool_call: {json.dumps({'name': tool_call.get('name', ''), 'args': tool_call.get('args', {}), 'run_id': run_id})}\n\n"
            
            elif event_type == "on_tool_start":
                yield f"tool_start: {json.dumps({'name': event_name, 'input': event_data.get('input', {}), 'run_id': run_id})}\n\n"
            
            elif event_type == "on_tool_end":
                yield f"tool_end: {json.dumps({'name': event_name, 'output': event_data.get('output', ''), 'run_id': run_id})}\n\n"
            
            elif event_type == "on_chat_model_end":
                yield f"thinking_end: {json.dumps({'run_id': run_id, 'name': event_name, 'output': event_data.get('output')})}\n\n"
        
        yield f"end: {json.dumps({'completed': True})}\n\n"
        
    except Exception as e:
        yield f"error: {json.dumps({'error': str(e)})}\n\n"

@app.post("/api/agent/chat")
async def chat_with_agent_streaming(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user),
):
    user_id = str(current_user.id)
    
    if user_id not in user_agents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found. Please create an agent first."
        )
    
    agent = user_agents[user_id]
    
    return StreamingResponse(
        stream_agent_response(agent, chat_message.message),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/agent/status", response_model=AgentStatus)
async def get_agent_status(current_user: User = Depends(get_current_user)):
    user_id = str(current_user.id)
    
    agent_active = user_id in user_agents
    mcp_connected = mcp_client_instance.is_connected()
    
    available_tools = []
    if mcp_connected:
        try:
            tools = await mcp_client_instance.get_tools()
            available_tools = [tool.name for tool in tools]
        except:
            available_tools = []
    
    return AgentStatus(
        user_id=user_id,
        agent_active=agent_active,
        mcp_connected=mcp_connected,
        available_tools=available_tools
    )

@app.delete("/api/agent")
async def delete_agent(current_user: User = Depends(get_current_user)):
    user_id = str(current_user.id)
    
    if user_id in user_agents:
        del user_agents[user_id]
    
    return {"message": "Agent deleted successfully"}

@app.get("/")
async def root():
    return {
        "message": "Interact UI Agent Server",
        "version": settings.VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mcp_connected": mcp_client_instance.is_connected()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)