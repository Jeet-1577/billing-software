from django import forms
from .models import Category, Item, Employee, Owner, Hotel

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']

class ItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['name', 'category', 'price', 'image', 'has_customization', 'short_code', 'cgst', 'sgst']

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ['employee_id', 'name', 'email', 'mobile_number', 'address', 'aadhar', 'password']

class OwnerForm(forms.ModelForm):
    class Meta:
        model = Owner
        fields = ['owner_id', 'name', 'email', 'phone', 'photo', 'password']
        widgets = {
            'password': forms.PasswordInput(attrs={'class': 'form-input'})
        }

class HotelForm(forms.ModelForm):
    class Meta:
        model = Hotel
        fields = ['name', 'address', 'email', 'phone', 'gstin', 'logo']
