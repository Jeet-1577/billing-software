from django.shortcuts import render, redirect, get_object_or_404
from .models import (
    Category, 
    Item, 
    Order, 
    Table, 
    Employee, 
    OrderItem, 
    KoOrder, 
    TableOrder,
    CustomizationCategory,
    CustomizationOption
)
from .forms import CategoryForm, ItemForm, EmployeeForm  # Update this line to only import existing forms
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
from django.db.models import Sum, Avg, Value, F, IntegerField, FloatField, DecimalField, Count  # Add Count here
from django.db.models.functions import TruncDate, Coalesce, Cast, ExtractHour, TruncHour  # Add Cast and ExtractHour here
import logging
from django.contrib.auth.hashers import check_password
from django.contrib import messages
from django.conf import settings as django_settings  # Correct the import
from django.http import HttpResponse
import csv
from django.template.loader import render_to_string
import tempfile
from django.core.mail import EmailMessage
import pdfkit  # You'll need to pip install pdfkit and install wkhtmltopdf

logger = logging.getLogger(__name__)

def index(request):
    today = timezone.now().date()
    current_hour = timezone.now().hour
    
    # Get today's orders and basic stats
    today_orders = Order.objects.filter(created_at__date=today)
    today_revenue = float(today_orders.aggregate(
        total=Coalesce(Sum('grand_total'), Value(Decimal('0.00')))
    )['total'])
    today_orders_count = today_orders.count()

    # Get actual order hours from database with timezone conversion
    hourly_data = Order.objects.filter(
        created_at__date=today
    ).annotate(
        # Convert UTC time to local timezone before extracting hour
        hour=ExtractHour(
            Cast(
                F('created_at'),
                output_field=models.DateTimeField()
            ) + timedelta(hours=5, minutes=30)  # Add IST offset
        )
    ).values('hour').annotate(
        count=Count('id'),
        revenue=Sum('grand_total', default=0)
    ).order_by('hour')

    print("Debug - Raw hourly data:", list(hourly_data))  # Debug print

    # Initialize data for all 24 hours
    hours = list(range(24))
    hour_data = {hour: {'count': 0, 'revenue': 0.0} for hour in hours}

    # Fill in actual data from orders
    for entry in hourly_data:
        actual_hour = entry['hour']
        hour_data[actual_hour] = {
            'count': int(entry['count']),
            'revenue': float(entry['revenue'] or 0)
        }

    print("Debug - Processed hour_data:", hour_data)  # Debug print

    # Create arrays for chart while preserving actual hours
    hour_labels = []
    hourly_orders = []
    hourly_revenue = []

    # Format data for chart in chronological order
    for hour in range(24):
        # Format hour label (e.g., "3PM", "4PM", etc.)
        am_pm = 'AM' if hour < 12 else 'PM'
        display_hour = hour if hour < 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
            
        hour_labels.append(f'{display_hour}{am_pm}')
        hourly_orders.append(hour_data[hour]['count'])
        hourly_revenue.append(hour_data[hour]['revenue'])

    print("Debug - Chart data:")  # Debug prints
    print("Labels:", hour_labels)
    print("Orders:", hourly_orders)
    print("Revenue:", hourly_revenue)

    # Find peak and quiet hours from actual data
    active_hours = [(h, data['count']) for h, data in hour_data.items() if data['count'] > 0]
    
    if active_hours:
        peak_hour = max(active_hours, key=lambda x: x[1])
        quiet_hour = min(active_hours, key=lambda x: x[1])
        peak_hours = format_hour(peak_hour[0])
        quiet_hours = format_hour(quiet_hour[0])
        peak_orders_count = peak_hour[1]
        quiet_orders_count = quiet_hour[1]
    else:
        peak_hours = quiet_hours = "N/A"
        peak_orders_count = quiet_orders_count = 0

    context = {
        'today_revenue': today_revenue,
        'today_orders_count': today_orders_count,
        'today_orders': today_orders.order_by('-created_at')[:10],
        'avg_order_value': round(float(today_revenue) / max(today_orders_count, 1), 2),
        'active_tables': TableOrder.objects.filter(status='active').values('table').distinct().count(),
        'hour_labels': json.dumps(hour_labels),
        'hourly_orders': json.dumps(hourly_orders),
        'hourly_revenue': json.dumps(hourly_revenue),
        'peak_hours': peak_hours,
        'quiet_hours': quiet_hours,
        'peak_orders_count': peak_orders_count,
        'quiet_orders_count': quiet_orders_count,
        'current_hour': current_hour,
    }

    return render(request, 'home.html', context)

def format_hour(hour):
    """Helper function to format hours in 12-hour format"""
    am_pm = 'AM' if hour < 12 else 'PM'
    display_hour = hour if hour < 12 else hour - 12
    if (display_hour == 0):
        display_hour = 12
    return f'{display_hour}{am_pm}'

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
        template = loader.get_template('tabel.html')
        # Sort tables by number but don't reposition them after they're booked
        table_numbers = Table.objects.all().order_by('number')
        return render(request, 'tabel.html', {'table_numbers': table_numbers})
    except Exception as e:
        print(f"Error loading template: {str(e)}")
        return render(request, 'error.html', {'error_message': 'Failed to load the template.'})

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

def get_table_status(request):
    tables_data = []
    for table in Table.objects.all():
        # Check for active orders in this table
        has_active_orders = TableOrder.objects.filter(
            table=table,
            status='active'
        ).exists()
        
        tables_data.append({
            'id': table.id,
            'number': table.number,
            'size': table.size,
            'is_booked': has_active_orders,  # Set booked status based on active orders
        })
    return JsonResponse(tables_data, safe=False)

def order_data(request):
    status_filter = request.GET.get('status', '')
    orders = Order.objects.all().order_by('-created_at')  # Order by creation date in descending order

    if status_filter:
        orders = orders.filter(status=status_filter)

    employees = Employee.objects.all()  # Fetch all employees

    return render(request, 'order_data.html', {'orders': orders, 'employees': employees})

def order_details(request, pk):
    try:
        logger.debug(f"Fetching order details for pk={pk}")
        order = get_object_or_404(Order, pk=pk)
        order_items = order.items.all()
        order_data = {
            'order_id': order.order_id,
            'date': order.date.strftime('%Y-%m-%d') if hasattr(order, 'date') else 'N/A',
            'time': order.time.strftime('%H:%M:%S') if hasattr(order, 'time') else 'N/A',
            'payment_type': order.payment_type,
            'order_type': order.order_type,
            'subtotal': str(order.subtotal),
            'gst_amount': str(order.gst_amount),
            'grand_total': str(order.grand_total),
            'items': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'total_price': str(item.total_price),
                    'customizations': item.customizations
                }
                for item in order_items
            ]
        }
        logger.debug(f"Order data: {order_data}")
        return JsonResponse({'status': 'success', 'order': order_data})
    except Order.DoesNotExist:
        logger.error(f"Order with pk={pk} does not exist.")
        return JsonResponse({'status': 'failed', 'error': 'Order not found'}, status=404)
    except AttributeError as ae:
        logger.error(f"Attribute error in order_details for pk={pk}: {str(ae)}")
        return JsonResponse({'status': 'failed', 'error': 'Invalid order data'}, status=400)
    except Exception as e:
        logger.error(f"Error fetching order details for pk={pk}: {str(e)}")
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def verify_password(request):
    try:
        data = json.loads(request.body)
        password = data.get('password', '')
        employee_id = data.get('employee_id', '')  # Retrieve employee_id from the request

        # Fetch the employee based on employee_id
        employee = get_object_or_404(Employee, employee_id=employee_id)

        # Check if the provided password is correct
        if employee.check_password(password):
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'failed', 'error': 'Invalid password'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

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
                order_details=data.get('items', []),
                table_number=data.get('tableNumber', 'N/A')   # Include table number if provided
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

