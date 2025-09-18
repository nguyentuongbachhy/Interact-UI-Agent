from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from core import settings
from database import create_tables
from auth import router as auth_router, get_current_user, User
from products import router as products_router
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

user_agents: Dict[str, Any] = {}

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    success: bool
    error: Optional[str] = None

class AgentStatus(BaseModel):
    user_id: str
    agent_active: bool
    mcp_connected: bool
    available_tools: List[str]

@app.post("/api/agent/create", response_model=Dict[str, str])
async def create_agent(
    current_user: User = Depends(get_current_user)
):
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

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat_with_agent(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    user_id = str(current_user.id)
    
    if user_id not in user_agents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found. Please create an agent first."
        )
    
    try:
        agent = user_agents[user_id]
        response = await agent.ainvoke({
            "messages": [{"role": "user", "content": chat_message.message}]
        })
        
        assistant_message = response["messages"][-1].content
        
        return ChatResponse(
            response=assistant_message.strip(),
            success=True
        )
    except Exception as e:
        return ChatResponse(
            response="",
            success=False,
            error=str(e)
        )

@app.get("/api/agent/status", response_model=AgentStatus)
async def get_agent_status(
    current_user: User = Depends(get_current_user)
):
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
async def delete_agent(
    current_user: User = Depends(get_current_user)
):
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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )