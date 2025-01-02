from django.shortcuts import render, redirect
from .models import Category, Item, Order
from .forms import CategoryForm, ItemForm
from django.http import JsonResponse
import json
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from decimal import Decimal
from django.db import transaction
from .models import Order, OrderItem

def index(request):
    return render(request, 'base.html')

def profile(request):
    return render(request, 'profile.html')

# Add more views as needed
def settings(request):
    return render(request, 'settings.html')

def inventory(request):
    categories = Category.objects.all()
    selected_category_id = request.GET.get('category')
    search_query = request.GET.get('search')
    
    if selected_category_id:
        items = Item.objects.filter(category_id=selected_category_id)
    else:
        items = Item.objects.all()
    
    if search_query:
        items = items.filter(name__icontains=search_query).order_by('name')
    
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        items_data = []
        for item in items:
            item_data = {
                'id': item.id,
                'name': item.name,
                'price': str(item.price),
                'image': item.image.url if item.image else '',
                'has_customization': item.has_customization,
                'customization_options': []
            }
            if item.has_customization:
                item_data['customization_options'] = [
                    {
                        'id': opt.id,
                        'name': opt.name,
                        'price': str(opt.price),
                        'category': opt.category.name
                    }
                    for opt in item.customization_options.all()
                ]
            items_data.append(item_data)
        
        return JsonResponse({
            'categories': list(categories.values()),
            'items': items_data,
            'selected_category_id': selected_category_id
        })
    
    return render(request, 'inventory.html', {
        'categories': categories,
        'items': items,
        'selected_category_id': selected_category_id
    })

def portfolio(request):
    return render(request, 'portfolio.html')

def about_us(request):
    return render(request, 'about.html')

def contact_us(request):
    return render(request, 'contact.html')

def customize(request):
    if request.method == 'POST':
        category_form = CategoryForm(request.POST)
        item_form = ItemForm(request.POST, request.FILES)
        if category_form.is_valid():
            category_form.save()
        if item_form.is_valid():
            item_form.save()
        return redirect('customize')
    else:
        category_form = CategoryForm()
        item_form = ItemForm()
    return render(request, 'customize.html', {'category_form': category_form, 'item_form': item_form})

def menu(request):
    return render(request, 'menu.html')

def dashboard(request):
    return render(request, 'dashboard.html')

@csrf_exempt
@transaction.atomic
def place_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received order data:", data)  # Debug print

            # Prepare order details with only necessary information
            order_details = [
                {
                    'name': item['name'],
                    'price': item['price'],
                    'customizations': item.get('customizations', []),
                    'quantity': item['quantity']
                }
                for item in data['items']
            ]

            # Create the order first
            order = Order(
                order_id=data['orderId'],
                subtotal=Decimal(str(data['totalAmount'])),
                gst_amount=Decimal(str(data['gstAmount'])),
                grand_total=Decimal(str(data['grandTotal'])),
                payment_type=data['paymentType'],
                order_type=data['orderType'],
                order_details=order_details  # Save the simplified order details
            )
            order.save()

            # Create order items with full details
            for item_data in data['items']:
                # Create OrderItem with all details
                order_item = OrderItem(
                    name=item_data['name'],
                    price=Decimal(str(item_data['price'])),
                    quantity=item_data['quantity'],
                    customizations=item_data.get('customizations', []),
                    total_price=Decimal(str(item_data['totalPrice']))  # Correct key used here
                )
                order_item.save()
                
                # Store the complete item details in the order_item
                order_item.item_details = item_data
                order_item.base_price = Decimal(str(item_data['price']))  # Assuming base_price is the same as price
                order_item.customization_price = Decimal(str(item_data.get('customizationPrice', 0)))
                order_item.save()
                
                order.items.add(order_item)

            order.save()

            return JsonResponse({
                'status': 'success',
                'order_id': order.order_id
            })
            
        except Exception as e:
            import traceback
            print("Error saving order:", str(e))
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'failed',
                'error': str(e)
            }, status=400)

    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)
