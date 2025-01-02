from django.db import models
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class CustomizationCategory(models.Model):
    name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name_plural = "Customization Categories"
    
    def __str__(self):
        return self.name

class CustomizationOption(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    category = models.ForeignKey(CustomizationCategory, on_delete=models.CASCADE, related_name='options')

    def __str__(self):
        return f"{self.name} (+₹{self.price})"

class Item(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='items/', blank=True, null=True)
    has_customization = models.BooleanField(default=False)
    customization_options = models.ManyToManyField(CustomizationOption, blank=True)
    short_code = models.CharField(max_length=100, blank=True, null=True)  # Add this line

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
    item_details = models.JSONField(default=dict)  # Store complete item details

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} x{self.quantity}"

class Order(models.Model):
    order_id = models.CharField(max_length=100, unique=True)
    order_details = models.JSONField(default=dict)  # Moved column for order details
    items = models.ManyToManyField(OrderItem)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    order_type = models.CharField(max_length=50)
    time = models.TimeField(auto_now_add=True)
    date = models.DateField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if isinstance(self.subtotal, str):
            self.subtotal = Decimal(self.subtotal)
        if isinstance(self.gst_amount, str):
            self.gst_amount = Decimal(self.gst_amount)
        if isinstance(self.grand_total, str):
            self.grand_total = Decimal(self.grand_total)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_id} - ₹{self.grand_total}"
