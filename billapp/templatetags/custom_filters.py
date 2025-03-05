from django import template

register = template.Library()

@register.filter(name='split')
def split(value, key):
    """
    Returns a list of strings, that are split by key.
    Example: {{ "a,b,c"|split:"," }} returns ['a', 'b', 'c']
    """
    return value.split(key)
