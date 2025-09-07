"""
Centralized logging system for ATB trading bot application.
"""

import logging
import time
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path
import json


class LogManager:
    """Centralized logging manager for the trading bot application."""
    
    def __init__(self):
        self.logs: Dict[str, List[Dict[str, Any]]] = {}
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration."""
        # Create logs directory
        logs_dir = Path("logs")
        logs_dir.mkdir(exist_ok=True)
        
        # Setup file logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(logs_dir / "atb.log"),
                logging.StreamHandler()
            ]
        )
        
        self.logger = logging.getLogger("ATB")
        
    def log_info(self, message: str, bot_name: str = None):
        """Log an info message."""
        self._log("INFO", message, bot_name)
        
    def log_warning(self, message: str, bot_name: str = None):
        """Log a warning message."""
        self._log("WARNING", message, bot_name)
        
    def log_error(self, message: str, bot_name: str = None):
        """Log an error message."""
        self._log("ERROR", message, bot_name)
        
    def log_debug(self, message: str, bot_name: str = None):
        """Log a debug message."""
        self._log("DEBUG", message, bot_name)
        
    def _log(self, level: str, message: str, bot_name: str = None):
        """Internal logging method."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = {
            "timestamp": timestamp,
            "level": level,
            "message": message,
            "bot_name": bot_name
        }
        
        # Add to bot-specific logs
        if bot_name:
            if bot_name not in self.logs:
                self.logs[bot_name] = []
            self.logs[bot_name].append(log_entry)
            
            # Keep only last 1000 entries per bot
            if len(self.logs[bot_name]) > 1000:
                self.logs[bot_name] = self.logs[bot_name][-1000:]
        
        # Add to general logs
        if "general" not in self.logs:
            self.logs["general"] = []
        self.logs["general"].append(log_entry)
        
        # Keep only last 1000 general entries
        if len(self.logs["general"]) > 1000:
            self.logs["general"] = self.logs["general"][-1000:]
        
        # Log to file
        if level == "ERROR":
            self.logger.error(f"{bot_name}: {message}" if bot_name else message)
        elif level == "WARNING":
            self.logger.warning(f"{bot_name}: {message}" if bot_name else message)
        elif level == "DEBUG":
            self.logger.debug(f"{bot_name}: {message}" if bot_name else message)
        else:
            self.logger.info(f"{bot_name}: {message}" if bot_name else message)
    
    def get_bot_logs(self, bot_name: str) -> List[Dict[str, Any]]:
        """Get logs for a specific bot."""
        return self.logs.get(bot_name, [])
    
    def get_general_logs(self) -> List[Dict[str, Any]]:
        """Get general application logs."""
        return self.logs.get("general", [])
    
    def get_all_logs(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all logs."""
        return self.logs.copy()
    
    def clear_bot_logs(self, bot_name: str):
        """Clear logs for a specific bot."""
        if bot_name in self.logs:
            self.logs[bot_name] = []
    
    def clear_all_logs(self):
        """Clear all logs."""
        self.logs = {}
    
    def export_logs(self, file_path: str):
        """Export logs to a JSON file."""
        try:
            with open(file_path, 'w') as f:
                json.dump(self.logs, f, indent=2)
        except Exception as e:
            self.log_error(f"Error exporting logs: {str(e)}")
    
    def close(self):
        """Close the log manager."""
        try:
            # Export logs before closing
            logs_dir = Path("logs")
            logs_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            export_path = logs_dir / f"logs_export_{timestamp}.json"
            self.export_logs(str(export_path))
            
        except Exception as e:
            print(f"Error closing log manager: {str(e)}") 