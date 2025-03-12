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
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Add this line
    image = models.ImageField(upload_to='items/', blank=True, null=True)
    has_customization = models.BooleanField(default=False)
    customization_options = models.ManyToManyField(CustomizationOption, blank=True)
    short_code = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cgst = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # New field
    sgst = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # New field

    def get_image_url(self):
        """Safely get the image URL, return a default image if no image exists"""
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        return '/static/images/default-item.png'  # Return default image path

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
    making_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Add this line

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
        
        if not self.making_cost and hasattr(self, 'item_details'):
            # Try to get making cost from item details
            self.making_cost = Decimal(str(self.item_details.get('cost', '0')))
        
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
    is_booked = models.BooleanField(default=False)  # Fixed syntax error
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
    items = models.ManyToManyField('OrderItem', related_name='ko_orders')
    order_details = models.JSONField(default=dict)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    order_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='sent')  # Changed maxlength to max_length
    created_at = models.DateTimeField(auto_now_add=True)
    table_number = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"KoOrder {self.order_id} - ₹{self.grand_total}"

class Owner(models.Model):
    owner_id = models.CharField(max_length=100, unique=True, null=True, blank=True)  # Make nullable temporarily
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    photo = models.ImageField(upload_to='owner_photos/', null=True, blank=True)
    password = models.CharField(max_length=255, default='default123')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.owner_id:
            # Get the highest existing owner_id
            last_owner = Owner.objects.filter(
                owner_id__startswith='OWN'
            ).order_by('-owner_id').first()

            if last_owner and last_owner.owner_id:
                try:
                    # Extract number and increment
                    last_num = int(last_owner.owner_id[3:])
                    self.owner_id = f'OWN{str(last_num + 1).zfill(3)}'
                except (ValueError, IndexError):
                    # If there's an error parsing the last owner_id, start fresh
                    self.owner_id = 'OWN001'
            else:
                # If no existing owner_id found, start with OWN001
                self.owner_id = 'OWN001'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.owner_id})"

class Hotel(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    logo = models.ImageField(upload_to='hotel_logos/', blank=True, null=True)
    language = models.CharField(max_length=10, default='en')
    currency = models.CharField(max_length=10, default='INR')
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    email_notifications = models.BooleanField(default=True)
    two_factor_auth = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Hotel Profile'
        verbose_name_plural = 'Hotel Profile'

class LoginActivity(models.Model):
    user = models.ForeignKey('Employee', on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    device_info = models.CharField(max_length=255)
    login_time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('logout', 'Logout')
    ])

    class Meta:
        ordering = ['-login_time']
        verbose_name_plural = 'Login Activities'

    def __str__(self):
        return f"{self.user} - {self.ip_address} - {self.login_time}"

class ConnectedDevice(models.Model):
    user = models.ForeignKey('Employee', on_delete=models.CASCADE)
    device_name = models.CharField(max_length=255)
    device_id = models.CharField(max_length=255, unique=True)
    last_active = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} - {self.device_name}"

class Feedback(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    table_number = models.CharField(max_length=10)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback from {self.name} - Table {self.table_number}"

class ItemRating(models.Model):
    feedback = models.ForeignKey('Feedback', on_delete=models.CASCADE, related_name='item_ratings')
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('feedback', 'item')

    def __str__(self):
        return f"{self.item.name} - {self.rating} stars"
