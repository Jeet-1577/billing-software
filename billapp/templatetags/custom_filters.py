from django import template

register = template.Library()

@register.filter(name='split')
def split(value, key):
    """
    Returns a list of strings, that are split by key.
    Example: {{ "a,b,c"|split:"," }} returns ['a', 'b', 'c']
    """
    return value.split(key)

@register.filter(name='multiply')
def multiply(value, arg):
    """Multiplies the arg and value after converting them to float"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return ''
