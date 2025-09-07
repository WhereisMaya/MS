"""
Backtesting engine for testing trading strategies.
"""

from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import yfinance as yf


class Backtester:
    """Backtesting engine for trading strategies."""
    
    def __init__(self, initial_balance: float = 100000.0):
        self.initial_balance = initial_balance
        self.current_balance = initial_balance
        self.positions: Dict[str, Dict[str, Any]] = {}
        self.trades: List[Dict[str, Any]] = []
        self.equity_curve: List[Dict[str, Any]] = []
        
    def run_backtest(self, strategy, symbol: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Run backtest for a strategy."""
        try:
            # Download historical data
            data = self._get_historical_data(symbol, start_date, end_date)
            
            if data.empty:
                return {"error": f"No data available for {symbol}"}
            
            # Initialize backtest
            self._initialize_backtest()
            
            # Run strategy on historical data
            signals = strategy.generate_signals(data)
            
            # Execute trades based on signals
            self._execute_trades(signals, data)
            
            # Calculate performance metrics
            performance = self._calculate_performance()
            
            return performance
            
        except Exception as e:
            return {"error": f"Backtest failed: {str(e)}"}
    
    def _get_historical_data(self, symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Get historical data from Yahoo Finance."""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(start=start_date, end=end_date)
            
            if data.empty:
                return pd.DataFrame()
            
            # Add technical indicators
            data = self._add_technical_indicators(data)
            
            return data
            
        except Exception as e:
            print(f"Error downloading data for {symbol}: {str(e)}")
            return pd.DataFrame()
    
    def _add_technical_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators to the data."""
        # Simple Moving Averages
        data['SMA_20'] = data['Close'].rolling(window=20).mean()
        data['SMA_50'] = data['Close'].rolling(window=50).mean()
        
        # RSI
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        data['RSI'] = 100 - (100 / (1 + rs))
        
        # MACD
        exp1 = data['Close'].ewm(span=12).mean()
        exp2 = data['Close'].ewm(span=26).mean()
        data['MACD'] = exp1 - exp2
        data['MACD_Signal'] = data['MACD'].ewm(span=9).mean()
        
        return data
    
    def _initialize_backtest(self):
        """Initialize backtest state."""
        self.current_balance = self.initial_balance
        self.positions = {}
        self.trades = []
        self.equity_curve = []
    
    def _execute_trades(self, signals: pd.DataFrame, data: pd.DataFrame):
        """Execute trades based on signals."""
        for i in range(len(signals)):
            if i < 50:  # Skip first 50 periods for indicators to stabilize
                continue
                
            current_date = signals.index[i]
            current_price = data.loc[current_date, 'Close']
            
            # Check for buy signal
            if signals.loc[current_date, 'buy_signal']:
                self._execute_buy(current_date, data.index.name, current_price, 100)
            
            # Check for sell signal
            if signals.loc[current_date, 'sell_signal']:
                self._execute_sell(current_date, data.index.name, current_price)
            
            # Update equity curve
            self._update_equity_curve(current_date, current_price)
    
    def _execute_buy(self, date, symbol: str, price: float, quantity: int):
        """Execute a buy order."""
        cost = price * quantity
        
        if cost > self.current_balance:
            return  # Insufficient funds
        
        # Update balance
        self.current_balance -= cost
        
        # Update positions
        if symbol in self.positions:
            # Add to existing position
            pos = self.positions[symbol]
            total_quantity = pos['quantity'] + quantity
            total_cost = pos['cost'] + cost
            pos['quantity'] = total_quantity
            pos['cost'] = total_cost
            pos['avg_price'] = total_cost / total_quantity
        else:
            # Create new position
            self.positions[symbol] = {
                'quantity': quantity,
                'cost': cost,
                'avg_price': price
            }
        
        # Record trade
        self.trades.append({
            'date': date,
            'symbol': symbol,
            'side': 'BUY',
            'quantity': quantity,
            'price': price,
            'cost': cost
        })
    
    def _execute_sell(self, date, symbol: str, price: float):
        """Execute a sell order."""
        if symbol not in self.positions:
            return  # No position to sell
        
        pos = self.positions[symbol]
        quantity = pos['quantity']
        revenue = price * quantity
        cost = pos['cost']
        pnl = revenue - cost
        
        # Update balance
        self.current_balance += revenue
        
        # Remove position
        del self.positions[symbol]
        
        # Record trade
        self.trades.append({
            'date': date,
            'symbol': symbol,
            'side': 'SELL',
            'quantity': quantity,
            'price': price,
            'revenue': revenue,
            'pnl': pnl
        })
    
    def _update_equity_curve(self, date, current_price: float):
        """Update equity curve."""
        # Calculate current portfolio value
        portfolio_value = self.current_balance
        
        for symbol, pos in self.positions.items():
            portfolio_value += pos['quantity'] * current_price
        
        self.equity_curve.append({
            'date': date,
            'balance': self.current_balance,
            'portfolio_value': portfolio_value,
            'equity': portfolio_value
        })
    
    def _calculate_performance(self) -> Dict[str, Any]:
        """Calculate performance metrics."""
        if not self.equity_curve:
            return {"error": "No equity curve data"}
        
        # Convert to DataFrame
        equity_df = pd.DataFrame(self.equity_curve)
        equity_df.set_index('date', inplace=True)
        
        # Calculate returns
        equity_df['returns'] = equity_df['equity'].pct_change()
        
        # Performance metrics
        total_return = (equity_df['equity'].iloc[-1] - self.initial_balance) / self.initial_balance
        annualized_return = total_return * (252 / len(equity_df))
        volatility = equity_df['returns'].std() * np.sqrt(252)
        sharpe_ratio = annualized_return / volatility if volatility > 0 else 0
        
        # Maximum drawdown
        equity_df['cummax'] = equity_df['equity'].cummax()
        equity_df['drawdown'] = (equity_df['equity'] - equity_df['cummax']) / equity_df['cummax']
        max_drawdown = equity_df['drawdown'].min()
        
        # Trade statistics
        if self.trades:
            trades_df = pd.DataFrame(self.trades)
            winning_trades = trades_df[trades_df['pnl'] > 0] if 'pnl' in trades_df.columns else pd.DataFrame()
            win_rate = len(winning_trades) / len(trades_df) if len(trades_df) > 0 else 0
        else:
            win_rate = 0
        
        return {
            "total_return": total_return,
            "annualized_return": annualized_return,
            "volatility": volatility,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown,
            "win_rate": win_rate,
            "total_trades": len(self.trades),
            "final_balance": equity_df['equity'].iloc[-1],
            "equity_curve": equity_df.to_dict('records'),
            "trades": self.trades
        } 