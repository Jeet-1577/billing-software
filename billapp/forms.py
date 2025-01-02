from django import forms
from .models import Category, Item

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']

class ItemForm(forms.ModelForm):
    short_code = forms.CharField(max_length=100, required=False, label='Short Code')

    class Meta:
        model = Item
        fields = ['name', 'category', 'price', 'image', 'short_code']
