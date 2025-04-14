from django.core.management.base import BaseCommand
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import getpass
import uuid
from billapp.models import Employee

class Command(BaseCommand):
    help = 'Create a new employee with login credentials'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('===== CREATE NEW EMPLOYEE ====='))
        
        # Get employee details with validation
        name = self.get_input('Employee Name: ')
        
        # Generate a unique employee ID
        employee_id = f"EMP{uuid.uuid4().hex[:6].upper()}"
        self.stdout.write(f"Generated Employee ID: {employee_id}")
        
        email = self.get_email('Email Address: ')
        mobile = self.get_mobile('Mobile Number: ')
        address = self.get_input('Address: ')
        
        # Get password securely
        while True:
            password = getpass.getpass('Password: ')
            if len(password) < 6:
                self.stdout.write(self.style.ERROR('Password must be at least 6 characters long'))
                continue
                
            confirm_password = getpass.getpass('Confirm Password: ')
            if password != confirm_password:
                self.stdout.write(self.style.ERROR('Passwords do not match'))
                continue
            break
        
        # Create the employee
        try:
            employee = Employee.objects.create(
                employee_id=employee_id,
                name=name,
                email=email,
                mobile_number=mobile,
                address=address
            )
            
            # Set password (this will be hashed through the model's save method)
            employee.password = password
            employee.save()
            
            self.stdout.write(self.style.SUCCESS('Employee created successfully!'))
            self.stdout.write('=' * 40)
            self.stdout.write(self.style.SUCCESS('LOGIN CREDENTIALS'))
            self.stdout.write(f'Employee ID: {employee_id}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write('=' * 40)
            self.stdout.write(self.style.SUCCESS('Use these credentials to log into the dashboard.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating employee: {str(e)}'))
    
    def get_input(self, prompt, required=True):
        while True:
            value = input(prompt)
            if required and not value.strip():
                self.stdout.write(self.style.ERROR('This field is required'))
                continue
            return value
    
    def get_email(self, prompt):
        while True:
            email = self.get_input(prompt)
            try:
                validate_email(email)
                # Check if email already exists
                if Employee.objects.filter(email=email).exists():
                    self.stdout.write(self.style.ERROR('This email is already in use'))
                    continue
                return email
            except ValidationError:
                self.stdout.write(self.style.ERROR('Please enter a valid email address'))
    
    def get_mobile(self, prompt):
        while True:
            mobile = self.get_input(prompt)
            if not mobile.isdigit() or len(mobile) < 10:
                self.stdout.write(self.style.ERROR('Please enter a valid mobile number'))
                continue
                
            # Check if mobile already exists
            if Employee.objects.filter(mobile_number=mobile).exists():
                self.stdout.write(self.style.ERROR('This mobile number is already in use'))
                continue
                
            return mobile
