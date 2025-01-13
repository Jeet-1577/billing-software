from django.db import models
from decimal import Decimal
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        app_label = 'billapp'

    def __str__(self):
        return self.name

class CustomizationCategory(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Customization Categories"
    
    def __str__(self):
        return self.name

class CustomizationOption(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    category = models.ForeignKey(CustomizationCategory, on_delete=models.CASCADE, related_name='options')
    created_at = models.DateTimeField(auto_now_add=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': str(self.price),
            'category': self.category.name
        }

    def __str__(self):
        return f"{self.name} (+₹{self.price})"

class Item(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='items/', blank=True, null=True)
    has_customization = models.BooleanField(default=False)
    customization_options = models.ManyToManyField(CustomizationOption, blank=True)
    short_code = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class OrderItem(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    customization_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.IntegerField()
    customizations = models.JSONField(default=list)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    item_details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Ensure customizations is a list
        if not isinstance(self.customizations, list):
            self.customizations = []
        
        # Calculate total price
        if not self.total_price:
            customization_price = sum(
                Decimal(str(c.get('price', '0'))) 
                for c in self.customizations
            )
            self.total_price = (self.price + customization_price) * self.quantity
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} x{self.quantity}"

class Note(models.Model):
    content = models.TextField()
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE, related_name='note')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note for {self.order_item.name}"

class Employee(models.Model):
    employee_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    # Add other relevant fields

    def __str__(self):
        return f"{self.name} ({self.employee_id})"

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('deleted', 'Deleted'),  # Ensure 'deleted' status is included
    ]

    order_id = models.CharField(max_length=100, unique=True)
    order_details = models.JSONField(default=dict)
    items = models.ManyToManyField(OrderItem)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    order_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    deletion_reason = models.TextField(null=True, blank=True)  # New field for deletion reason
    deleted_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True)
    time = models.TimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_id} - ₹{self.grand_total}"

class Table(models.Model):
    number = models.IntegerField(unique=True)
    orders = models.ManyToManyField(Order, blank=True)
    place = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    size = models.IntegerField(default=4)  # Number of seats
    is_booked = models.BooleanField(default=False)
    booking_time = models.DateTimeField(null=True, blank=True)

    def book_table(self):
        self.is_booked = True
        self.booking_time = timezone.now()
        self.save()

    def release_table(self):
        self.is_booked = False
        self.booking_time = None
        self.save()

    def __str__(self):
        return f"Table {self.number} ({self.place})"

class TableOrder(models.Model):
    table = models.OneToOneField(Table, on_delete=models.CASCADE, related_name='table_order')
    orders = models.ManyToManyField(Order, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TableOrder for Table {self.table.number}"
