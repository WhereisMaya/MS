"""
Base strategy class for trading strategies.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import pandas as pd


class BaseStrategy(ABC):
    """Abstract base class for trading strategies."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get('name', 'Unknown Strategy')
        self.symbol = config.get('symbol', 'AAPL')
        self.risk_per_trade = config.get('risk_per_trade', 2.0)
        
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals from market data."""
        pass
    
    @abstractmethod
    def should_buy(self, data: pd.DataFrame) -> bool:
        """Determine if we should buy."""
        pass
    
    @abstractmethod
    def should_sell(self, data: pd.DataFrame) -> bool:
        """Determine if we should sell."""
        pass
    
    def get_position_size(self, account_balance: float, current_price: float) -> int:
        """Calculate position size based on risk management."""
        risk_amount = account_balance * (self.risk_per_trade / 100)
        position_size = int(risk_amount / current_price)
        return max(1, position_size)  # Minimum 1 share
    
    def update_config(self, new_config: Dict[str, Any]):
        """Update strategy configuration."""
        self.config.update(new_config)
        self.name = self.config.get('name', self.name)
        self.symbol = self.config.get('symbol', self.symbol)
        self.risk_per_trade = self.config.get('risk_per_trade', self.risk_per_trade) 