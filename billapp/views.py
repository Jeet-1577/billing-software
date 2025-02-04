from django.shortcuts import render, redirect, get_object_or_404
from .models import Category, Item, Order, Table, Employee, OrderItem, KoOrder, TableOrder  # Ensure Employee, OrderItem, and KoOrder are imported
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
import logging
from django.contrib.auth.hashers import check_password

logger = logging.getLogger(__name__)

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
                order_details=data.get('items', []),
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

@require_POST
def book_table(request, table_id):
    try:
        table = Table.objects.get(id=table_id)
        # Removed booking logic. Table status is now determined solely by active orders.
        return JsonResponse({
            'status': 'success',
            'message': 'Table booking logic removed. Status is now based on active orders.'
        })
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
    tables_data = []
    for table in Table.objects.all():
        # Check if any order in the table is active
        is_booked = table.orders.filter(status='active').exists()
        tables_data.append({
            'id': table.id,
            'size': table.size,
            'is_booked': is_booked,  # Booked if any active order exists
            'booking_time': table.booking_time
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
        
        table_order = TableOrder.objects.create(
            table_number=data['table_number'],
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
            table_order_id = data.get('table_order_id')
            table_number = data.get('table_number')
            items = data.get('items', [])
            subtotal = data.get('subtotal', 0)
            gst_amount = data.get('gst_amount', 0)
            grand_total = data.get('grand_total', 0)
            payment_type = data.get('payment_type', 'CASH')
            order_type = data.get('order_type', 'DINE_IN')
            status = data.get('status', 'active')

            table = Table.objects.get(number=table_number)

            table_order = TableOrder.objects.create(
                table_order_id=table_order_id,
                table_number=table_number,
                items=json.dumps(items),
                subtotal=subtotal,
                gst_amount=gst_amount,
                grand_total=grand_total,
                payment_type=payment_type,
                order_type=order_type,
                status=status,
                table=table,
                saved_time=timezone.now()  # Save the current time
            )

            return JsonResponse({'status': 'success', 'message': 'Order saved successfully.'})
        except Table.DoesNotExist:
            return JsonResponse({'status': 'error', 'error': 'Table does not exist.'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'error': str(e)})
    else:
        return JsonResponse({'status': 'error', 'error': 'Invalid request method.'})

@csrf_exempt
def get_table_order_details(request, table_id):
    try:
        table_orders = TableOrder.objects.filter(table_number=table_id).order_by('-created_at')
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
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({'status': 'error', 'error': 'Invalid employee id'})
    
    if not check_password(password, employee.password):
        return JsonResponse({'status': 'error', 'error': 'Invalid password'})
    
    # Credentials valid: delete all orders
    Order.objects.all().delete()
    # ...additional logic to release tables if required...
    return JsonResponse({'status': 'success'})

@csrf_exempt
@transaction.atomic
def complete_order(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print("Received data:", data)  # Debug print
            
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
