from django.contrib import admin
from .models import Category, Item, Order

class ItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'image')

class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'total_amount', 'gst_amount', 'grand_total', 'payment_type', 'order_type', 'time', 'date')

admin.site.register(Category)
admin.site.register(Item, ItemAdmin)
admin.site.register(Order, OrderAdmin)
