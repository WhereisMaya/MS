"""
Sidebar widget for bot selection and management.
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget, QListWidgetItem,
    QPushButton, QLabel, QGroupBox, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QIcon


class Sidebar(QWidget):
    """Sidebar widget for bot selection and management."""
    
    # Signals
    bot_selected = pyqtSignal(str)
    bot_added = pyqtSignal(str)
    bot_removed = pyqtSignal(str)
    
    def __init__(self, bot_manager):
        super().__init__()
        self.bot_manager = bot_manager
        self.current_bot = None
        
        self.setup_ui()
        self.setup_connections()
        
    def setup_ui(self):
        """Setup the sidebar user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)
        
        # Title
        title_label = QLabel("Trading Bots")
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)
        
        # Bot list group
        bot_group = QGroupBox("Active Bots")
        bot_layout = QVBoxLayout(bot_group)
        
        # Bot list
        self.bot_list = QListWidget()
        self.bot_list.setAlternatingRowColors(True)
        self.bot_list.setSelectionMode(QListWidget.SelectionMode.SingleSelection)
        bot_layout.addWidget(self.bot_list)
        
        # Bot control buttons
        button_layout = QHBoxLayout()
        
        self.add_bot_btn = QPushButton("+ Add Bot")
        self.add_bot_btn.setMaximumWidth(80)
        button_layout.addWidget(self.add_bot_btn)
        
        self.remove_bot_btn = QPushButton("- Remove")
        self.remove_bot_btn.setMaximumWidth(80)
        self.remove_bot_btn.setEnabled(False)
        button_layout.addWidget(self.remove_bot_btn)
        
        bot_layout.addLayout(button_layout)
        layout.addWidget(bot_group)
        
        # Bot status group
        status_group = QGroupBox("Bot Status")
        status_layout = QVBoxLayout(status_group)
        
        self.status_label = QLabel("No bot selected")
        self.status_label.setWordWrap(True)
        status_layout.addWidget(self.status_label)
        
        layout.addWidget(status_group)
        
        # Quick actions group
        actions_group = QGroupBox("Quick Actions")
        actions_layout = QVBoxLayout(actions_group)
        
        self.start_all_btn = QPushButton("Start All Bots")
        actions_layout.addWidget(self.start_all_btn)
        
        self.stop_all_btn = QPushButton("Stop All Bots")
        actions_layout.addWidget(self.stop_all_btn)
        
        layout.addWidget(actions_group)
        
        # Add stretch to push everything to the top
        layout.addStretch()
        
    def setup_connections(self):
        """Setup signal connections."""
        self.bot_list.itemSelectionChanged.connect(self.on_bot_selection_changed)
        self.add_bot_btn.clicked.connect(self.add_bot)
        self.remove_bot_btn.clicked.connect(self.remove_bot)
        self.start_all_btn.clicked.connect(self.start_all_bots)
        self.stop_all_btn.clicked.connect(self.stop_all_bots)
        
    def update_bot_list(self):
        """Update the bot list display."""
        try:
            current_selection = self.bot_list.currentItem()
            current_bot_name = current_selection.text() if current_selection else None
            
            # Clear and repopulate list
            self.bot_list.clear()
            
            # Get all bots from bot manager
            bots = self.bot_manager.get_all_bots()
            
            for bot_name, bot_info in bots.items():
                item = QListWidgetItem()
                
                # Create status indicator
                status_icon = "🟢" if bot_info.get('active', False) else "🔴"
                status_text = "Active" if bot_info.get('active', False) else "Inactive"
                
                item.setText(f"{status_icon} {bot_name}")
                item.setData(Qt.ItemDataRole.UserRole, bot_name)
                
                # Set item color based on status
                if bot_info.get('active', False):
                    item.setBackground(Qt.GlobalColor.darkGreen)
                else:
                    item.setBackground(Qt.GlobalColor.darkRed)
                
                self.bot_list.addItem(item)
            
            # Restore selection if possible
            if current_bot_name:
                for i in range(self.bot_list.count()):
                    item = self.bot_list.item(i)
                    if item.data(Qt.ItemDataRole.UserRole) == current_bot_name:
                        self.bot_list.setCurrentItem(item)
                        break
            
        except Exception as e:
            print(f"Error updating bot list: {str(e)}")
    
    def on_bot_selection_changed(self):
        """Handle bot selection change."""
        current_item = self.bot_list.currentItem()
        if current_item:
            bot_name = current_item.data(Qt.ItemDataRole.UserRole)
            self.current_bot = bot_name
            
            # Update status display
            bots = self.bot_manager.get_all_bots()
            if bot_name in bots:
                bot_info = bots[bot_name]
                status = "Active" if bot_info.get('active', False) else "Inactive"
                strategy = bot_info.get('strategy', 'Unknown')
                self.status_label.setText(f"Bot: {bot_name}\nStatus: {status}\nStrategy: {strategy}")
            else:
                self.status_label.setText(f"Bot: {bot_name}\nStatus: Unknown")
            
            # Enable/disable remove button
            self.remove_bot_btn.setEnabled(True)
            
            # Emit selection signal
            self.bot_selected.emit(bot_name)
        else:
            self.current_bot = None
            self.status_label.setText("No bot selected")
            self.remove_bot_btn.setEnabled(False)
    
    def add_bot(self):
        """Add a new bot."""
        try:
            # This would typically open a dialog to configure a new bot
            # For now, create a simple bot with default settings
            bot_name = f"Bot_{len(self.bot_manager.get_all_bots()) + 1}"
            
            # Add bot to manager
            self.bot_manager.add_bot(bot_name, {
                'strategy': 'Simple MA',
                'symbol': 'AAPL',
                'active': False
            })
            
            # Update display
            self.update_bot_list()
            
            # Emit signal
            self.bot_added.emit(bot_name)
            
        except Exception as e:
            print(f"Error adding bot: {str(e)}")
    
    def remove_bot(self):
        """Remove the selected bot."""
        if self.current_bot:
            try:
                # Remove bot from manager
                self.bot_manager.remove_bot(self.current_bot)
                
                # Update display
                self.update_bot_list()
                
                # Emit signal
                self.bot_removed.emit(self.current_bot)
                
            except Exception as e:
                print(f"Error removing bot: {str(e)}")
    
    def start_all_bots(self):
        """Start all bots."""
        try:
            self.bot_manager.start_all_bots()
            self.update_bot_list()
        except Exception as e:
            print(f"Error starting all bots: {str(e)}")
    
    def stop_all_bots(self):
        """Stop all bots."""
        try:
            self.bot_manager.stop_all_bots()
            self.update_bot_list()
        except Exception as e:
            print(f"Error stopping all bots: {str(e)}") 