@csrf_exempt
@transaction.atomic
def store_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received order data for storage:", data)  # Debug parsed data

            # Validate required fields
            required_keys = {"order_id", "items", "payment_type", "subtotal", "gst_amount", "grand_total", "order_type"}
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
                print("Processing item for storage:", item)  # Debug each item

            # Create order
            order = Order.objects.create(
                order_id=data['order_id'],
                subtotal=Decimal(str(data.get('subtotal', '0'))),
                gst_amount=Decimal(str(data.get('gst_amount', '0'))),
                grand_total=Decimal(str(data.get('grand_total', '0'))),
                payment_type=data.get('payment_type', 'N/A'),
                order_type=data.get('order_type', 'N/A'),
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
                        total_price=Decimal(str(item_data.get('total_price', '0'))),
                        base_price=Decimal(str(item_data.get('price', '0'))),
                        customization_price=Decimal(str(item_data.get('customization_price', '0'))),
                        item_details=item_data
                    )
                    order.items.add(order_item)  # Add order item to order
                except Exception as e:
                    print(f"Error processing item {item_data} for storage: {e}")
                    raise

            order.save()
            print("Final order stored:", order.order_id, "with items:", order.items.count())

            return JsonResponse({
                'status': 'success',
                'order_id': order.order_id,
                'items_count': order.items.count()
            })

        except json.JSONDecodeError:
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            import traceback
            print("Error storing order:", str(e))
            print(traceback.format_exc())
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def fetch_order_data(request):
    if request.method == 'GET':
        order_id = request.GET.get('order_id')
        if not order_id:
            return JsonResponse({'status': 'failed', 'error': 'Order ID not provided'}, status=400)
        try:
            order = Order.objects.get(order_id=order_id)
            order_data = {
                'order_id': order.order_id,
                'date': order.date.strftime('%Y-%m-%d') if hasattr(order, 'date') else 'N/A',
                'time': order.time.strftime('%H:%M:%S') if hasattr(order, 'time') else 'N/A',
                'payment_type': order.payment_type,
                'order_type': order.order_type,
                'subtotal': str(order.subtotal),
                'gst_amount': str(order.gst_amount),
                'grand_total': str(order.grand_total),
                'items': [
                    {
                        'name': item.name,
                        'quantity': item.quantity,
                        'total_price': str(item.total_price),
                        'customizations': item.customizations
                    }
                    for item in order.items.all()
                ]
            }
            return JsonResponse({'status': 'success', 'order': order_data})
        except Order.DoesNotExist:
            return JsonResponse({'status': 'failed', 'error': 'Order not found'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=500)
    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_order_details(request):
    order_id = request.GET.get('order_id')
    if not order_id:
        return JsonResponse({'status': 'failed', 'error': 'Order ID not provided'}, status=400)
    try:
        order = Order.objects.get(order_id=order_id)
        order_data = {
            'order_id': order.order_id,
            'date': order.date.strftime('%Y-%m-%d') if hasattr(order, 'date') else 'N/A',
            'time': order.time.strftime('%H:%M:%S') if hasattr(order, 'time') else 'N/A',
            'payment_type': order.payment_type,
            'order_type': order.order_type,
            'subtotal': str(order.subtotal),
            'gst_amount': str(order.gst_amount),
            'grand_total': str(order.grand_total),
            'items': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'total_price': str(item.total_price),
                    'customizations': item.customizations
                }
                for item in order.items.all()
            ]
        }
        return JsonResponse({'status': 'success', 'order': order_data})
    except Order.DoesNotExist:
        return JsonResponse({'status': 'failed', 'error': 'Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=500)

@csrf_exempt
@transaction.atomic
def delete_order(request, order_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            employee_id = data.get('employee_id')
            password = data.get('password')
            reason = data.get('reason', '')
            
            logger.debug(f"Delete order request received for order_id={order_id} by employee_id={employee_id}")

            if not employee_id or not password:
                logger.warning("Employee ID or password missing in the delete order request.")
                return JsonResponse({'status': 'failed', 'error': 'Employee ID and password are required.'}, status=400)

            # Authenticate employee
            employee = get_object_or_404(Employee, employee_id=employee_id)
            if not employee.check_password(password):
                logger.warning(f"Invalid password for employee_id={employee_id}")
                return JsonResponse({'status': 'failed', 'error': 'Invalid password.'}, status=400)

            # Fetch the order
            order = get_object_or_404(Order, order_id=order_id)

            if order.status == 'deleted':
                logger.info(f"Order {order_id} is already deleted.")
                return JsonResponse({'status': 'failed', 'error': 'Order is already deleted.'}, status=400)

            # Update order status
            order.status = 'deleted'
            order.deletion_reason = reason
            order.deleted_by = employee
            order.save()

            logger.info(f"Order {order_id} deleted successfully by employee_id={employee_id}")
            return JsonResponse({'status': 'success', 'message': 'Order deleted successfully.'}, status=200)

        except json.JSONDecodeError:
            logger.error("Invalid JSON data in delete order request.")
            return JsonResponse({'status': 'failed', 'error': 'Invalid JSON data.'}, status=400)
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} does not exist.")
            return JsonResponse({'status': 'failed', 'error': 'Order does not exist.'}, status=404)
        except Employee.DoesNotExist:
            logger.error(f"Employee {employee_id} does not exist.")
            return JsonResponse({'status': 'failed', 'error': 'Employee does not exist.'}, status=404)
        except Exception as e:
            logger.exception("Unexpected error during order deletion.")
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=500)

    logger.warning("Invalid request method for delete_order view.")
    return JsonResponse({'status': 'failed', 'error': 'Invalid request method.'}, status=405)

def table_order_view(request, table_number):
    try:
        table_order = TableOrder.objects.get(table_number=table_number)
        return render(request, 'table_order.html', {'table_order': table_order})
    except TableOrder.DoesNotExist:
        return render(request, 'error.html', {'error_message': 'Table order not found.'})

@csrf_exempt
@require_POST
def create_table_order(request):
    try:
        data = json.loads(request.body)
        items = data.get('items', [])
        formatted_items = []
        for item in items:
            formatted_item = {
                'name': item.get('name', ''),
                'quantity': item.get('quantity', 0),
                'price': item.get('price', 0),
                'customizations': item.get('customizations', [])
            }
            formatted_items.append(formatted_item)
        
        # Fetch the table object by number for consistency
        table = get_object_or_404(Table, number=data['table_number'])
        table_order = TableOrder.objects.create(
            table_number=table.number,  # Use the table's number
            table=table,                # Set the foreign key
            items=formatted_items,
            customizations=data.get('customizations', []),
            subtotal=Decimal(str(data.get('subtotal', '0'))),
            gst_amount=Decimal(str(data.get('gst_amount', '0'))),
            grand_total=Decimal(str(data.get('grand_total', '0'))),
            payment_type=data.get('payment_type', 'CASH'),
            order_type=data.get('order_type', 'DINE_IN'),
            notes=data.get('notes', '')
        )
        table_order.calculate_totals()
        return JsonResponse({'status': 'success', 'table_order_id': table_order.table_order_id})
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def update_table_order(request, table_order_id):
    try:
        data = json.loads(request.body)
        table_order = get_object_or_404(TableOrder, table_order_id=table_order_id)
        items = data.get('items', table_order.items)
        formatted_items = []
        for item in items:
            formatted_item = {
                'name': item.get('name', ''),
                'quantity': item.get('quantity', 0),
                'price': item.get('price', 0),
                'customizations': item.get('customizations', [])
            }
            formatted_items.append(formatted_item)
        
        table_order.items = formatted_items
        table_order.customizations = data.get('customizations', table_order.customizations)
        table_order.subtotal = Decimal(str(data.get('subtotal', table_order.subtotal)))
        table_order.gst_amount = Decimal(str(data.get('gst_amount', table_order.gst_amount)))
        table_order.grand_total = Decimal(str(data.get('grand_total', table_order.grand_total)))
        table_order.payment_type = data.get('payment_type', table_order.payment_type)
        table_order.order_type = data.get('order_type', table_order.order_type)
        table_order.notes = data.get('notes', table_order.notes)
        table_order.calculate_totals()
        return JsonResponse({'status': 'success', 'table_order_id': table_order.table_order_id})
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
@require_POST
def delete_table_order(request, table_order_id):
    try:
        table_order = get_object_or_404(TableOrder, table_order_id=table_order_id)
        table_order.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=400)

@csrf_exempt
def save_table_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Get or create the table
            table_number = data.get('table_number')
            table = Table.objects.get_or_create(
                number=table_number,
                defaults={
                    'is_booked': True,
                    'is_active': True
                }
            )[0]
            
            # Create the table order
            table_order = TableOrder.objects.create(
                table_order_id=data.get('table_order_id'),
                table_number=table_number,  # Set table_number
                table=table,  # Set table relationship
                items=data.get('items', []),
                subtotal=data.get('subtotal', 0),
                gst_amount=data.get('gst_amount', 0),
                grand_total=data.get('grand_total', 0),
                payment_type=data.get('payment_type', 'CASH'),
                order_type=data.get('order_type', 'DINE_IN'),
                status=data.get('status', 'active'),
                saved_time=timezone.now()
            )
            
            # Update table status
            table.is_booked = True
            table.save()

            print(f"Created table order: {table_order.table_order_id} for table: {table.number}")
            
            return JsonResponse({
                'status': 'success',
                'message': 'Order saved successfully.',
                'table_order_id': table_order.table_order_id,
                'table_number': table.number
            })
            
        except Exception as e:
            print(f"Error saving table order: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'error': str(e)
            })
    return JsonResponse({
        'status': 'error',
        'error': 'Invalid request method.'
    })

