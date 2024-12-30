from django.shortcuts import render, redirect
from .models import Category, Item, Order
from .forms import CategoryForm, ItemForm
from django.http import JsonResponse
import json
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt

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
        items_data = [{'id': item.id, 'name': item.name, 'price': str(item.price), 'image': item.image.url} for item in items]
        return JsonResponse({'categories': list(categories.values()), 'items': items_data, 'selected_category_id': selected_category_id})
    
    return render(request, 'inventory.html', {'categories': categories, 'items': items, 'selected_category_id': selected_category_id})

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
def place_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order = Order(
                order_id=data['orderId'],
                items=data['items'],
                total_amount=data['totalAmount'],
                gst_amount=data['gstAmount'],
                grand_total=data['grandTotal'],
                payment_type=data['paymentType'],
                order_type=data['orderType'],
                time=datetime.strptime(data['time'], '%I:%M:%S %p').time(),  # Adjusted time format
                date=datetime.strptime(data['date'], '%Y-%m-%d').date()
            )
            order.save()
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'failed', 'error': str(e)})
    return JsonResponse({'status': 'failed'})

@csrf_exempt
def check_payment_status(request):
    transaction_id = request.GET.get('transaction_id')
    
    # Import required UPI payment verification library
    from python_upi_qr import UPIPaymentStatus  # You'll need to install this package
    
    try:
        # Initialize UPI verification with your merchant credentials
        verifier = UPIPaymentStatus(
            merchant_id="your_merchant_id",
            api_key="your_api_key"
        )
        
        # Check actual payment status
        status = verifier.check_payment(transaction_id)
        
        return JsonResponse({
            'status': 'success' if status.is_paid else 'pending',
            'transaction_id': transaction_id
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })
