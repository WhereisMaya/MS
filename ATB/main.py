#!/usr/bin/env python3
"""
ATB (Auto Trading Bot) - Main Application Entry Point
A sophisticated GUI desktop app for running and monitoring multiple auto-trading bots.
"""

import sys
import os
from pathlib import Path
from PyQt6.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, QWidget, QSplitter
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QIcon, QFont

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from gui.main_window import MainWindow
from core.bot_manager import BotManager
from atb_logging.log_manager import LogManager
from config.settings import load_settings


class ATBApplication:
    """Main application class that coordinates all components."""
    
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.app.setApplicationName("ATB - Auto Trading Bot")
        self.app.setApplicationVersion("1.0.0")
        self.app.setOrganizationName("ATB Trading")
        
        # Load application settings
        self.settings = load_settings()
        
        # Initialize core components
        self.log_manager = LogManager()
        self.bot_manager = BotManager(self.log_manager)
        
        # Create and setup main window
        self.main_window = MainWindow(self.bot_manager, self.log_manager)
        
        # Setup application styling
        self._setup_styling()
        
    def _setup_styling(self):
        """Setup application-wide styling."""
        # Set application font
        font = QFont("Segoe UI", 9)
        self.app.setFont(font)
        
        # Set application style
        self.app.setStyle("Fusion")
        
        # Set dark theme colors
        self.app.setStyleSheet("""
            QMainWindow {
                background-color: #2b2b2b;
                color: #ffffff;
            }
            QWidget {
                background-color: #2b2b2b;
                color: #ffffff;
            }
            QPushButton {
                background-color: #404040;
                border: 1px solid #555555;
                border-radius: 4px;
                padding: 8px 16px;
                color: #ffffff;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #505050;
            }
            QPushButton:pressed {
                background-color: #303030;
            }
            QPushButton:disabled {
                background-color: #1a1a1a;
                color: #666666;
            }
            QListWidget {
                background-color: #1e1e1e;
                border: 1px solid #555555;
                border-radius: 4px;
                color: #ffffff;
            }
            QListWidget::item {
                padding: 8px;
                border-bottom: 1px solid #333333;
            }
            QListWidget::item:selected {
                background-color: #404040;
            }
            QTextEdit {
                background-color: #1e1e1e;
                border: 1px solid #555555;
                border-radius: 4px;
                color: #ffffff;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 10px;
            }
            QLabel {
                color: #ffffff;
            }
            QGroupBox {
                border: 1px solid #555555;
                border-radius: 4px;
                margin-top: 10px;
                padding-top: 10px;
                color: #ffffff;
                font-weight: bold;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
        """)
    
    def run(self):
        """Start the application."""
        try:
            # Show main window
            self.main_window.show()
            
            # Start the application event loop
            return self.app.exec()
            
        except Exception as e:
            self.log_manager.log_error(f"Application startup error: {str(e)}")
            return 1
    
    def cleanup(self):
        """Cleanup resources before exit."""
        try:
            # Stop all bots
            self.bot_manager.stop_all_bots()
            
            # Close log manager
            self.log_manager.close()
            
        except Exception as e:
            print(f"Cleanup error: {str(e)}")


def main():
    """Main entry point for the ATB application."""
    try:
        # Create and run application
        app = ATBApplication()
        
        # Register cleanup function
        app.app.aboutToQuit.connect(app.cleanup)
        
        # Run the application
        exit_code = app.run()
        
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        print("\nApplication interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main() 