@csrf_exempt
def get_table_order_details(request, table_id):
    try:
        # Filter orders using the Table foreign key for consistency with new tables
        table_orders = TableOrder.objects.filter(table__number=table_id).order_by('-created_at')
        orders_data = []
        for order in table_orders:
            # Deserialize 'items' if it is a JSON string
            items = json.loads(order.items) if isinstance(order.items, str) else order.items
            formatted_items = []
            for item in items:
                formatted_item = {
                    'name': item.get('name', ''),
                    'quantity': item.get('quantity', 0),
                    'price': item.get('price', 0),
                    'customizations': item.get('customizations', [])
                }
                formatted_items.append(formatted_item)
            orders_data.append({
                'table_order_id': order.table_order_id,
                'table_number': order.table_number,
                'subtotal': str(order.subtotal),
                'gst_amount': str(order.gst_amount),
                'grand_total': str(order.grand_total),
                'status': order.status,
                'created_at': order.created_at.isoformat(),  # Ensure ISO format
                'saved_time': order.saved_time.isoformat() if order.saved_time else None,  # Ensure ISO format
                'items': formatted_items
            })
        # Debug log to verify the data being sent
        print(f"Sending orders data: {orders_data}")  # Remove or comment out in production
        return JsonResponse({'status': 'success', 'table_orders': orders_data})
    except TableOrder.DoesNotExist:
        return JsonResponse({'status': 'failed', 'error': 'Table orders not found'}, status=404)
    except Exception as e:
        print(f"Error in get_table_order_details: {str(e)}")  # Remove or comment out in production
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=500)

@csrf_exempt
@transaction.atomic
def save_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Parsed JSON data:", data)

            # Check if the order already exists
            if Order.objects.filter(order_id=data['order_id']).exists():
                return JsonResponse({'status': 'error', 'message': 'Order already exists.'}, status=400)

            # Create the Order
            order = Order.objects.create(
                order_id=data['order_id'],
                order_details=data.get('order_details', {}),
                subtotal=data['subtotal'],
                gst_amount=data['gst_amount'],
                grand_total=data['grand_total'],
                payment_type=data['payment_type'],
                order_type=data['order_type'],
                date=data['date'],
                time=data['time'],
                status='completed'
            )

            # Add items to the order
            for item in data['items']:
                order_item = OrderItem.objects.create(
                    name=item['name'],
                    price=item['price'],
                    quantity=item['quantity'],
                    total_price=item['total_price'],
                    customizations=item.get('customizations', []),
                    item_details=item.get('item_details', {})
                )
                order.items.add(order_item)

            # Update the corresponding TableOrder status
            try:
                table_order = TableOrder.objects.get(table_order_id=data['order_id'])
                table_order.status = 'completed'
                table_order.save()
            except TableOrder.DoesNotExist:
                print(f"No TableOrder found for order_id: {data['order_id']}")

            print("Order saved successfully:", order.order_id)
            return JsonResponse({'status': 'success', 'message': 'Order saved successfully.'})
        except Exception as e:
            print("Error in save_order:", str(e))
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

def check_order_status(request, table_order_id):
    try:
        logger.debug("Checking order status for table_order_id: %s", table_order_id)
        
        # First check TableOrder status
        table_order = TableOrder.objects.filter(table_order_id=table_order_id).first()
        if table_order and table_order.status == 'completed':
            return JsonResponse({'status': 'success', 'order_status': 'completed'})
        
        # Then check Order status
        order = Order.objects.filter(order_id=table_order_id, status='completed').first()
        if order:
            # Update TableOrder status if Order exists and is completed
            if table_order:
                table_order.status = 'completed'
                table_order.save()
            return JsonResponse({'status': 'success', 'order_status': 'completed'})

        return JsonResponse({'status': 'success', 'order_status': 'active'})
    except Exception as e:
        logger.exception("Error in check_order_status for table_order_id: %s", table_order_id)
        return JsonResponse({'status': 'failed', 'error': str(e)}, status=500)

@csrf_exempt
@require_POST
def clear_all_orders(request):
    try:
        data = json.loads(request.body)
        employee_id = data.get('employee_id')
        password = data.get('password')
    except Exception:
        return JsonResponse({'status': 'error', 'error': 'Invalid input'})
    
    if not employee_id or not password:
        return JsonResponse({'status': 'error', 'error': 'Employee credentials required'})
    
    try:
        # Lookup employee by the custom employee_id field (not the pk)
        employee = Employee.objects.get(employee_id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({'status': 'error', 'error': 'Invalid employee id'})
    
    if not check_password(password, employee.password):
        return JsonResponse({'status': 'error', 'error': 'Invalid password'})
    
    # Clear only completed orders from the TableOrder model
    completed_orders = TableOrder.objects.filter(status='completed')
    count = completed_orders.count()
    completed_orders.delete()
    
    return JsonResponse({'status': 'success', 'message': f'Cleared {count} completed orders.'})

@csrf_exempt
@transaction.atomic
def complete_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received data:", data)
            
            # Create new order
            order = Order.objects.create(
                order_id=data['order_id'],
                subtotal=Decimal(str(data['subtotal'])),
                gst_amount=Decimal(str(data['gst_amount'])),
                grand_total=Decimal(str(data['grand_total'])),
                payment_type=data['payment_type'],
                order_type=data['order_type'],
                status='completed'
            )

            # Add items to order
            for item_data in data['items']:
                order_item = OrderItem.objects.create(
                    name=item_data['name'],
                    quantity=item_data['quantity'],
                    price=Decimal(str(item_data['price'])),
                    total_price=Decimal(str(item_data['total_price'])),
                    customizations=item_data.get('customizations', [])
                )
                order.items.add(order_item)

            # Update TableOrder status
            try:
                table_order = TableOrder.objects.get(table_order_id=data['order_id'])
                table_order.status = 'completed'
                table_order.save()
                logger.info(f"Updated TableOrder status for order_id: {data['order_id']}")
            except TableOrder.DoesNotExist:
                logger.warning(f"No TableOrder found for order_id: {data['order_id']}")

            return JsonResponse({
                'status': 'success',
                'message': 'Order completed successfully'
            })

        except Exception as e:
            logger.error(f"Error in complete_order: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'error': str(e)
            })
    
    return JsonResponse({'status': 'error', 'error': 'Invalid request method'})

