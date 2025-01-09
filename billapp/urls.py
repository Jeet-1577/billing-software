from django.urls import path, include
from . import views

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
    path('tabel/', views.tabel, name='tabel'),
    path("__reload__/", include("django_browser_reload.urls")),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('place-order/', views.place_order, name='place_order'),
    path('save-order/', views.save_order, name='save_order'),
    path('view-table-orders/<int:table_number>/', views.view_table_orders, name='view_table_orders'),
    path('release-table/', views.release_table, name='release_table'),
]