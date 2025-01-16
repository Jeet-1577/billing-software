from django.shortcuts import render, redirect, get_object_or_404
from .models import Category, Item, Order, Table, TableOrder, Employee, OrderItem, KoOrder  # Ensure Employee, OrderItem, and KoOrder are imported
from .forms import CategoryForm, ItemForm
from django.http import JsonResponse
import json
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from decimal import Decimal
from django.db import transaction
from django.db import models  # Ensure this import is present
from django.template import loader
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count


def index(request):
    today = timezone.now().date()
    today_revenue = Order.objects.filter(date=today).aggregate(Sum('grand_total'))['grand_total__sum'] or 0
    today_orders_count = Order.objects.filter(date=today).count()
    today_orders = Order.objects.filter(date=today)

    context = {
        'today_revenue': today_revenue,
        'today_orders_count': today_orders_count,
        'today_orders': today_orders,
    }
    return render(request, 'home.html', context)

def profile(request):
    return render(request, 'profile.html')

# Add more views as needed
def settings(request):
    return render(request, 'settings.html')

def inventory(request):
    categories = Category.objects.all()
    selected_category_id = request.GET.get('category')
    search_query = request.GET.get('search')
    
    try:
        if search_query:
            items = Item.objects.filter(
                models.Q(name__icontains=search_query) | 
                models.Q(short_code__icontains=search_query)
            ).order_by('name')
        elif selected_category_id:
            items = Item.objects.filter(category_id=selected_category_id)
        else:
            items = Item.objects.all()
        
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
    except Exception as e:
        import traceback
        print("Error in inventory view:", str(e))
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)

def portfolio(request):
    return render(request, 'portfolio.html')

def about_us(request):
    return render(request, 'about.html')

def contact_us(request):
    return render(request, 'contact.html')

def Privacy_Policy(request):
    return render(request, 'Privacy_Policy.html')


def Refund(request):
    return render(request, 'Refund.html')


def Terms_Conditions(request):
    return render(request, 'Terms_Conditions.html')

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

def table_view(request):
    try:
        # Attempt to load the template manually
        template = loader.get_template('tabel.html')
        print(f"Template loaded successfully.")
    except Exception as e:
        print(f"Error loading template: {str(e)}")
        # If there is an error, return an error response
        return render(request, 'error.html', {'error_message': 'Failed to load the template.'})

    # Fetch all tables from the database
    table_numbers = Table.objects.all()  # Fetches all tables from the database

    # Pass the table numbers to the template
    return render(request, 'tabel.html', {'table_numbers': table_numbers})



@csrf_exempt
@transaction.atomic
def place_order(request):
    if request.method == 'POST':
        try:
            print("Raw request body:", request.body)  # Debug raw request body
            data = json.loads(request.body)
            print("Received order data:", data)  # Debug parsed data

            # Validate required fields
            required_keys = {"orderId", "items", "paymentType", "totalAmount", "gstAmount", "grandTotal", "orderType"}
            missing_keys = required_keys - set(data.keys())
            if missing_keys:
                return JsonResponse({
                    'status': 'failed',
                    'error': f'Missing required fields: {missing_keys}'
                }, status=400)

            # Validate items
            for item in data.get('items', []):
                if not isinstance(item, dict):
                    return JsonResponse({
                        'status': 'failed',
                        'error': f"Each item must be a dictionary, got: {item}"
                    }, status=400)
                print("Processing item:", item)  # Debug each item

            # Create order
            order = Order.objects.create(
                order_id=data['orderId'],
                subtotal=Decimal(str(data.get('totalAmount', '0'))),
                gst_amount=Decimal(str(data.get('gstAmount', '0'))),
                grand_total=Decimal(str(data.get('grandTotal', '0'))),
                payment_type=data.get('paymentType', 'N/A'),
                order_type=data.get('orderType', 'N/A'),
                order_details=data.get('items', [])
            )

            # Add items to order
            for item_data in data.get('items', []):
                try:
                    order_item = OrderItem.objects.create(
                        name=item_data.get('name', ''),
                        price=Decimal(str(item_data.get('price', '0'))),
                        quantity=int(item_data.get('quantity', 0)),
                        customizations=item_data.get('customizations', []),
                        total_price=Decimal(str(item_data.get('totalPrice', '0'))),
                        base_price=Decimal(str(item_data.get('price', '0'))),
                        customization_price=Decimal(str(item_data.get('customizationPrice', '0'))),
                        item_details=item_data
                    )
                    order.items.add(order_item)  # Add order item to order
                except Exception as e:
                    print(f"Error processing item {item_data}: {e}")
                    raise

            order.save()
            print("Final order saved:", order.order_id, "with items:", order.items.count())

            return JsonResponse({
                'status': 'success',
                'order_id': order.order_id,
                'items_count': order.items.count()
            })

        except json.JSONDecodeError:
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            import traceback
            print("Error saving order:", str(e))
            print(traceback.format_exc())
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