@csrf_exempt
@transaction.atomic
def release_table_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            table_id = data.get('table_id')
            if not table_id:
                return JsonResponse({'status': 'failed', 'error': 'Table ID not provided'}, status=400)
            
            table = get_object_or_404(Table, id=table_id)
            table_order = TableOrder.objects.filter(table=table, status='active').first()
            if not table_order:
                return JsonResponse({'status': 'failed', 'error': 'No active order found for this table'}, status=404)
            
            # Mark the table order as completed
            table_order.status = 'completed'
            table_order.save()

            # Create a new Order from the TableOrder
            order = Order.objects.create(
                order_id=table_order.table_order_id,
                order_details=table_order.items,
                subtotal=table_order.subtotal,
                gst_amount=table_order.gst_amount,
                grand_total=table_order.grand_total,
                payment_type=table_order.payment_type,
                order_type=table_order.order_type,
                status='completed',
                date=table_order.created_at.date(),
                time=table_order.created_at.time()
            )

            # Add items to the Order
            for item_data in table_order.items:
                order_item = OrderItem.objects.create(
                    name=item_data.get('name', ''),
                    price=Decimal(str(item_data.get('price', '0'))),
                    quantity=int(item_data.get('quantity', 0)),
                    customizations=item_data.get('customizations', []),
                    total_price=Decimal(str(item_data.get('total_price', '0')))
                )
                order.items.add(order_item)

            order.save()

            # Release the table
            table.is_booked = False
            table.save()

            return JsonResponse({'status': 'success', 'message': 'Table order completed and table released successfully'})
        except Exception as e:
            return JsonResponse({'status': 'failed', 'error': str(e)}, status=500)
    return JsonResponse({'status': 'failed', 'error': 'Invalid request method'}, status=405)

@csrf_exempt
def manage_items(request):
    if request.method == 'POST':
        form_type = request.POST.get('form_type')
        name = request.POST.get('name')

        if not form_type or not name:
            messages.error(request, 'Form type and name are required')
            return JsonResponse({'status': 'error', 'message': 'Form type and name are required'})

        try:
            if form_type == 'category':
                # Create a new category
                category = Category.objects.create(
                    name=name,
                )
                messages.success(request, 'Category added successfully!')
                return JsonResponse({'status': 'success', 'message': 'Category added successfully'})

            elif form_type == 'customization':
                # Create a new customization option
                category_id = request.POST.get('customization_category')
                price = request.POST.get('price')
                if not category_id or not price:
                    return JsonResponse({'status': 'error', 'message': 'Category and price are required for customization'})

                category = CustomizationCategory.objects.get(id=category_id)
                CustomizationOption.objects.create(
                    name=name,
                    price=price,
                    category=category
                )
                messages.success(request, 'Customization option added successfully!')
                return JsonResponse({'status': 'success', 'message': 'Customization added successfully'})

            elif form_type == 'main_items':
                # Create a new menu item
                category_id = request.POST.get('category')
                price = request.POST.get('price')
                short_code = request.POST.get('short_code')
                has_customization = request.POST.get('has_customization') == 'on'
                image = request.FILES.get('image')

                if not category_id or not price:
                    return JsonResponse({'status': 'error', 'message': 'Category and price are required for items'})

                category = Category.objects.get(id=category_id)
                item = Item.objects.create(
                    name=name,
                    category=category,
                    price=price,
                    short_code=short_code,
                    has_customization=has_customization,
                    image=image
                )

                # Handle customization options if enabled
                if has_customization:
                    customization_options = request.POST.getlist('customization_options')
                    if customization_options:
                        item.customization_options.set(customization_options)

                messages.success(request, 'Item added successfully!')
                return JsonResponse({'status': 'success', 'message': 'Item added successfully'})

        except Exception as e:
            messages.error(request, f'Error: {str(e)}')
            return JsonResponse({'status': 'error', 'message': str(e)})

    # Prepare categories data for JavaScript
    categories_data = list(Category.objects.values('id', 'name'))
    customization_categories_data = list(CustomizationCategory.objects.values('id', 'name'))
    
    context = {
        'categories': Category.objects.all(),
        'items': Item.objects.all().select_related('category'),
        'customization_options': CustomizationOption.objects.all().select_related('category'),
        'customization_categories': CustomizationCategory.objects.all(),
        # Add serialized data for JavaScript
        'categories_json': json.dumps(categories_data),
        'customization_categories_json': json.dumps(customization_categories_data),
    }
    return render(request, 'manage_items.html', context)

@csrf_exempt
def update_item(request):
    if not request.method == 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})
        
    try:
        form_type = request.POST.get('form_type')
        item_id = request.POST.get('id')
        name = request.POST.get('name')
        
        if form_type == 'category':
            category = get_object_or_404(Category, id=item_id)
            category.name = name
            category.description = request.POST.get('description', '')
            category.save()
            
        elif form_type == 'customization':
            option = get_object_or_404(CustomizationOption, id=item_id)
            option.name = name
            option.price = request.POST.get('price')
            option.category_id = request.POST.get('category')
            option.save()
            
        elif form_type == 'main_items':
            item = get_object_or_404(Item, id=item_id)
            item.name = name
            item.price = request.POST.get('price')
            item.category_id = request.POST.get('category')
            item.short_code = request.POST.get('short_code')
            
            if 'image' in request.FILES:
                item.image = request.FILES['image']
            
            item.save()
        
        return JsonResponse({'status': 'success', 'message': 'Item updated successfully'})
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@csrf_exempt
def delete_item(request, form_type, item_id):
    if not request.method == 'DELETE':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})
        
    try:
        if form_type == 'category':
            Category.objects.filter(id=item_id).delete()
        elif form_type == 'customization':
            CustomizationOption.objects.filter(id=item_id).delete()
        elif form_type == 'main_items':
            Item.objects.filter(id=item_id).delete()
            
        return JsonResponse({'status': 'success', 'message': 'Item deleted successfully'})
        
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

