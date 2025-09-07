"""
Bot manager for handling multiple trading bots.
"""

from PyQt6.QtCore import QObject, pyqtSignal, QThread, QTimer
from typing import Dict, Any, List
import threading
import time


class BotManager(QObject):
    """Manages multiple trading bots."""
    
    # Signals
    bot_started = pyqtSignal(str)
    bot_stopped = pyqtSignal(str)
    bot_error = pyqtSignal(str, str)
    bot_trade = pyqtSignal(str, dict)
    
    def __init__(self, log_manager):
        super().__init__()
        self.log_manager = log_manager
        self.bots: Dict[str, Dict[str, Any]] = {}
        self.bot_threads: Dict[str, QThread] = {}
        self.bot_timers: Dict[str, QTimer] = {}
        
        # Initialize with some sample bots
        self._initialize_sample_bots()
        
    def _initialize_sample_bots(self):
        """Initialize with sample bots for demonstration."""
        sample_bots = {
            "AAPL_MA_Bot": {
                "strategy": "Simple MA",
                "symbol": "AAPL",
                "active": False,
                "paper_trading": True,
                "risk_per_trade": 2,
                "created": time.time()
            },
            "GOOGL_RSI_Bot": {
                "strategy": "RSI",
                "symbol": "GOOGL",
                "active": False,
                "paper_trading": True,
                "risk_per_trade": 1.5,
                "created": time.time()
            },
            "TSLA_MACD_Bot": {
                "strategy": "MACD",
                "symbol": "TSLA",
                "active": False,
                "paper_trading": True,
                "risk_per_trade": 3,
                "created": time.time()
            }
        }
        
        for bot_name, config in sample_bots.items():
            self.add_bot(bot_name, config)
    
    def add_bot(self, bot_name: str, config: Dict[str, Any]):
        """Add a new bot."""
        try:
            if bot_name in self.bots:
                raise ValueError(f"Bot '{bot_name}' already exists")
            
            # Set default values
            default_config = {
                "strategy": "Simple MA",
                "symbol": "AAPL",
                "active": False,
                "paper_trading": True,
                "risk_per_trade": 2,
                "created": time.time()
            }
            
            # Merge with provided config
            bot_config = {**default_config, **config}
            self.bots[bot_name] = bot_config
            
            self.log_manager.log_info(f"Added bot: {bot_name}")
            
        except Exception as e:
            self.log_manager.log_error(f"Error adding bot '{bot_name}': {str(e)}")
            raise
    
    def remove_bot(self, bot_name: str):
        """Remove a bot."""
        try:
            if bot_name not in self.bots:
                raise ValueError(f"Bot '{bot_name}' does not exist")
            
            # Stop bot if running
            if self.is_bot_active(bot_name):
                self.stop_bot(bot_name)
            
            # Remove from dictionaries
            del self.bots[bot_name]
            
            if bot_name in self.bot_threads:
                del self.bot_threads[bot_name]
            
            if bot_name in self.bot_timers:
                del self.bot_timers[bot_name]
            
            self.log_manager.log_info(f"Removed bot: {bot_name}")
            
        except Exception as e:
            self.log_manager.log_error(f"Error removing bot '{bot_name}': {str(e)}")
            raise
    
    def start_bot(self, bot_name: str):
        """Start a bot."""
        try:
            if bot_name not in self.bots:
                raise ValueError(f"Bot '{bot_name}' does not exist")
            
            if self.is_bot_active(bot_name):
                self.log_manager.log_warning(f"Bot '{bot_name}' is already running")
                return
            
            # Update bot status
            self.bots[bot_name]["active"] = True
            self.bots[bot_name]["started"] = time.time()
            
            # Create and start bot thread
            bot_thread = QThread()
            self.bot_threads[bot_name] = bot_thread
            
            # Create timer for bot updates
            bot_timer = QTimer()
            bot_timer.timeout.connect(lambda: self._update_bot(bot_name))
            bot_timer.start(5000)  # Update every 5 seconds
            self.bot_timers[bot_name] = bot_timer
            
            self.log_manager.log_info(f"Started bot: {bot_name}")
            self.bot_started.emit(bot_name)
            
        except Exception as e:
            self.log_manager.log_error(f"Error starting bot '{bot_name}': {str(e)}")
            self.bot_error.emit(bot_name, str(e))
            raise
    
    def stop_bot(self, bot_name: str):
        """Stop a bot."""
        try:
            if bot_name not in self.bots:
                raise ValueError(f"Bot '{bot_name}' does not exist")
            
            if not self.is_bot_active(bot_name):
                self.log_manager.log_warning(f"Bot '{bot_name}' is not running")
                return
            
            # Update bot status
            self.bots[bot_name]["active"] = False
            self.bots[bot_name]["stopped"] = time.time()
            
            # Stop timer
            if bot_name in self.bot_timers:
                self.bot_timers[bot_name].stop()
                del self.bot_timers[bot_name]
            
            # Stop thread
            if bot_name in self.bot_threads:
                self.bot_threads[bot_name].quit()
                self.bot_threads[bot_name].wait()
                del self.bot_threads[bot_name]
            
            self.log_manager.log_info(f"Stopped bot: {bot_name}")
            self.bot_stopped.emit(bot_name)
            
        except Exception as e:
            self.log_manager.log_error(f"Error stopping bot '{bot_name}': {str(e)}")
            self.bot_error.emit(bot_name, str(e))
            raise
    
    def start_all_bots(self):
        """Start all bots."""
        try:
            for bot_name in self.bots.keys():
                if not self.is_bot_active(bot_name):
                    self.start_bot(bot_name)
        except Exception as e:
            self.log_manager.log_error(f"Error starting all bots: {str(e)}")
    
    def stop_all_bots(self):
        """Stop all bots."""
        try:
            for bot_name in list(self.bots.keys()):
                if self.is_bot_active(bot_name):
                    self.stop_bot(bot_name)
        except Exception as e:
            self.log_manager.log_error(f"Error stopping all bots: {str(e)}")
    
    def is_bot_active(self, bot_name: str) -> bool:
        """Check if a bot is active."""
        return bot_name in self.bots and self.bots[bot_name].get("active", False)
    
    def get_bot(self, bot_name: str) -> Dict[str, Any]:
        """Get bot information."""
        if bot_name not in self.bots:
            raise ValueError(f"Bot '{bot_name}' does not exist")
        return self.bots[bot_name].copy()
    
    def get_all_bots(self) -> Dict[str, Dict[str, Any]]:
        """Get all bots."""
        return {name: config.copy() for name, config in self.bots.items()}
    
    def get_active_bots(self) -> List[str]:
        """Get list of active bot names."""
        return [name for name, config in self.bots.items() if config.get("active", False)]
    
    def update_bot_config(self, bot_name: str, config: Dict[str, Any]):
        """Update bot configuration."""
        try:
            if bot_name not in self.bots:
                raise ValueError(f"Bot '{bot_name}' does not exist")
            
            # Don't allow config changes while bot is running
            if self.is_bot_active(bot_name):
                raise ValueError(f"Cannot update config while bot '{bot_name}' is running")
            
            # Update configuration
            self.bots[bot_name].update(config)
            
            self.log_manager.log_info(f"Updated config for bot: {bot_name}")
            
        except Exception as e:
            self.log_manager.log_error(f"Error updating bot config '{bot_name}': {str(e)}")
            raise
    
    def _update_bot(self, bot_name: str):
        """Update bot logic (called by timer)."""
        try:
            if not self.is_bot_active(bot_name):
                return
            
            bot_config = self.bots[bot_name]
            
            # Simulate trading logic
            self._simulate_trading(bot_name, bot_config)
            
        except Exception as e:
            self.log_manager.log_error(f"Error updating bot '{bot_name}': {str(e)}")
            self.bot_error.emit(bot_name, str(e))
    
    def _simulate_trading(self, bot_name: str, config: Dict[str, Any]):
        """Simulate trading logic for demonstration."""
        import random
        
        # Simulate market data
        symbol = config.get("symbol", "AAPL")
        strategy = config.get("strategy", "Simple MA")
        
        # Simulate price movement
        price_change = random.uniform(-2.0, 2.0)
        current_price = 100 + price_change
        
        # Simulate trading signals
        if random.random() < 0.1:  # 10% chance of trade signal
            trade_type = random.choice(["BUY", "SELL"])
            quantity = random.randint(1, 10)
            
            trade_info = {
                "type": trade_type,
                "symbol": symbol,
                "quantity": quantity,
                "price": current_price,
                "timestamp": time.time(),
                "strategy": strategy
            }
            
            # Log trade
            self.log_manager.log_info(
                f"Bot '{bot_name}' {trade_type} {quantity} {symbol} @ ${current_price:.2f}"
            )
            
            # Emit trade signal
            self.bot_trade.emit(bot_name, trade_info)
        
        # Log periodic status
        self.log_manager.log_info(
            f"Bot '{bot_name}' monitoring {symbol} - Current price: ${current_price:.2f}"
        ) 