"""
Base broker class for broker integrations.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Order:
    """Order data class."""
    symbol: str
    side: str  # 'BUY' or 'SELL'
    quantity: int
    price: float
    order_type: str  # 'MARKET' or 'LIMIT'
    timestamp: datetime
    status: str = 'PENDING'  # 'PENDING', 'FILLED', 'CANCELLED', 'REJECTED'


@dataclass
class Position:
    """Position data class."""
    symbol: str
    quantity: int
    avg_price: float
    current_price: float
    unrealized_pnl: float
    realized_pnl: float


class BaseBroker(ABC):
    """Abstract base class for broker integrations."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get('name', 'Unknown Broker')
        self.paper_trading = config.get('paper_trading', True)
        self.initial_balance = config.get('initial_balance', 100000.0)
        self.current_balance = self.initial_balance
        self.positions: Dict[str, Position] = {}
        self.orders: List[Order] = []
        
    @abstractmethod
    def connect(self) -> bool:
        """Connect to the broker."""
        pass
    
    @abstractmethod
    def disconnect(self):
        """Disconnect from the broker."""
        pass
    
    @abstractmethod
    def get_account_info(self) -> Dict[str, Any]:
        """Get account information."""
        pass
    
    @abstractmethod
    def get_positions(self) -> Dict[str, Position]:
        """Get current positions."""
        pass
    
    @abstractmethod
    def place_order(self, order: Order) -> bool:
        """Place an order."""
        pass
    
    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        """Cancel an order."""
        pass
    
    @abstractmethod
    def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Get current market data for a symbol."""
        pass
    
    def get_balance(self) -> float:
        """Get current account balance."""
        return self.current_balance
    
    def update_balance(self, amount: float):
        """Update account balance."""
        self.current_balance += amount
    
    def is_connected(self) -> bool:
        """Check if connected to broker."""
        return hasattr(self, '_connected') and self._connected
    
    def get_order_history(self) -> List[Order]:
        """Get order history."""
        return self.orders.copy() 