from django.urls import path, include
from . import views  # Updated import
from .views import table_view, store_order, save_table_order, get_table_order_details  # Import necessary views

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
    path('dashboard/', views.dashboard, name='dashboard'),
    path('place-order/', views.place_order, name='place_order'),
    path('save-order/', views.save_order, name='save_order'),
    path('release-table/', views.release_table, name='release_table'),
    path('book-table/<int:table_id>/', views.book_table, name='book_table'),
    path('release-table/<int:table_id>/', views.release_table, name='release_table'),
    path('table-status/', views.get_table_status, name='table_status'),
    path('order-data/', views.order_data, name='order_data'),
    path('order-details/<int:pk>/', views.order_details, name='order_details'),
    path('order-details/<str:order_id>/', views.order_details, name='order_details'),
    path('delete-order/<str:order_id>/', views.delete_order, name='delete_order'),
    path('verify-password/', views.verify_password, name='verify_password'),
    path('send-order/', views.send_order, name='send_order'),
    path('store-order/', store_order, name='store_order'),
    path('ko/', views.ko_view, name='ko'),
    path('fetch-order-data/', views.fetch_order_data, name='fetch_order_data'),
    path('get-order-details/', views.get_order_details, name='get_order_details'),
    path('table-order/<int:table_number>/', views.table_order_view, name='table_order'),
    path('table-order/create/', views.create_table_order, name='create_table_order'),
    path('table-order/<str:table_order_id>/update/', views.update_table_order, name='update_table_order'),
    path('table-order/<str:table_order_id>/delete/', views.delete_table_order, name='delete_table_order'),
    path('save-table-order/', save_table_order, name='save_table_order'),
    path('api/table-order/<int:table_id>/', get_table_order_details, name='get_table_order_details'),
]

urlpatterns += [
    # ...existing additional URL patterns...
]