def sales_dashboard(request):
    # Get date range
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    # Calculate today's stats
    today_orders = Order.objects.filter(date=end_date)
    today_sales = today_orders.aggregate(Sum('grand_total'))['grand_total__sum'] or 0
    today_order_count = today_orders.count()
    avg_order_value = today_sales / today_order_count if today_order_count > 0 else 0

    # Get daily sales data
    daily_sales = Order.objects.filter(
        date__range=[start_date, end_date]
    ).annotate(
        day=TruncDate('created_at')
    ).values('day').annotate(
        total=Sum('grand_total')
    ).order_by('day')

    # Get payment methods data
    payment_data = Order.objects.filter(
        date__range=[start_date, end_date]
    ).values('payment_type').annotate(
        total=Sum('grand_total')
    ).order_by('-total')

    context = {
        'today_sales': today_sales,
        'today_orders': today_order_count,
        'avg_order_value': avg_order_value,
        'dates': [item['day'].strftime('%Y-%m-%d') for item in daily_sales],
        'daily_sales': [float(item['total']) for item in daily_sales],
        'payment_methods': [item['payment_type'] for item in payment_data],
        'payment_amounts': [float(item['total']) for item in payment_data],
    }
    
    return render(request, 'reports/sales_dashboard.html', context)

def item_analytics(request):
    try:
        # Define output fields
        decimal_output_field = DecimalField(max_digits=10, decimal_places=2)
        integer_output_field = IntegerField()
        float_output_field = FloatField()
        char_output_field = models.CharField(max_length=255)

        # Get items analysis data without rating aggregation
        items_analysis = OrderItem.objects.values(
            'name'
        ).annotate(
            category=Coalesce(
                Cast('item_details__category', output_field=char_output_field),
                Value('Uncategorized', output_field=char_output_field)
            ),
            total_sold=Count('id'),
            revenue=Sum('total_price', output_field=decimal_output_field)
        ).order_by('-revenue')

        # Convert QuerySet to list and add default rating
        items_analysis = list(items_analysis)
        for item in items_analysis:
            item['avg_rating'] = 0.0  # Set default rating

        # Get top selling items
        top_items_by_quantity = OrderItem.objects.values('name').annotate(
            total_quantity=Count('id'),
            total_revenue=Sum('total_price', output_field=decimal_output_field)
        ).order_by('-total_quantity')[:5]

        # Get highest revenue item
        top_items_by_revenue = OrderItem.objects.values('name').annotate(
            total_quantity=Count('id'),
            total_revenue=Sum('total_price', output_field=decimal_output_field)
        ).order_by('-total_revenue')[:1]

        # Get today's stats
        today = timezone.now().date()
        today_stats = OrderItem.objects.filter(created_at__date=today).aggregate(
            total_sold=Count('id'),
            total_revenue=Sum('total_price', output_field=decimal_output_field)
        )
        
        today_items_sold = today_stats['total_sold'] or 0
        today_items_revenue = today_stats['total_revenue'] or Decimal('0')

        # Calculate average order value
        avg_order_value = float(today_items_revenue) / float(today_items_sold) if today_items_sold > 0 else 0

        context = {
            'items_analysis': items_analysis,
            'top_item': top_items_by_quantity.first(),
            'highest_revenue_item': top_items_by_revenue.first(),
            'avg_order_value': avg_order_value,
            'today_items_sold': today_items_sold,
            'today_items_revenue': today_items_revenue,
            'top_items_labels': json.dumps([item['name'] for item in top_items_by_quantity]) if top_items_by_quantity else '[]',
            'top_items_data': json.dumps([float(item['total_quantity']) for item in top_items_by_quantity]) if top_items_by_quantity else '[]',

        }
        
        return render(request, 'reports/item_analytics.html', context)
        
    except Exception as e:
        logger.error(f"Error in item_analytics: {str(e)}", exc_info=True)
        return render(request, 'reports/item_analytics.html', {
            'error': 'An error occurred while generating analytics.',
            'debug_message': str(e) if django_settings.DEBUG else None,
            'items_analysis': [],
            'top_items_labels': '[]',
            'top_items_data': '[]'
        })

def customer_insights(request):
    # Get table usage stats
    table_stats = TableOrder.objects.values('table_number').annotate(
        order_count=Count('id'),
        total_revenue=Sum('grand_total')
    ).order_by('-order_count')

    context = {
        'table_stats': table_stats,
    }
    return render(request, 'reports/customer_insights.html', context)


