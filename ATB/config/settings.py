"""
Application settings and configuration management for ATB trading bot.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any


class Settings:
    """Application settings manager."""
    
    def __init__(self):
        self.config_file = Path("config/app_config.json")
        self.default_settings = {
            "app": {
                "name": "ATB - Auto Trading Bot",
                "version": "1.0.0",
                "window_size": [1200, 800],
                "theme": "dark"
            },
            "logging": {
                "level": "INFO",
                "file_path": "logs/atb.log",
                "max_file_size": "10MB",
                "backup_count": 5
            },
            "trading": {
                "default_broker": "paper",
                "paper_balance": 100000.0,
                "max_positions": 10,
                "risk_per_trade": 0.02
            },
            "backtesting": {
                "default_start_date": "2023-01-01",
                "default_end_date": "2023-12-31",
                "default_symbols": ["AAPL", "GOOGL", "MSFT", "TSLA"]
            }
        }
        self.settings = self._load_settings()
    
    def _load_settings(self) -> Dict[str, Any]:
        """Load settings from file or create default."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except Exception:
                return self.default_settings.copy()
        else:
            # Create default config file
            self._save_settings(self.default_settings)
            return self.default_settings.copy()
    
    def _save_settings(self, settings: Dict[str, Any]):
        """Save settings to file."""
        self.config_file.parent.mkdir(exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(settings, f, indent=2)
    
    def get(self, key: str, default=None):
        """Get setting value by key."""
        keys = key.split('.')
        value = self.settings
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    def set(self, key: str, value: Any):
        """Set setting value by key."""
        keys = key.split('.')
        current = self.settings
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        current[keys[-1]] = value
        self._save_settings(self.settings)
    
    def get_all(self) -> Dict[str, Any]:
        """Get all settings."""
        return self.settings.copy()


# Global settings instance
_settings = None


def load_settings() -> Settings:
    """Load and return application settings."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def get_setting(key: str, default=None):
    """Get a setting value."""
    settings = load_settings()
    return settings.get(key, default)


def set_setting(key: str, value: Any):
    """Set a setting value."""
    settings = load_settings()
    settings.set(key, value) 