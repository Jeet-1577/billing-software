from django.apps import AppConfig


class BillappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'billapp'
    
    def ready(self):
        """Initialize app when it's ready."""
        pass  # Add any initialization code here if needed
