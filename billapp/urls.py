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
    path('menu/', views.menu, name='menu'),
    path("__reload__/", include("django_browser_reload.urls")),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('place-order/', views.place_order, name='place_order'),
    path('check-payment-status/', views.check_payment_status, name='check_payment_status'),
]