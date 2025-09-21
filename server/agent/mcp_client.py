from typing import List, Optional
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.tools import BaseTool
from core import settings

class MCPClient:
    def __init__(self):
        self.client: Optional[MultiServerMCPClient] = None
        self.connected = False
        self.user_id = None
    
    def connect(self, user_id: str) -> None:
        if self.connected and self.user_id == user_id:
            return
            
        self.user_id = user_id
        
        try:
            self.client = MultiServerMCPClient({
                "ui_bridge": {
                    "url": settings.MCP_BRIDGE_URL,
                    "transport": "streamable_http",
                    "headers": {
                        "User-ID": user_id,
                        "Content-Type": "application/json"
                    }
                }
            })

            self.connected = True
            
        except Exception as e:
            self.connected = False
            raise Exception(f"Failed to connect to MCP bridge: {str(e)}")
    
    async def get_tools(self) -> List[BaseTool]:
        if not self.connected or not self.client:
            return []
        
        try:
            return await self.client.get_tools()
        except Exception as e:
            print(f"Error getting MCP tools: {e}")
            return []
    
    def is_connected(self) -> bool:
        return self.connected and self.client is not None
    
    async def disconnect(self) -> None:
        if self.client and self.connected:
            try:
                await self.client.close()
            except:
                pass
            finally:
                self.connected = False
                self.client = None

mcp_client_instance = MCPClient()

async def main():
    mcp_client_instance.connect("1")
    tools = await mcp_client_instance.get_tools()
    print(tools)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
    