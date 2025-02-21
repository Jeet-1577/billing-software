from django.db import models
from decimal import Decimal
from django.utils import timezone
import uuid  # Add this import
from django.contrib.auth.hashers import make_password, check_password

def generate_unique_aadhar():
    return uuid.uuid4().hex[:12]

def generate_order_id():
    return uuid.uuid4().hex  # Generates a unique 32-character hexadecimal string

def generate_table_order_id():
    return f"TO-{uuid.uuid4().hex[:8].upper()}"

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

class Employee(models.Model):
    employee_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    mobile_number = models.CharField(max_length=15, unique=True, default='0000000000')  # Provide a default value
    address = models.TextField(default='')  # Provide a default value
    aadhar = models.CharField(max_length=12, unique=True, default=generate_unique_aadhar)  # Provide a unique default value
    password = models.CharField(max_length=128)  # Password field

    def save(self, *args, **kwargs):
        if not self.aadhar:
            self.aadhar = generate_unique_aadhar()
        if self.password and not self.password.startswith('pbkdf2_'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

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
    # is_temporary = models.BooleanField(default=False)  # **Added field**
    time = models.TimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order_id} - ₹{self.grand_total}"

class Table(models.Model):
    number = models.IntegerField(unique=True)
    orders = models.ManyToManyField(Order, blank=True)
    place = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_booked = models.BooleanField(default=False)  # Add this field with a default value
    created_at = models.DateTimeField(auto_now_add=True)
    size = models.IntegerField(default=4)  # Number of seats

    def has_active_orders(self):
        """Check if table has any active orders"""
        return TableOrder.objects.filter(
            table=self,
            status='active'
        ).exists()

    def update_booking_status(self):
        """Update table booking status based on active orders"""
        self.is_booked = self.has_active_orders()
        self.save(update_fields=['is_booked'])
        return self.is_booked

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update booking status when saving if not explicitly updating is_booked
        if 'update_fields' not in kwargs or 'is_booked' not in kwargs.get('update_fields', []):
            self.update_booking_status()

    def __str__(self):
        return f"Table {self.number} ({self.place})"

class TableOrder(models.Model):
    table_order_id = models.CharField(max_length=100, unique=True, default=generate_table_order_id)
    table_number = models.IntegerField(default=1)
    items = models.JSONField(default=list)
    customizations = models.JSONField(default=list)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_type = models.CharField(max_length=50, default='CASH')
    order_type = models.CharField(max_length=50, default='DINE_IN')
    status = models.CharField(max_length=20, default='active')  # Corrected keyword argument
    table = models.ForeignKey('Table', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    saved_time = models.DateTimeField(null=True, blank=True)  # Add this line

    def save(self, *args, **kwargs):
        if not self.saved_time:
            self.saved_time = timezone.now()  # Set the saved time when the order is created
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Table Order {self.table_order_id} - Table {self.table_number}"

    def calculate_totals(self):
        self.subtotal = sum(item.get('total_price', 0) for item in self.items)
        self.gst_amount = self.subtotal * Decimal('0.18')
        self.grand_total = self.subtotal + self.gst_amount
        self.save()

class KoOrder(models.Model):
    order_id = models.CharField(max_length=100, unique=True)
    order_details = models.JSONField(default=dict)
    items = models.ManyToManyField(OrderItem)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    order_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='sent')
    table_number = models.CharField(max_length=10, null=True, blank=True)  # Add table number field
    time = models.TimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"KoOrder {self.order_id} - ₹{self.grand_total}"

class Owner(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='owners/', blank=True, null=True)
    role = models.CharField(max_length=50, default='owner')
    status = models.CharField(max_length=20, default='active')
    address = models.TextField(blank=True, null=True)
    joined_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Hotel(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    logo = models.ImageField(upload_to='hotel_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
