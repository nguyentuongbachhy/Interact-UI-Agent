import logging
import os
from dataclasses import dataclass

@dataclass
class Config:
    """MCP Server configuration"""
    # Server info
    name: str = "interact-ui-mcp-server"
    version: str = "1.0.0"
    
    # Logging
    log_level: str = "INFO"
    
    # Debug mode
    debug: bool = False
    
    @classmethod
    def from_env(cls) -> "Config":
        """Load configuration from environment variables"""
        return cls(
            name=os.getenv("MCP_SERVER_NAME", "interact-ui-mcp-server"),
            version=os.getenv("MCP_SERVER_VERSION", "1.0.0"),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            debug=os.getenv("DEBUG", "false").lower() == "true"
        )

# Global config instance
config = Config.from_env()

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=getattr(logging, config.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )