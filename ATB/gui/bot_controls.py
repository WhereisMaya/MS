"""
Bot controls widget for starting/stopping individual bots.
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, 
    QGroupBox, QFormLayout, QLineEdit, QComboBox, QSpinBox,
    QCheckBox, QTextEdit, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer
from PyQt6.QtGui import QFont, QPalette


class BotControls(QWidget):
    """Bot controls widget for individual bot management."""
    
    # Signals
    bot_config_changed = pyqtSignal(str, dict)
    
    def __init__(self, bot_manager):
        super().__init__()
        self.bot_manager = bot_manager
        self.current_bot = None
        
        self.setup_ui()
        self.setup_connections()
        
        # Setup update timer
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self.update_controls)
        self.update_timer.start(1000)  # Update every second
        
    def setup_ui(self):
        """Setup the bot controls user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)
        
        # Title
        title_label = QLabel("Bot Controls")
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)
        
        # Bot selection
        selection_group = QGroupBox("Selected Bot")
        selection_layout = QVBoxLayout(selection_group)
        
        self.bot_name_label = QLabel("No bot selected")
        self.bot_name_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.bot_name_label.setStyleSheet("font-weight: bold; padding: 10px;")
        selection_layout.addWidget(self.bot_name_label)
        
        layout.addWidget(selection_group)
        
        # Bot status
        status_group = QGroupBox("Bot Status")
        status_layout = QFormLayout(status_group)
        
        self.status_label = QLabel("Unknown")
        self.status_label.setStyleSheet("font-weight: bold; color: #888888;")
        status_layout.addRow("Status:", self.status_label)
        
        self.strategy_label = QLabel("Unknown")
        status_layout.addRow("Strategy:", self.strategy_label)
        
        self.symbol_label = QLabel("Unknown")
        status_layout.addRow("Symbol:", self.symbol_label)
        
        layout.addWidget(status_group)
        
        # Control buttons
        controls_group = QGroupBox("Bot Controls")
        controls_layout = QVBoxLayout(controls_group)
        
        self.start_btn = QPushButton("▶ Start Bot")
        self.start_btn.setEnabled(False)
        self.start_btn.setStyleSheet("""
            QPushButton {
                background-color: #2d5a2d;
                color: white;
                font-weight: bold;
                padding: 10px;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #3d6a3d;
            }
            QPushButton:disabled {
                background-color: #1a1a1a;
                color: #666666;
            }
        """)
        controls_layout.addWidget(self.start_btn)
        
        self.stop_btn = QPushButton("⏹ Stop Bot")
        self.stop_btn.setEnabled(False)
        self.stop_btn.setStyleSheet("""
            QPushButton {
                background-color: #5a2d2d;
                color: white;
                font-weight: bold;
                padding: 10px;
                border-radius: 5px;
            }
            QPushButton:hover {
                background-color: #6a3d3d;
            }
            QPushButton:disabled {
                background-color: #1a1a1a;
                color: #666666;
            }
        """)
        controls_layout.addWidget(self.stop_btn)
        
        layout.addWidget(controls_group)
        
        # Bot configuration
        config_group = QGroupBox("Bot Configuration")
        config_layout = QFormLayout(config_group)
        
        # Strategy selection
        self.strategy_combo = QComboBox()
        self.strategy_combo.addItems(["Simple MA", "RSI", "MACD", "Custom"])
        self.strategy_combo.setEnabled(False)
        config_layout.addRow("Strategy:", self.strategy_combo)
        
        # Symbol input
        self.symbol_input = QLineEdit()
        self.symbol_input.setPlaceholderText("e.g., AAPL")
        self.symbol_input.setEnabled(False)
        config_layout.addRow("Symbol:", self.symbol_input)
        
        # Risk per trade
        self.risk_spin = QSpinBox()
        self.risk_spin.setRange(1, 10)
        self.risk_spin.setValue(2)
        self.risk_spin.setSuffix("%")
        self.risk_spin.setEnabled(False)
        config_layout.addRow("Risk per trade:", self.risk_spin)
        
        # Paper trading toggle
        self.paper_trading_cb = QCheckBox("Paper Trading")
        self.paper_trading_cb.setChecked(True)
        self.paper_trading_cb.setEnabled(False)
        config_layout.addRow("Mode:", self.paper_trading_cb)
        
        layout.addWidget(config_group)
        
        # Apply configuration button
        self.apply_config_btn = QPushButton("Apply Configuration")
        self.apply_config_btn.setEnabled(False)
        layout.addWidget(self.apply_config_btn)
        
        # Bot information
        info_group = QGroupBox("Bot Information")
        info_layout = QVBoxLayout(info_group)
        
        self.info_display = QTextEdit()
        self.info_display.setReadOnly(True)
        self.info_display.setMaximumHeight(150)
        self.info_display.setFont(QFont("Consolas", 9))
        info_layout.addWidget(self.info_display)
        
        layout.addWidget(info_group)
        
        # Add stretch to push everything to the top
        layout.addStretch()
        
    def setup_connections(self):
        """Setup signal connections."""
        self.start_btn.clicked.connect(self.start_bot)
        self.stop_btn.clicked.connect(self.stop_bot)
        self.apply_config_btn.clicked.connect(self.apply_configuration)
        
        # Configuration change signals
        self.strategy_combo.currentTextChanged.connect(self.on_config_changed)
        self.symbol_input.textChanged.connect(self.on_config_changed)
        self.risk_spin.valueChanged.connect(self.on_config_changed)
        self.paper_trading_cb.toggled.connect(self.on_config_changed)
        
    def set_current_bot(self, bot_name: str):
        """Set the current bot for controls."""
        self.current_bot = bot_name
        self.update_controls()
        
    def update_controls(self):
        """Update control states based on current bot."""
        try:
            if not self.current_bot:
                self.bot_name_label.setText("No bot selected")
                self.status_label.setText("Unknown")
                self.strategy_label.setText("Unknown")
                self.symbol_label.setText("Unknown")
                self.start_btn.setEnabled(False)
                self.stop_btn.setEnabled(False)
                self.apply_config_btn.setEnabled(False)
                self.info_display.setPlainText("Select a bot to view information.")
                return
            
            # Get bot information
            bots = self.bot_manager.get_all_bots()
            if self.current_bot not in bots:
                return
                
            bot_info = bots[self.current_bot]
            
            # Update labels
            self.bot_name_label.setText(self.current_bot)
            
            status = "Active" if bot_info.get('active', False) else "Inactive"
            status_color = "#44ff44" if bot_info.get('active', False) else "#ff4444"
            self.status_label.setText(status)
            self.status_label.setStyleSheet(f"font-weight: bold; color: {status_color};")
            
            self.strategy_label.setText(bot_info.get('strategy', 'Unknown'))
            self.symbol_label.setText(bot_info.get('symbol', 'Unknown'))
            
            # Update configuration controls
            self.strategy_combo.setCurrentText(bot_info.get('strategy', 'Simple MA'))
            self.symbol_input.setText(bot_info.get('symbol', ''))
            self.risk_spin.setValue(bot_info.get('risk_per_trade', 2))
            self.paper_trading_cb.setChecked(bot_info.get('paper_trading', True))
            
            # Enable/disable controls based on bot status
            is_active = bot_info.get('active', False)
            self.start_btn.setEnabled(not is_active)
            self.stop_btn.setEnabled(is_active)
            self.apply_config_btn.setEnabled(not is_active)  # Can't change config while running
            
            # Enable/disable configuration inputs
            self.strategy_combo.setEnabled(not is_active)
            self.symbol_input.setEnabled(not is_active)
            self.risk_spin.setEnabled(not is_active)
            self.paper_trading_cb.setEnabled(not is_active)
            
            # Update info display
            self.update_info_display(bot_info)
            
        except Exception as e:
            print(f"Error updating controls: {str(e)}")
    
    def update_info_display(self, bot_info: dict):
        """Update the information display."""
        try:
            info_text = f"""
Bot Information
===============
Name: {self.current_bot}
Status: {'Active' if bot_info.get('active', False) else 'Inactive'}
Strategy: {bot_info.get('strategy', 'Unknown')}
Symbol: {bot_info.get('symbol', 'Unknown')}
Risk per trade: {bot_info.get('risk_per_trade', 2)}%
Paper trading: {'Yes' if bot_info.get('paper_trading', True) else 'No'}

Performance:
- Total trades: 0
- Win rate: 0.0%
- P&L: $0.00
            """
            
            self.info_display.setPlainText(info_text)
            
        except Exception as e:
            print(f"Error updating info display: {str(e)}")
    
    def start_bot(self):
        """Start the current bot."""
        if self.current_bot:
            try:
                self.bot_manager.start_bot(self.current_bot)
            except Exception as e:
                print(f"Error starting bot: {str(e)}")
    
    def stop_bot(self):
        """Stop the current bot."""
        if self.current_bot:
            try:
                self.bot_manager.stop_bot(self.current_bot)
            except Exception as e:
                print(f"Error stopping bot: {str(e)}")
    
    def apply_configuration(self):
        """Apply the current configuration to the bot."""
        if self.current_bot:
            try:
                config = {
                    'strategy': self.strategy_combo.currentText(),
                    'symbol': self.symbol_input.text(),
                    'risk_per_trade': self.risk_spin.value(),
                    'paper_trading': self.paper_trading_cb.isChecked()
                }
                
                self.bot_manager.update_bot_config(self.current_bot, config)
                self.bot_config_changed.emit(self.current_bot, config)
                
            except Exception as e:
                print(f"Error applying configuration: {str(e)}")
    
    def on_config_changed(self):
        """Handle configuration changes."""
        # Enable apply button when configuration changes
        if self.current_bot and not self.bot_manager.is_bot_active(self.current_bot):
            self.apply_config_btn.setEnabled(True) 