from django import template
from decimal import Decimal

register = template.Library()

@register.filter(name='as_percentage_of')
def as_percentage_of(value, max_value):
    try:
        if isinstance(value, Decimal):
            value = float(value)
        if isinstance(max_value, Decimal):
            max_value = float(max_value)
        return (value / max_value * 100) if max_value else 0
    except (ValueError, ZeroDivisionError, TypeError):
        return 0
