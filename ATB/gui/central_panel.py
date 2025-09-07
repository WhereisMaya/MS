"""
Central panel widget for displaying logs and monitoring information.
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTextEdit, QTabWidget,
    QLabel, QPushButton, QGroupBox, QScrollArea, QFrame
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QTextCursor, QColor


class CentralPanel(QWidget):
    """Central panel for displaying logs and monitoring information."""
    
    def __init__(self, log_manager):
        super().__init__()
        self.log_manager = log_manager
        self.current_bot = None
        
        self.setup_ui()
        self.setup_connections()
        
        # Setup update timer
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self.update_logs)
        self.update_timer.start(1000)  # Update every second
        
    def setup_ui(self):
        """Setup the central panel user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)
        
        # Title
        title_label = QLabel("Trading Monitor")
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)
        
        # Create tab widget
        self.tab_widget = QTabWidget()
        layout.addWidget(self.tab_widget)
        
        # Logs tab
        self.setup_logs_tab()
        
        # Performance tab
        self.setup_performance_tab()
        
        # Trades tab
        self.setup_trades_tab()
        
    def setup_logs_tab(self):
        """Setup the logs tab."""
        logs_widget = QWidget()
        logs_layout = QVBoxLayout(logs_widget)
        
        # Log controls
        controls_layout = QHBoxLayout()
        
        self.clear_logs_btn = QPushButton("Clear Logs")
        controls_layout.addWidget(self.clear_logs_btn)
        
        self.auto_scroll_cb = QPushButton("Auto Scroll")
        self.auto_scroll_cb.setCheckable(True)
        self.auto_scroll_cb.setChecked(True)
        controls_layout.addWidget(self.auto_scroll_cb)
        
        controls_layout.addStretch()
        
        logs_layout.addLayout(controls_layout)
        
        # Log display
        self.log_display = QTextEdit()
        self.log_display.setReadOnly(True)
        self.log_display.setFont(QFont("Consolas", 10))
        self.log_display.setLineWrapMode(QTextEdit.LineWrapMode.NoWrap)
        logs_layout.addWidget(self.log_display)
        
        self.tab_widget.addTab(logs_widget, "Logs")
        
    def setup_performance_tab(self):
        """Setup the performance tab."""
        performance_widget = QWidget()
        performance_layout = QVBoxLayout(performance_widget)
        
        # Performance metrics group
        metrics_group = QGroupBox("Performance Metrics")
        metrics_layout = QVBoxLayout(metrics_group)
        
        self.performance_display = QTextEdit()
        self.performance_display.setReadOnly(True)
        self.performance_display.setMaximumHeight(200)
        metrics_layout.addWidget(self.performance_display)
        
        performance_layout.addWidget(metrics_group)
        
        # Chart placeholder
        chart_group = QGroupBox("Performance Chart")
        chart_layout = QVBoxLayout(chart_group)
        
        chart_placeholder = QLabel("Performance charts will be displayed here")
        chart_placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
        chart_placeholder.setStyleSheet("border: 2px dashed #666; padding: 20px;")
        chart_layout.addWidget(chart_placeholder)
        
        performance_layout.addWidget(chart_group)
        
        self.tab_widget.addTab(performance_widget, "Performance")
        
    def setup_trades_tab(self):
        """Setup the trades tab."""
        trades_widget = QWidget()
        trades_layout = QVBoxLayout(trades_widget)
        
        # Trades display
        self.trades_display = QTextEdit()
        self.trades_display.setReadOnly(True)
        self.trades_display.setFont(QFont("Consolas", 10))
        trades_layout.addWidget(self.trades_display)
        
        self.tab_widget.addTab(trades_widget, "Trades")
        
    def setup_connections(self):
        """Setup signal connections."""
        self.clear_logs_btn.clicked.connect(self.clear_logs)
        
    def show_bot_logs(self, bot_name: str):
        """Show logs for a specific bot."""
        self.current_bot = bot_name
        self.update_logs()
        
    def update_logs(self):
        """Update the log display."""
        try:
            if not self.current_bot:
                return
                
            # Get logs for current bot
            logs = self.log_manager.get_bot_logs(self.current_bot)
            
            # Update log display
            self.log_display.clear()
            
            for log_entry in logs[-100:]:  # Show last 100 entries
                timestamp = log_entry.get('timestamp', '')
                level = log_entry.get('level', 'INFO')
                message = log_entry.get('message', '')
                
                # Color code based on log level
                color = self.get_log_color(level)
                
                log_text = f"[{timestamp}] {level}: {message}\n"
                
                # Apply color formatting
                cursor = self.log_display.textCursor()
                cursor.movePosition(QTextCursor.MoveOperation.End)
                self.log_display.setTextCursor(cursor)
                
                # Insert colored text
                self.log_display.insertHtml(f'<span style="color: {color};">{log_text}</span>')
            
            # Auto scroll if enabled
            if self.auto_scroll_cb.isChecked():
                self.log_display.verticalScrollBar().setValue(
                    self.log_display.verticalScrollBar().maximum()
                )
                
        except Exception as e:
            print(f"Error updating logs: {str(e)}")
    
    def get_log_color(self, level: str) -> str:
        """Get color for log level."""
        colors = {
            'ERROR': '#ff4444',
            'WARNING': '#ffaa00',
            'INFO': '#44ff44',
            'DEBUG': '#888888'
        }
        return colors.get(level.upper(), '#ffffff')
    
    def clear_logs(self):
        """Clear the log display."""
        self.log_display.clear()
    
    def update_performance(self, bot_name: str):
        """Update performance display for a bot."""
        try:
            # This would typically get performance data from the bot manager
            performance_text = f"""
Performance Summary for {bot_name}
=====================================
Total Trades: 0
Win Rate: 0.0%
Profit/Loss: $0.00
Sharpe Ratio: 0.0
Max Drawdown: 0.0%

Recent Performance:
- No trades recorded yet
            """
            
            self.performance_display.setPlainText(performance_text)
            
        except Exception as e:
            print(f"Error updating performance: {str(e)}")
    
    def update_trades(self, bot_name: str):
        """Update trades display for a bot."""
        try:
            # This would typically get trade data from the bot manager
            trades_text = f"""
Trade History for {bot_name}
============================
No trades recorded yet.
            """
            
            self.trades_display.setPlainText(trades_text)
            
        except Exception as e:
            print(f"Error updating trades: {str(e)}") 