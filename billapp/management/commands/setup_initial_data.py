from django.core.management.base import BaseCommand
from billapp.models import CustomizationCategory, CustomizationOption

class Command(BaseCommand):
    help = 'Sets up initial customization categories and options'

    def handle(self, *args, **kwargs):
        # Create Pizza customization categories
        pizza_base = CustomizationCategory.objects.create(name='Pizza Base')
        toppings = CustomizationCategory.objects.create(name='Toppings')
        cheese = CustomizationCategory.objects.create(name='Extra Cheese')
        sauces = CustomizationCategory.objects.create(name='Sauces')
        
        # Create options for Pizza Base
        CustomizationOption.objects.create(
            category=pizza_base,
            name='Thin Crust',
            price=30.00
        )
        CustomizationOption.objects.create(
            category=pizza_base,
            name='Thick Crust',
            price=40.00
        )
        
        # Create options for Toppings
        toppings_options = [
            ('Mushrooms', 50.00),
            ('Pepperoni', 60.00),
            ('Onions', 30.00),
            ('Bell Peppers', 40.00),
        ]
        for name, price in toppings_options:
            CustomizationOption.objects.create(
                category=toppings,
                name=name,
                price=price
            )
        
        # Create options for Extra Cheese
        CustomizationOption.objects.create(
            category=cheese,
            name='Mozzarella',
            price=80.00
        )
        
        # Create options for Sauces
        sauce_options = [
            ('Marinara', 20.00),
            ('BBQ', 25.00),
            ('Pesto', 30.00),
        ]
        for name, price in sauce_options:
            CustomizationOption.objects.create(
                category=sauces,
                name=name,
                price=price
            )

        self.stdout.write(self.style.SUCCESS('Successfully created initial customization data'))
