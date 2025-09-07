"""
Main window for ATB trading bot application.
"""

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QSplitter, QLabel, QStatusBar, QMenuBar, QMenu,
    QMessageBox, QFileDialog
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QIcon, QFont, QKeySequence, QAction

from .sidebar import Sidebar
from .central_panel import CentralPanel
from .bot_controls import BotControls


class MainWindow(QMainWindow):
    """Main application window with sophisticated trading interface."""
    
    # Signals
    bot_started = pyqtSignal(str)
    bot_stopped = pyqtSignal(str)
    
    def __init__(self, bot_manager, log_manager):
        super().__init__()
        self.bot_manager = bot_manager
        self.log_manager = log_manager
        
        # Setup UI
        self.setup_ui()
        self.setup_menu()
        self.setup_status_bar()
        self.setup_connections()
        
        # Setup update timer
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self.update_ui)
        self.update_timer.start(1000)  # Update every second
        
    def setup_ui(self):
        """Setup the main user interface."""
        self.setWindowTitle("ATB - Auto Trading Bot")
        self.setGeometry(100, 100, 1400, 900)
        
        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Create main layout
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Create splitter for resizable panels
        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        main_layout.addWidget(self.splitter)
        
        # Create sidebar
        self.sidebar = Sidebar(self.bot_manager)
        self.splitter.addWidget(self.sidebar)
        
        # Create central panel
        self.central_panel = CentralPanel(self.log_manager)
        self.splitter.addWidget(self.central_panel)
        
        # Create bot controls
        self.bot_controls = BotControls(self.bot_manager)
        self.splitter.addWidget(self.bot_controls)
        
        # Set splitter proportions (sidebar: 20%, central: 60%, controls: 20%)
        self.splitter.setSizes([280, 840, 280])
        
        # Connect sidebar selection to central panel
        self.sidebar.bot_selected.connect(self.central_panel.show_bot_logs)
        self.sidebar.bot_selected.connect(self.bot_controls.set_current_bot)
        
    def setup_menu(self):
        """Setup the application menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("&File")
        
        # New Bot action
        new_bot_action = QAction("&New Bot", self)
        new_bot_action.setShortcut(QKeySequence.StandardKey.New)
        new_bot_action.triggered.connect(self.create_new_bot)
        file_menu.addAction(new_bot_action)
        
        # Import Strategy action
        import_strategy_action = QAction("&Import Strategy", self)
        import_strategy_action.setShortcut("Ctrl+I")
        import_strategy_action.triggered.connect(self.import_strategy)
        file_menu.addAction(import_strategy_action)
        
        file_menu.addSeparator()
        
        # Exit action
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut(QKeySequence.StandardKey.Quit)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Tools menu
        tools_menu = menubar.addMenu("&Tools")
        
        # Backtester action
        backtester_action = QAction("&Backtester", self)
        backtester_action.setShortcut("Ctrl+B")
        backtester_action.triggered.connect(self.open_backtester)
        tools_menu.addAction(backtester_action)
        
        # Settings action
        settings_action = QAction("&Settings", self)
        settings_action.setShortcut("Ctrl+,")
        settings_action.triggered.connect(self.open_settings)
        tools_menu.addAction(settings_action)
        
        # Help menu
        help_menu = menubar.addMenu("&Help")
        
        # About action
        about_action = QAction("&About", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
        
    def setup_status_bar(self):
        """Setup the status bar."""
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        # Status indicators
        self.status_label = QLabel("Ready")
        self.status_bar.addWidget(self.status_label)
        
        self.status_bar.addPermanentWidget(QLabel("Active Bots: 0"))
        self.active_bots_label = self.status_bar.addPermanentWidget(QLabel(""))
        
    def setup_connections(self):
        """Setup signal connections."""
        # Connect bot manager signals
        self.bot_manager.bot_started.connect(self.on_bot_started)
        self.bot_manager.bot_stopped.connect(self.on_bot_stopped)
        self.bot_manager.bot_error.connect(self.on_bot_error)
        
        # Connect sidebar signals
        self.sidebar.bot_selected.connect(self.on_bot_selected)
        
    def update_ui(self):
        """Update UI elements."""
        try:
            # Update active bots count
            active_count = len(self.bot_manager.get_active_bots())
            self.status_bar.removeWidget(self.active_bots_label)
            self.active_bots_label = QLabel(f"Active Bots: {active_count}")
            self.status_bar.addPermanentWidget(self.active_bots_label)
            
            # Update sidebar
            self.sidebar.update_bot_list()
            
        except Exception as e:
            self.log_manager.log_error(f"UI update error: {str(e)}")
    
    def create_new_bot(self):
        """Create a new trading bot."""
        try:
            # This would typically open a dialog to configure a new bot
            self.log_manager.log_info("New bot creation requested")
            QMessageBox.information(self, "New Bot", "New bot creation dialog would open here.")
        except Exception as e:
            self.log_manager.log_error(f"Error creating new bot: {str(e)}")
    
    def import_strategy(self):
        """Import a trading strategy."""
        try:
            file_path, _ = QFileDialog.getOpenFileName(
                self, "Import Strategy", "", "Python Files (*.py)"
            )
            if file_path:
                self.log_manager.log_info(f"Importing strategy from: {file_path}")
                # Strategy import logic would go here
        except Exception as e:
            self.log_manager.log_error(f"Error importing strategy: {str(e)}")
    
    def open_backtester(self):
        """Open the backtesting interface."""
        try:
            self.log_manager.log_info("Opening backtester")
            QMessageBox.information(self, "Backtester", "Backtester interface would open here.")
        except Exception as e:
            self.log_manager.log_error(f"Error opening backtester: {str(e)}")
    
    def open_settings(self):
        """Open the settings dialog."""
        try:
            self.log_manager.log_info("Opening settings")
            QMessageBox.information(self, "Settings", "Settings dialog would open here.")
        except Exception as e:
            self.log_manager.log_error(f"Error opening settings: {str(e)}")
    
    def show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About ATB",
            "ATB - Auto Trading Bot\n\n"
            "A sophisticated GUI desktop app for running and monitoring "
            "multiple auto-trading bots.\n\n"
            "Version 1.0.0\n"
            "Built with PyQt6"
        )
    
    def on_bot_started(self, bot_name: str):
        """Handle bot started event."""
        self.status_label.setText(f"Bot '{bot_name}' started")
        self.log_manager.log_info(f"Bot '{bot_name}' started successfully")
    
    def on_bot_stopped(self, bot_name: str):
        """Handle bot stopped event."""
        self.status_label.setText(f"Bot '{bot_name}' stopped")
        self.log_manager.log_info(f"Bot '{bot_name}' stopped")
    
    def on_bot_error(self, bot_name: str, error: str):
        """Handle bot error event."""
        self.status_label.setText(f"Bot '{bot_name}' error")
        self.log_manager.log_error(f"Bot '{bot_name}' error: {error}")
    
    def on_bot_selected(self, bot_name: str):
        """Handle bot selection event."""
        self.status_label.setText(f"Selected bot: {bot_name}")
    
    def closeEvent(self, event):
        """Handle application close event."""
        try:
            # Stop all bots before closing
            self.bot_manager.stop_all_bots()
            
            # Close log manager
            self.log_manager.close()
            
            event.accept()
            
        except Exception as e:
            self.log_manager.log_error(f"Error during shutdown: {str(e)}")
            event.accept() 