@csrf_exempt
@transaction.atomic
def save_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received order data:", data)

            if not data.get('items'):
                return JsonResponse({
                    'status': 'failed',
                    'error': 'No items in order'
                }, status=400)

            table_number = data['tableId'].replace('table-', '')
            table, _ = Table.objects.get_or_create(number=table_number)

            # Create order with non-zero values
            order = Order.objects.create(
                order_id=data['orderId'],
                subtotal=Decimal(str(data.get('totalAmount', '0'))),
                gst_amount=Decimal(str(data.get('gstAmount', '0'))),
                grand_total=Decimal(str(data.get('grandTotal', '0'))),
                payment_type=data.get('paymentType', 'N/A'),
                order_type=data.get('orderType', 'N/A'),
                order_details=data.get('items', [])
            )

            # Create order items with proper validation
            for item_data in data.get('items', []):
                if not isinstance(item_data, dict):
                    continue
                    
                order_item = OrderItem.objects.create(
                    name=item_data.get('name', ''),
                    price=Decimal(str(item_data.get('price', '0'))),
                    quantity=int(item_data.get('quantity', 0)),
                    customizations=item_data.get('customizations', []),
                    total_price=Decimal(str(item_data.get('totalPrice', '0'))),
                    base_price=Decimal(str(item_data.get('price', '0'))),
                    customization_price=Decimal(str(item_data.get('customizationPrice', '0'))),
                    item_details=item_data
                )
                order.items.add(order_item)

            # Link order to table
            table_order, _ = TableOrder.objects.get_or_create(table=table)
            table_order.orders.add(order)

            print("Final order saved:", order.order_id, "with items:", order.items.count())

            return JsonResponse({
                'status': 'success',
                'order_id': order.order_id,
                'items_count': order.items.count()
            })

        except json.JSONDecodeError:
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            import traceback
            print("Error saving order:", str(e))
            print(traceback.format_exc())
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def release_table(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            table_number = data['tableId'].replace('table-', '')
            table = Table.objects.get(number=table_number)
            table.orders.clear()
            table.save()
            return JsonResponse({'status': 'success'})
        except Table.DoesNotExist:
            return JsonResponse({'status': 'failed', 'error': 'Table not found'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)
    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

def view_table_orders(request, table_number):
    try:
        table = Table.objects.get(number=table_number)
        orders = table.orders.all()
        orders_data = []
        for order in orders:
            orders_data.append({
                'order_id': order.order_id,
                'subtotal': str(order.subtotal),
                'gst_amount': str(order.gst_amount),
                'grand_total': str(order.grand_total),
                'items': [
                    {
                        'name': item.name,
                        'price': str(item.price),
                        'quantity': item.quantity,
                        'customizations': item.customizations,
                        'total_price': str(item.total_price)
                    }
                    for item in order.items.all()
                ]
            })
        return JsonResponse({'status': 'success', 'orders': orders_data})
    except Table.DoesNotExist:
        return JsonResponse({'status': 'failed', 'error': 'Table not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@require_POST
def book_table(request, table_id):
    try:
        table = Table.objects.get(id=table_id)
        if not table.is_booked:
            table.book_table()
            # Set timer duration based on table size (e.g., 30 minutes per 4 seats)
            timer_duration = timedelta(minutes=30 * (table.size // 4))
            booking_end_time = timezone.now() + timer_duration
            return JsonResponse({'status': 'success', 'booking_end_time': booking_end_time.isoformat()})
        else:
            return JsonResponse({'status': 'error', 'message': 'Table is already booked.'})
    except Table.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Table does not exist.'})

@require_POST
def release_table(request, table_id):
    try:
        table = Table.objects.get(id=table_id)
        if table.is_booked:
            table.release_table()
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Table is not booked.'})
    except Table.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Table does not exist.'})

def get_table_status(request):
    tables = Table.objects.all().values('id', 'size', 'is_booked', 'booking_time')
    return JsonResponse(list(tables), safe=False)

def order_data(request):
    status_filter = request.GET.get('status', '')
    orders = Order.objects.all().order_by('-created_at')  # Order by creation date in descending order

    if status_filter:
        orders = orders.filter(status=status_filter)

    employees = Employee.objects.all()  # Fetch all employees

    return render(request, 'order_data.html', {'orders': orders, 'employees': employees})

def order_details(request, order_id):
    try:
        order = get_object_or_404(Order, order_id=order_id)
        order_items = order.items.all()
        order_data = {
            'order_id': order.order_id,
            'date': order.date,
            'time': order.time,
            'payment_type': order.payment_type,
            'order_type': order.order_type,
            'status': order.status,
            'subtotal': order.subtotal,
            'gst_amount': order.gst_amount,
            'grand_total': order.grand_total,
            'items': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'total_price': item.total_price,
                    'customizations': item.customizations
                }
                for item in order_items
            ]
        }
        return JsonResponse({'status': 'success', 'order': order_data})
    except Order.DoesNotExist:
        return JsonResponse({'status': 'failed', 'error': 'Order not found'}, status=404)

@csrf_exempt
@require_POST
def delete_order(request, order_id):
    try:
        data = json.loads(request.body)
        reason = data.get('reason', '')
        order = get_object_or_404(Order, order_id=order_id)
        order.status = 'deleted'
        order.deletion_reason = reason
        order.save()
        return JsonResponse({'status': 'success'})
    except Order.DoesNotExist:
        return JsonResponse({'status': 'failed', 'error': 'Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verify_password(request):
    try:
        data = json.loads(request.body)
        password = data.get('password', '')
        user = authenticate(username=request.user.username, password=password)
        if user is not None:
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'failed'}, status=400)
    except Exception as e:
        password = data.get('password', '')
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

        user = authenticate(username=request.user.username, password=password)
        if user is not None:
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'failed'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
def save_note(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('itemId')
            note = data.get('note')
            order_item = get_object_or_404(OrderItem, id=item_id)
            order_item.note = note
            order_item.save()
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'error': str(e)})
    return JsonResponse({'status': 'error', 'error': 'Invalid request method'})

@csrf_exempt
@transaction.atomic
def send_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received order data:", data)

            # Validate required fields
            required_keys = {"orderId", "items", "totalAmount", "gstAmount", "grandTotal"}
            missing_keys = required_keys - set(data.keys())
            if missing_keys:
                print(f"Missing required fields: {missing_keys}")
                return JsonResponse({
                    'status': 'failed',
                    'error': f'Missing required fields: {missing_keys}'
                }, status=400)

            # Validate items
            for item in data.get('items', []):
                if not isinstance(item, dict):
                    print(f"Invalid item format: {item}")
                    return JsonResponse({
                        'status': 'failed',
                        'error': f"Each item must be a dictionary, got: {item}"
                    }, status=400)
                print("Processing item:", item)

            # Create KoOrder
            ko_order = KoOrder.objects.create(
                order_id=data['orderId'],
                subtotal=Decimal(str(data.get('totalAmount', '0'))),
                gst_amount=Decimal(str(data.get('gstAmount', '0'))),
                grand_total=Decimal(str(data.get('grandTotal', '0'))),
                payment_type=data.get('paymentType', 'N/A'),  # Default value if not provided
                order_type=data.get('orderType', 'N/A'),      # Default value if not provided
                order_details=data.get('items', [])
            )

            # Add items to KoOrder
            for item_data in data.get('items', []):
                try:
                    order_item = OrderItem.objects.create(
                        name=item_data.get('name', ''),
                        price=Decimal(str(item_data.get('price', '0'))),
                        quantity=int(item_data.get('quantity', 0)),
                        customizations=item_data.get('customizations', []),
                        total_price=Decimal(str(item_data.get('totalPrice', '0'))),
                        base_price=Decimal(str(item_data.get('price', '0'))),
                        customization_price=Decimal(str(item_data.get('customizationPrice', '0'))),
                        item_details=item_data
                    )
                    ko_order.items.add(order_item)
                except Exception as e:
                    print(f"Error processing item {item_data}: {e}")
                    raise

            ko_order.save()
            print("Final KoOrder saved:", ko_order.order_id, "with items:", ko_order.items.count())

            return JsonResponse({
                'status': 'success',
                'order_id': ko_order.order_id,
                'items_count': ko_order.items.count()
            })

        except json.JSONDecodeError:
            print("Invalid JSON data")
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            import traceback
            print("Error saving KoOrder:", str(e))
            print(traceback.format_exc())
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def ko_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Process the order data as needed
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)
    
    # Fetch orders with status 'sent' from KoOrder
    orders = KoOrder.objects.filter(status='sent')
    return render(request, 'ko.html', {'orders': orders})
