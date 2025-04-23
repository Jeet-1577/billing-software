from django.contrib.auth.hashers import check_password
from .models import Employee, Owner

class CustomAuthBackend:
    """
    Custom authentication backend that authenticates against both Employee and Owner models.
    """
    
    def authenticate(self, request, user_id=None, password=None):
        # First try authenticating as an Employee
        try:
            user = Employee.objects.get(employee_id=user_id)
            if user.check_password(password):
                # Set user_type to identify this user as an employee
                user.user_type = 'employee'
                return user
        except Employee.DoesNotExist:
            pass  # Continue to check Owner model
            
        # Then try authenticating as an Owner
        try:
            user = Owner.objects.get(owner_id=user_id)
            if user.check_password(password):
                # Set user_type to identify this user as an owner
                user.user_type = 'owner'
                return user
        except Owner.DoesNotExist:
            pass
            
        # Authentication failed
        return None
    
    def get_user(self, user_id):
        # Try to retrieve the user from either model
        try:
            user = Employee.objects.get(pk=user_id)
            user.user_type = 'employee'
            return user
        except Employee.DoesNotExist:
            try:
                user = Owner.objects.get(pk=user_id)
                user.user_type = 'owner'
                return user
            except Owner.DoesNotExist:
                return None
