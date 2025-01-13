from ninja import NinjaAPI, Schema
from typing import List, Optional
from decimal import Decimal
from django.db import transaction
from .models import Order, OrderItem, Table, TableOrder
from django.http import JsonResponse
import json

api = NinjaAPI(version='2.0.0')  # Add version parameter

# Request/Response Schemas
class CustomizationSchema(Schema):
    id: str
    name: str
    price: str

class OrderItemSchema(Schema):
    id: Optional[str]
    name: str
    price: str
    quantity: int
    customizations: List[CustomizationSchema] = []
    totalPrice: str

class OrderRequestSchema(Schema):
    orderId: str
    items: List[OrderItemSchema]
    totalAmount: str
    gstAmount: str
    grandTotal: str
    paymentType: Optional[str] = None  # Made optional
    orderType: Optional[str] = None     # Made optional
    tableId: Optional[str] = None

class OrderResponseSchema(Schema):
    status: str
    order_id: str
    items_count: int

# API Endpoints
@api.post("/place/", response=OrderResponseSchema)  # Adjusted endpoint
@transaction.atomic
def place_order(request, order_data: OrderRequestSchema):
    try:
        # Remove validation for existing order
        # if Order.objects.filter(order_id=order_data.orderId).exists():
        #     return {"status": "failed", "error": "Order already exists"}

        # Create order without requiring paymentType, orderType, and tableId
        order = Order.objects.create(
            order_id=order_data.orderId,
            subtotal=Decimal(order_data.totalAmount),
            gst_amount=Decimal(order_data.gstAmount),
            grand_total=Decimal(order_data.grandTotal),
            payment_type=order_data.paymentType or 'N/A',
            order_type=order_data.orderType or 'N/A',
            order_details=[item.dict() for item in order_data.items]
        )

        # Create order items
        for item in order_data.items:
            if not item.name:  # Skip empty items
                continue
                
            order_item = OrderItem.objects.create(
                name=item.name,
                price=Decimal(item.price),
                quantity=item.quantity,
                customizations=[c.dict() for c in item.customizations],
                total_price=Decimal(item.totalPrice),
                base_price=Decimal(item.price),
                customization_price=sum(Decimal(c.price) for c in item.customizations),
                item_details=item.dict()
            )
            order.items.add(order_item)

        # Link to table if tableId is provided
        if order_data.tableId:
            table_number = order_data.tableId.replace('table-', '')
            table, _ = Table.objects.get_or_create(number=table_number)
            table_order, _ = TableOrder.objects.get_or_create(table=table)
            table_order.orders.add(order)

        return {
            "status": "success",
            "order_id": order.order_id,
            "items_count": order.items.count()
        }
    except Exception as e:
        print(f"Error placing order: {str(e)}")
        return {
            "status": "failed",
            "error": str(e)
        }

@api.get("/tables/{table_number}/orders")
def get_table_orders(request, table_number: int):
    table = Table.objects.get(number=table_number)
    orders = table.orders.all()
    return {
        "status": "success",
        "orders": [{
            "order_id": order.order_id,
            "subtotal": str(order.subtotal),
            "gst_amount": str(order.gst_amount),
            "grand_total": str(order.grand_total),
            "items": [{
                "name": item.name,
                "price": str(item.price),
                "quantity": item.quantity,
                "customizations": item.customizations,
                "total_price": str(item.total_price)
            } for item in order.items.all()]
        } for order in orders]
    }

@api.post("/tables/release")
@transaction.atomic
def release_table(request, table_id: str):
    try:
        table_number = table_id.replace('table-', '')
        table = Table.objects.get(number=table_number)
        table.orders.clear()
        table.save()
        return {"status": "success"}
    except Table.DoesNotExist:
        return {"status": "failed", "error": "Table not found"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

@api.get("/tables")
def get_tables(request):
    tables = Table.objects.all()
    return {
        "tables": {
            table.place: [{
                "number": table.number,
                "isBooked": table.orders.exists(),
                "startTime": table.orders.first().time.timestamp() * 1000 if table.orders.exists() else None
            } for table in Table.objects.filter(place=table.place)]
            for table in tables
        }
    }
