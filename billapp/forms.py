from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, ReadOnlyPasswordHashField  # Correct import
from .models import Category, Item, Employee

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']

class ItemForm(forms.ModelForm):
    short_code = forms.CharField(max_length=100, required=False, label='Short Code')

    class Meta:
        model = Item
        fields = ['name', 'category', 'price', 'image', 'short_code']

class EmployeeCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)

    class Meta:
        model = Employee
        fields = ('employee_id', 'name', 'email', 'mobile_number', 'address', 'aadhar')

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        employee = super().save(commit=False)
        user = User.objects.create_user(
            username=self.cleaned_data['email'],
            email=self.cleaned_data['email'],
            password=self.cleaned_data['password1']
        )
        employee.user = user
        if commit:
            employee.save()
        return employee

class EmployeeChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = Employee
        fields = ('employee_id', 'name', 'email', 'mobile_number', 'address', 'aadhar', 'password', 'user')

    def clean_password(self):
        # Return the initial value of the password field if it exists
        return self.initial.get("password", self.instance.user.password)
