from django.contrib import admin
from .models import Category, Item, Order, CustomizationOption, CustomizationCategory, OrderItem

class CustomizationOptionInline(admin.TabularInline):
    model = CustomizationOption
    extra = 1

class CustomizationCategoryAdmin(admin.ModelAdmin):
    inlines = [CustomizationOptionInline]
    list_display = ('name',)
    search_fields = ('name',)

class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'has_customization', 'short_code')  # Add short_code here
    list_filter = ('category', 'has_customization')
    filter_horizontal = ('customization_options',)
    search_fields = ('name', 'short_code')  # Add short_code here

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
    exclude = ('items',)  # Hide the many-to-many field
    
    def order_items_display(self, obj):
        items = []
        for item in obj.items.all():
            customizations = ", ".join([c.get('name', '') for c in item.customizations]) if item.customizations else ''
            items.append(f"{item.name} ({customizations}) × {item.quantity}" if customizations else f"{item.name} × {item.quantity}")
        return "\n".join(items)
    
    order_items_display.short_description = "Order Items"

    def has_add_permission(self, request):
        return False  # Prevent adding orders directly from admin

admin.site.register(Category)
admin.site.register(CustomizationCategory, CustomizationCategoryAdmin)
admin.site.register(CustomizationOption)
admin.site.register(Item, ItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)
