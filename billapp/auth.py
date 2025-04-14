from .models import Employee, Owner
from django.contrib.auth.backends import BaseBackend

class CustomAuthBackend(BaseBackend):
    """
    Custom authentication backend to authenticate users against Employee and Owner models.
    """
    
    def authenticate(self, request, user_id=None, password=None):
        """
        Authenticate a user based on user_id and password.
        First checks Employee model, then Owner model.
        """
        if user_id is None or password is None:
            return None
            
        # Try to authenticate as Employee first
        try:
            employee = Employee.objects.get(employee_id=user_id)
            if employee.check_password(password):
                employee.user_type = 'employee'  # Add user_type attribute
                return employee
        except Employee.DoesNotExist:
            pass
            
        # If not an employee, try to authenticate as Owner
        try:
            owner = Owner.objects.get(owner_id=user_id)
            if owner.check_password(password):
                owner.user_type = 'owner'  # Add user_type attribute
                return owner
        except Owner.DoesNotExist:
            pass
            
        # If authentication fails for both models
        return None
            
    def get_user(self, user_id):
        """
        Get the user object from either Employee or Owner model.
        """
        try:
            # Try to get from Employee model first
            employee = Employee.objects.get(id=user_id)
            employee.user_type = 'employee'
            return employee
        except Employee.DoesNotExist:
            try:
                # If not an employee, try Owner model
                owner = Owner.objects.get(id=user_id)
                owner.user_type = 'owner'
                return owner
            except Owner.DoesNotExist:
                return None
