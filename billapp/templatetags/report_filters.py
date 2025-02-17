from django import template
from decimal import Decimal, ROUND_HALF_UP

register = template.Library()

@register.filter(name='divide')
def divide(value, arg):
    """
    Divides the value by the argument
    """
    try:
        value = Decimal(str(value))
        arg = Decimal(str(arg))
        if arg == 0:
            return Decimal('0')
        return (value / arg).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except (ValueError, TypeError, decimal.InvalidOperation):
        return Decimal('0')
