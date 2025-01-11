from django.urls import path, include
from . import views
from .views import table_view
from .api import api

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
    path("__reload__/", include("django_browser_reload.urls")),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('place-order/', views.place_order, name='place_order'),
    path('save-order/', views.save_order, name='save_order'),
    path('view-table-orders/<int:table_number>/', views.view_table_orders, name='view_table_orders'),
    path('release-table/', views.release_table, name='release_table'),
    path('api/', api.urls),  # Include API urls here
    path('book-table/<int:table_id>/', views.book_table, name='book_table'),
    path('release-table/<int:table_id>/', views.release_table, name='release_table'),
    path('table-status/', views.get_table_status, name='table_status'),
    path('order-data/', views.order_data, name='order_data'),
    path('order-details/<str:order_id>/', views.order_details, name='order_details'),
    path('delete-order/<str:order_id>/', views.delete_order, name='delete_order'),
    path('verify-password/', views.verify_password, name='verify_password'),
]