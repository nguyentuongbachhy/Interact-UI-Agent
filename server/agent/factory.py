from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import ChatPromptTemplate
from textwrap import dedent

from core import settings
from .mcp_client import mcp_client_instance

async def create_ui_agent(user_id: str):
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        temperature=0.1
    )
    
    try:
        await mcp_client_instance.connect(user_id)
        tools = await mcp_client_instance.get_tools()
        
        if not tools:
            raise Exception("No MCP tools available")
        
        system_prompt = dedent("""\
            You are a UI automation assistant that can:
            - Manage products (add, remove, search)
            - Control UI elements (click, fill forms, navigate)
            - Provide clear feedback on all actions

            Always confirm what actions you're taking and explain the results clearly.
        """)

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("placeholder", "{messages}")
        ])
        
        return create_react_agent(llm, tools, prompt=prompt)
        
    except Exception as e:
        raise Exception(f"Failed to create agent: {str(e)}")