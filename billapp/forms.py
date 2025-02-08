from django import forms
from .models import Category, Item, Employee

# Keep only essential forms
class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']

class ItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['name', 'category', 'price', 'image']

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ('employee_id', 'name', 'email', 'mobile_number', 'address', 'aadhar')
