from django.urls import path, include
from . import views  # Updated import
from .views import table_view, store_order, save_table_order, get_table_order_details  # Import save_note, store_order, and save_table_order from views

urlpatterns = [
    path('', views.index, name='index'),
    path('profile/', views.profile, name='profile'),
    path('settings/', views.settings, name='settings'),
    path('inventory/', views.inventory, name='inventory'),
    path('portfolio/', views.portfolio, name='portfolio'),
    path('about-us/', views.about_us, name='about_us'),
    path('contact-us/', views.contact_us, name='contact_us'),
    path('customize/', views.customize, name='customize'),
    path('Privacy_Policy/', views.Privacy_Policy, name='Privacy_Policy'),
    path('menu/', views.menu, name='menu'),
    path('Refund/', views.Refund, name='Refund'),
    path('Terms_Conditions/', views.Terms_Conditions, name='Terms_Conditions'),
    path('tabel/', views.table_view, name='tabel'),
    path('tables/', views.table_view, name='tables'),
    # path('tables/', table_view, name='table_view'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('place-order/', views.place_order, name='place_order'),  # Ensure place_order is handled here
    # path('save-order/', views.place_order, name='save_order'),  # **Added line**
    # Remove the TableOrder related URL
    # path('view-table-orders/<int:table_number>/', views.view_table_orders, name='view_table_orders'),
    path('release-table/', views.release_table, name='release_table'),
    # Remove the following line to avoid duplicate API routes
    # path('api/', api.urls),  # Include API urls here
    path('book-table/<int:table_id>/', views.book_table, name='book_table'),
    path('release-table/<int:table_id>/', views.release_table, name='release_table'),
    path('table-status/', views.get_table_status, name='table_status'),
    path('order-data/', views.order_data, name='order_data'),
    path('order-details/<int:pk>/', views.order_details, name='order_details'),
    path('order-details/<str:order_id>/', views.order_details, name='order_details'),  # Add this line
    path('delete-order/<str:order_id>/', views.delete_order, name='delete_order'),
    path('verify-password/', views.verify_password, name='verify_password'),
    # path('save-note/', save_note, name='save_note'),  # Ensure save_note is handled here
    path('send-order/', views.send_order, name='send_order'),  # Ensure send_order is handled here
    path('store-order/', store_order, name='store_order'),  # Ensure store_order is handled here
    path('ko/', views.ko_view, name='ko'),  # Add ko view
    # path('save-order-status/<int:order_id>/', views.update_ko_order_status, name='update_ko_order_status'),
    path('fetch-order-data/', views.fetch_order_data, name='fetch_order_data'),  # Add fetch_order_data view
    path('get-order-details/', views.get_order_details, name='get_order_details'),  # Ensure this line is present
    path('table-order/<int:table_number>/', views.table_order_view, name='table_order'),
    path('table-order/create/', views.create_table_order, name='create_table_order'),
    path('table-order/<str:table_order_id>/update/', views.update_table_order, name='update_table_order'),
    path('table-order/<str:table_order_id>/delete/', views.delete_table_order, name='delete_table_order'),
    path('save-table-order/', save_table_order, name='save_table_order'),  # Add this line
    path('api/table-order/<int:table_id>/', get_table_order_details, name='get_table_order_details'),  # Add this line
]

urlpatterns += [
    # path('api/get-table-order-details/<int:table_id>/', views.get_table_order_details, name='get_table_order_details'),
    # Remove or comment out TableOrder related URLs
    # path('table-order/<int:table_id>/', views.table_order_view, name='table_order_view'),
]