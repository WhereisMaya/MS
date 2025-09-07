# ATB - Auto Trading Bot

A sophisticated GUI desktop application for running and monitoring multiple auto-trading bots. Built with PyQt6, featuring a modular architecture with separate components for strategies, broker APIs, backtesting, and logging.

## Features

- **Multi-Bot Management**: Run multiple trading bots simultaneously with independent control
- **Modular Strategy Engine**: Easy to implement and switch between different trading strategies
- **Broker Integration**: Support for both paper trading and live trading modes
- **Real-time Monitoring**: Live logs, performance metrics, and trade history
- **Backtesting System**: Test strategies against historical data
- **Professional UI**: Dark theme with intuitive controls and real-time updates

## Project Structure

```
ATB/
├── main.py                          # Main application entry point
├── requirements.txt                  # Python dependencies
├── README.md                        # Project documentation
├── config/                          # Application configuration
├── gui/                             # PyQt6 user interface components
├── core/                            # Core application logic
├── strategies/                      # Trading strategy implementations
├── brokers/                         # Broker API integrations
├── backtesting/                     # Backtesting engine
├── logging/                         # Logging system
├── data/                            # Data management
├── utils/                           # Utility functions
└── tests/                           # Test suite
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ATB
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Running the Application

```bash
python main.py
```

### Key Features

- **Sidebar**: Select and manage trading bots
- **Central Panel**: View logs, performance metrics, and trade history
- **Bot Controls**: Start/stop individual bots and configure settings
- **Menu Bar**: Access backtester, settings, and other tools

### Sample Bots

The application comes with three sample bots pre-configured:

1. **AAPL_MA_Bot**: Simple Moving Average strategy on AAPL
2. **GOOGL_RSI_Bot**: RSI strategy on GOOGL
3. **TSLA_MACD_Bot**: MACD strategy on TSLA

## Architecture

### Core Components

- **BotManager**: Manages multiple trading bots and their lifecycle
- **LogManager**: Centralized logging system with bot-specific logs
- **MainWindow**: Main application window with sophisticated UI

### GUI Components

- **Sidebar**: Bot selection and management
- **CentralPanel**: Logs, performance, and trade monitoring
- **BotControls**: Individual bot control and configuration

### Modular Design

- **Strategies**: Pluggable trading strategy implementations
- **Brokers**: Abstract broker interface for different trading platforms
- **Backtesting**: Historical data testing engine
- **Logging**: Comprehensive logging system

## Configuration

Application settings are stored in `config/app_config.json` and include:

- Window size and theme preferences
- Logging configuration
- Trading parameters (risk per trade, paper balance)
- Backtesting defaults

## Development

### Adding New Strategies

1. Create a new strategy class in `strategies/`
2. Inherit from `BaseStrategy`
3. Implement required methods
4. Register in `StrategyFactory`

### Adding New Brokers

1. Create a new broker class in `brokers/`
2. Inherit from `BaseBroker`
3. Implement required methods
4. Register in `BrokerFactory`

### Running Tests

```bash
pytest tests/
```

## Dependencies

- **PyQt6**: Modern GUI framework
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computing
- **matplotlib/seaborn**: Data visualization
- **yfinance**: Yahoo Finance data
- **loguru**: Advanced logging

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Disclaimer

This software is for educational and research purposes only. Trading involves substantial risk of loss and is not suitable for all investors. Past performance does not guarantee future results.

## Support

For questions and support, please open an issue on the GitHub repository. 