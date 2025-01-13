from django.shortcuts import render, redirect, get_object_or_404
from .models import Category, Item, Order, Table, TableOrder, Employee, OrderItem  # Ensure Employee, OrderItem, and Note are imported
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
            data = json.loads(request.body)
            print("Received order data:", data)  # Debug print

            # Validate required fields
            required_keys = {"orderId", "items", "paymentType", "totalAmount", "gstAmount", "grandTotal", "orderType"}
            missing_keys = required_keys - set(data.keys())
            if missing_keys:
                return JsonResponse({
                    'status': 'failed',
                    'error': f'Missing required fields: {missing_keys}'
                }, status=400)

            # Create order with validated data
            order = Order.objects.create(
                order_id=data['orderId'],
                subtotal=Decimal(str(data.get('totalAmount', '0'))),
                gst_amount=Decimal(str(data.get('gstAmount', '0'))),
                grand_total=Decimal(str(data.get('grandTotal', '0'))),
                payment_type=data.get('paymentType', 'N/A'),
                order_type=data.get('orderType', 'N/A'),
                order_details=data.get('items', [])
            )

            # Create order items
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
                        'total_price': str(item.total_price),
                        'note': item.note.content if hasattr(item, 'note') else ''
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
                    'customizations': item.customizations,
                    'note': item.note.content if hasattr(item, 'note') else ''
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
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
def save_note(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        item_id = data.get('itemId')
        note_content = data.get('note', '').strip()
        
        try:
            order_item = OrderItem.objects.get(id=item_id)
            note, created = Note.objects.get_or_create(order_item=order_item)
            note.content = note_content
            note.save()
            return JsonResponse({'status': 'success'})
        except OrderItem.DoesNotExist:
            return JsonResponse({'status': 'error', 'error': 'OrderItem not found.'})
    return JsonResponse({'status': 'error', 'error': 'Invalid request method.'})

@csrf_exempt
@transaction.atomic
def send_order(request):
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
                order_details=data.get('items', []),
                status='sent'  # Mark order as sent
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

            print("Final order sent:", order.order_id, "with items:", order.items.count())

            return JsonResponse({
                'status': 'success',
                'order_id': order.order_id,
                'items_count': order.items.count()
            })

        except json.JSONDecodeError:
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            import traceback
            print("Error sending order:", str(e))
            print(traceback.format_exc())
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

def ko(request):
    # Only show orders with status="sent"
    orders = Order.objects.filter(status="sent").order_by('-created_at')
    return render(request, 'ko.html', {'orders': orders})

def inventory(request):
    categories = Category.objects.all()
    items = Item.objects.all()  # Fetch all inventory items
    context = {
        'categories': categories,
        'items': items,
    }
    return render(request, 'inventory.html', context)
