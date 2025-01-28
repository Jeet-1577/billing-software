from django.contrib import admin
from .models import Category, Item, Order, CustomizationOption, CustomizationCategory, OrderItem, Table, Employee, TableOrder
from django import forms
from django.contrib.auth.hashers import make_password

class CustomizationOptionInline(admin.TabularInline):
    model = CustomizationOption
    extra = 1

class CustomizationCategoryAdmin(admin.ModelAdmin):
    inlines = [CustomizationOptionInline]
    list_display = ('name',)
    search_fields = ('name',)

class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'has_customization', 'short_code')
    list_filter = ('category', 'has_customization')
    filter_horizontal = ('customization_options',)
    search_fields = ('name', 'short_code')

class OrderItemInline(admin.TabularInline):
    model = Order.items.through
    extra = 0
    verbose_name = "Order Item"
    verbose_name_plural = "Order Items"
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'payment_type', 'order_type', 'subtotal', 'gst_amount', 'grand_total', 'date', 'time')
    readonly_fields = ('date', 'time', 'order_items_display', 'order_details')
    exclude = ('items',)
    
    def order_items_display(self, obj):
        items = []
        for item in obj.items.all():
            customizations = ", ".join([c.get('name', '') for c in item.customizations]) if item.customizations else ''
            items.append(f"{item.name} ({customizations}) × {item.quantity}" if customizations else f"{item.name} × {item.quantity}")
        return "\n".join(items)
    
    order_items_display.short_description = "Order Items"

    def has_add_permission(self, request):
        return False

class OrderItemAdminForm(forms.ModelForm):
    customization_choices = forms.ModelMultipleChoiceField(
        required=False,
        widget=forms.CheckboxSelectMultiple,
        queryset=CustomizationOption.objects.all(),
        label="Available Customizations"
    )

    class Meta:
        model = OrderItem
        fields = ('name', 'price', 'total_price')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk and self.instance.customizations:
            selected_ids = [c.get('id') for c in self.instance.customizations if isinstance(c, dict)]
            self.fields['customization_choices'].initial = CustomizationOption.objects.filter(id__in=selected_ids)

    def save(self, commit=True):
        instance = super().save(commit=False)
        selected_options = self.cleaned_data.get('customization_choices', [])
        
        # Convert customization options to the format we want to store
        instance.customizations = [
            {
                'id': str(opt.id),
                'name': opt.name,
                'price': str(opt.price),
                'category': opt.category.name
            } for opt in selected_options
        ]
        
        # Calculate total price
        base_price = instance.price or 0
        customization_price = sum(opt.price for opt in selected_options)
        instance.total_price = base_price + customization_price
        instance.base_price = base_price
        instance.customization_price = customization_price
        
        if commit:
            instance.save()
        return instance

class OrderItemAdmin(admin.ModelAdmin):
    form = OrderItemAdminForm
    list_display = ('name', 'price', 'get_customizations', 'total_price')
    search_fields = ('name',)
    readonly_fields = ('total_price',)
    exclude = ('quantity', 'customizations', 'base_price', 'customization_price', 'item_details')

    def get_customizations(self, obj):
        if obj.customizations:
            return ", ".join([c.get('name', '') for c in obj.customizations])
        return "-"
    get_customizations.short_description = "Customizations"

    def save_model(self, request, obj, form, change):
        obj.quantity = 1  # Set default quantity
        super().save_model(request, obj, form, change)

class EmployeeAdminForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ('employee_id', 'name', 'email', 'mobile_number', 'address', 'aadhar', 'password')

    def save(self, commit=True):
        instance = super().save(commit=False)
        if instance.password and not instance.password.startswith('pbkdf2_'):
            instance.password = make_password(instance.password)
        if commit:
            instance.save()
        return instance

class EmployeeAdmin(admin.ModelAdmin):
    form = EmployeeAdminForm
    list_display = ('employee_id', 'name', 'email', 'mobile_number', 'aadhar')
    search_fields = ('employee_id', 'name', 'email', 'mobile_number', 'aadhar')
    readonly_fields = ()

    def has_change_permission(self, request, obj=None):
        return True

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ('employee_id',)
        return self.readonly_fields

admin.site.register(Employee, EmployeeAdmin)

# Admin registration using decorators
@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('number',)
    search_fields = ('number',)

@admin.register(TableOrder)
class TableOrderAdmin(admin.ModelAdmin):
    list_display = (
        'tableorder_id',  # Replace order_id with tableorder_id
        'table_number',
        'subtotal',
        'gst_amount',
        'grand_total',
        'created_at',
        'updated_at',
        'get_item_names',
        'get_item_customizations'
    )
    search_fields = ('table__number', 'orders__order_id')
    readonly_fields = ('created_at', 'updated_at')
    exclude = ('orders',)

    def table_number(self, obj):
        return obj.table.number
    table_number.short_description = 'Table Number'

    def get_item_names(self, obj):
        # Ensure item_names is a list before joining
        if isinstance(obj.item_names, list):
            return ", ".join(obj.item_names)
        return "No items"
    get_item_names.short_description = 'Item Names'

    def get_item_customizations(self, obj):
        # Ensure item_customizations is a list before iterating
        if isinstance(obj.item_customizations, list):
            return ", ".join([f"{item['name']} ({', '.join(item['customizations'])})" for item in obj.item_customizations])
        return "No customizations"
    get_item_customizations.short_description = 'Item Customizations'


# Register other models
admin.site.register(Category)
admin.site.register(CustomizationCategory, CustomizationCategoryAdmin)
admin.site.register(CustomizationOption)
admin.site.register(Item, ItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)
# admin.site.unregister(Employee)  # Remove the Employee model registration