def financial_reports(request):
    try:
        # Get time period from request
        period = request.GET.get('period', 'day')  # Default to daily view
        today = timezone.now().date()
        
        # Calculate date ranges
        if period == 'day':
            start_date = today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:  # year
            start_date = today - timedelta(days=365)
        
        # Get completed orders for current period
        current_orders = Order.objects.filter(
            date__range=[start_date, today],
            status='completed'
        )

        # Get previous period orders for comparison
        prev_start_date = start_date - (today - start_date)
        prev_end_date = start_date - timedelta(days=1)
        previous_orders = Order.objects.filter(
            date__range=[prev_start_date, prev_end_date],
            status='completed'
        )

        # Calculate current period metrics
        total_revenue = current_orders.aggregate(
            total=Coalesce(Sum('grand_total'), Decimal('0.00'))
        )['total']
        
        total_orders = current_orders.count()
        avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0
        total_gst = current_orders.aggregate(
            total=Coalesce(Sum('gst_amount'), Decimal('0.00'))
        )['total']

        # Calculate previous period metrics
        prev_revenue = previous_orders.aggregate(
            total=Coalesce(Sum('grand_total'), Decimal('0.00'))
        )['total']
        prev_orders = previous_orders.count()
        prev_avg_order = (prev_revenue / prev_orders) if prev_orders > 0 else 0

        # Calculate growth percentages
        revenue_trend = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        order_growth = ((total_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0
        avg_order_growth = ((avg_order_value - prev_avg_order) / prev_avg_order * 100) if prev_avg_order > 0 else 0

        # Daily performance analysis - Updated query
        daily_performance = Order.objects.filter(
            date__range=[start_date, today],
            status='completed'
        ).annotate(
            order_date=TruncDate('created_at')  # Renamed to avoid conflict
        ).values('order_date').annotate(
            revenue=Sum('grand_total'),
            orders=Count('id')
        ).order_by('-revenue')

        # Get top and bottom performing days with full date info
        top_days = list(daily_performance.order_by('-revenue')[:3])
        bottom_days = list(daily_performance.order_by('revenue')[:3])

        # Calculate targets
        monthly_revenue = Order.objects.filter(
            date__month=today.month,
            status='completed'
        ).aggregate(total=Coalesce(Sum('grand_total'), Decimal('0.00')))['total']

        # Set your monthly targets (adjust these values as needed)
        monthly_revenue_target = Decimal('100000.00')  # Example: ₹1,00,000
        monthly_order_target = 500  # Example: 500 orders

        target_progress = (monthly_revenue / monthly_revenue_target * 100) if monthly_revenue_target > 0 else 0
        order_target_progress = (total_orders / monthly_order_target * 100) if monthly_order_target > 0 else 0

        # Daily revenue trend data - Fix the date annotation
        daily_revenue = current_orders.annotate(
            order_date=TruncDate('created_at')  # Changed from 'date' to 'order_date'
        ).values('order_date').annotate(
            total=Sum('grand_total')
        ).order_by('order_date')

        # Calculate GST breakup
        cgst_amount = total_gst / 2
        sgst_amount = total_gst / 2

        context = {
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'avg_order_value': avg_order_value,
            'revenue_trend': revenue_trend,
            'order_growth': order_growth,
            'avg_order_growth': avg_order_growth,
            'target_progress': target_progress,
            'order_target_progress': order_target_progress,
            'total_gst': total_gst,
            'cgst_amount': cgst_amount,
            'sgst_amount': sgst_amount,
            'top_days': top_days,
            'bottom_days': bottom_days,
            'daily_revenue_data': json.dumps([float(item['total']) for item in daily_revenue]),
            'daily_revenue_dates': json.dumps([item['order_date'].strftime('%Y-%m-%d') for item in daily_revenue]),
            'selected_period': period,
        }

        return render(request, 'reports/financial_reports.html', context)

    except Exception as e:
        logger.error(f"Error in financial_reports: {str(e)}", exc_info=True)
        return render(request, 'reports/financial_reports.html', {
            'error': 'An error occurred while generating the report.',
            'debug_message': str(e) if django_settings.DEBUG else None  # Now using correct settings import
        })

def export_financial_report(request):
    """Export financial data to CSV matching the PDF report format"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="financial_report.csv"'
    
    writer = csv.writer(response)
    
    # Get the same data as PDF report
    period = request.GET.get('period', 'day')
    end_date = timezone.now().date()
    
    if period == 'day':
        start_date = end_date
    elif period == 'week':
        start_date = end_date - timedelta(days=7)
    elif period == 'month':
        start_date = end_date - timedelta(days=30)
    else:  # year
        start_date = end_date - timedelta(days=365)

    # Get orders
    current_orders = Order.objects.filter(
        date__range=[start_date, end_date],
        status='completed'
    )

    # Calculate totals
    total_revenue = current_orders.aggregate(
        total=Coalesce(Sum('grand_total'), Decimal('0.00'))
    )['total']
    
    total_gst = current_orders.aggregate(
        total=Coalesce(Sum('gst_amount'), Decimal('0.00'))
    )['total']
    
    cgst_amount = total_gst / 2
    sgst_amount = total_gst / 2

    # Write headers
    writer.writerow(['Financial Report'])
    writer.writerow([f'Period: {start_date.strftime("%Y-%m-%d")} to {end_date.strftime("%Y-%m-%d")}'])
    writer.writerow([])  # Empty row for spacing

    # Write summary section
    writer.writerow(['Financial Summary'])
    writer.writerow(['Total Revenue', f'₹{total_revenue:.2f}'])
    writer.writerow(['Total Orders', current_orders.count()])
    writer.writerow(['Average Order Value', f'₹{(total_revenue/current_orders.count() if current_orders.count() > 0 else 0):.2f}'])
    writer.writerow(['Total GST', f'₹{total_gst:.2f}'])
    writer.writerow(['CGST', f'₹{cgst_amount:.2f}'])
    writer.writerow(['SGST', f'₹{sgst_amount:.2f}'])
    writer.writerow([])  # Empty row for spacing

    # Write daily performance section
    writer.writerow(['Daily Performance'])
    writer.writerow(['Date', 'Revenue', 'Orders', 'GST', 'Avg Order Value'])
    
    daily_data = current_orders.annotate(
        order_date=TruncDate('created_at')
    ).values('order_date').annotate(
        revenue=Sum('grand_total'),
        orders=Count('id'),
        gst=Sum('gst_amount')
    ).order_by('order_date')

    for day in daily_data:
        avg_order = day['revenue'] / day['orders'] if day['orders'] > 0 else 0
        writer.writerow([
            day['order_date'].strftime('%Y-%m-%d'),
            f"₹{day['revenue']:.2f}",
            day['orders'],
            f"₹{day['gst']:.2f}",
            f"₹{avg_order:.2f}"
        ])

    # Write payment methods section if available
    payment_methods = current_orders.values('payment_type').annotate(
        revenue=Sum('grand_total'),
        count=Count('id')
    ).order_by('-revenue')

    if payment_methods:
        writer.writerow([])  # Empty row for spacing
        writer.writerow(['Payment Method Analysis'])
        writer.writerow(['Method', 'Revenue', 'Transactions', '% of Total'])
        
        for method in payment_methods:
            percentage = (method['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            writer.writerow([
                method['payment_type'],
                f"₹{method['revenue']:.2f}",
                method['count'],
                f"{percentage:.1f}%"
            ])

    return response

def generate_pdf_report(request):
    """Generate PDF version of the financial report"""
    try:
        import os
        wkhtmltopdf_path = os.path.abspath(django_settings.WKHTMLTOPDF_CMD)
        
        # Get period and date range
        period = request.GET.get('period', 'day')
        end_date = timezone.now().date()
        
        if period == 'day':
            start_date = end_date
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        else:  # year
            start_date = end_date - timedelta(days=365)
        
        # Get completed orders
        current_orders = Order.objects.filter(
            date__range=[start_date, end_date],
            status='completed'
        )

        # Calculate metrics
        total_revenue = current_orders.aggregate(
            total=Coalesce(Sum('grand_total'), Decimal('0.00'))
        )['total']
        
        # Get daily revenue breakdown - Changed annotation name from 'date' to 'report_date'
        daily_revenue = current_orders.annotate(
            report_date=TruncDate('created_at')  # Changed from 'date' to 'report_date'
        ).values('report_date').annotate(
            revenue=Sum('grand_total'),
            orders=Count('id'),
            gst=Sum('gst_amount')
        ).order_by('report_date')

        # Get previous period for comparison
        prev_start_date = start_date - (end_date - start_date)
        previous_orders = Order.objects.filter(
            date__range=[prev_start_date, start_date - timedelta(days=1)],
            status='completed'
        )
        
        # Calculate trends
        prev_total = previous_orders.aggregate(
            total=Coalesce(Sum('grand_total'), Decimal('0.00'))
        )['total']
        revenue_trend = ((total_revenue - prev_total) / prev_total * 100) if prev_total > 0 else 0
        
        # Get daily performance for top days
        daily_performance = current_orders.annotate(
            report_date=TruncDate('created_at')
        ).values('report_date').annotate(
            revenue=Sum('grand_total'),
            orders=Count('id')
        ).order_by('-revenue')

        # Get payment method analysis
        payment_methods = current_orders.values('payment_type').annotate(
            revenue=Sum('grand_total'),
            count=Count('id')
        ).order_by('-revenue')

        payment_analysis = []
        for method in payment_methods:
            percentage = (method['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            payment_analysis.append({
                'type': method['payment_type'],
                'revenue': method['revenue'],
                'count': method['count'],
                'percentage': percentage
            })

        # Create context with all the data
        context = {
            'start_date': start_date,
            'end_date': end_date,
            'selected_period': period,
            'total_revenue': total_revenue,
            'total_orders': current_orders.count(),
            'avg_order_value': total_revenue / current_orders.count() if current_orders.count() > 0 else 0,
            'total_gst': current_orders.aggregate(Sum('gst_amount'))['gst_amount__sum'] or 0,
            'cgst_amount': (current_orders.aggregate(Sum('gst_amount'))['gst_amount__sum'] or 0) / 2,
            'sgst_amount': (current_orders.aggregate(Sum('gst_amount'))['gst_amount__sum'] or 0) / 2,
            'revenue_trend': revenue_trend,
            'top_days': list(daily_performance[:3]),
            'daily_revenue': [
                {
                    'date': item['report_date'],  # Use the new field name
                    'revenue': item['revenue'],
                    'orders': item['orders'],
                    'gst': item['gst']
                }
                for item in daily_revenue
            ],
            'now': timezone.now(),
            'payment_methods': payment_analysis,
        }
        
        # Add hotel information to context
        context.update({
            'hotel_name': 'Your Hotel Name',  # Replace with actual hotel name
            'hotel_logo_url': 'path/to/logo.png',  # Replace with actual logo path
            'hotel_address': '123 Main Street, City, State - PIN',
            'hotel_phone': '+91 1234567890',
            'hotel_email': 'contact@hotel.com',
            'hotel_gstin': 'XXXXXXXXXXXX',
            # ...rest of your existing context...
        })
        
        # Render template and generate PDF
        html_string = render_to_string('reports/financial_reports_pdf.html', context)
        config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
        
        # Generate PDF with improved margins and options
        pdf_file = pdfkit.from_string(
            html_string,
            False,
            options={
                'page-size': 'A4',
                'margin-top': '15mm',
                'margin-right': '15mm',
                'margin-bottom': '15mm',
                'margin-left': '15mm',
                'encoding': 'UTF-8',
                'enable-local-file-access': True,
                'quiet': '',
                'print-media-type': True,
                'footer-right': '[page] of [topage]'
            },
            configuration=config
        )
        
        # Create response
        response = HttpResponse(pdf_file, content_type='application/pdf')
        filename = f"financial_report_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return HttpResponse(f"Error generating PDF: {str(e)}", status=500)

def share_report(request):
    """Share report via email"""
    if request.method == 'POST':
        email = request.POST.get('email')
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'})
            
        try:
            # Generate PDF
            context = {}  # Add the same context data as financial_reports view
            html_string = render_to_string('reports/financial_reports_pdf.html', context)
            pdf_file = pdfkit.from_string(html_string, False)
            
            # Create email
            email_message = EmailMessage(
                'Financial Report',
                'Please find attached the financial report.',
                'from@example.com',
                [email]
            )
            
            # Attach PDF
            email_message.attach('financial_report.pdf', pdf_file, 'application/pdf')
            email_message.send()
            
            return JsonResponse({'status': 'success', 'message': 'Report sent successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
            
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

