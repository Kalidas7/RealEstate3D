from django.urls import path
from .views import check_email, login_user, signup_user, user_likes, get_properties, manage_bookings, reschedule_booking

urlpatterns = [
    path('check-email/', check_email, name='check_email'),
    path('login/', login_user, name='login'),
    path('signup/', signup_user, name='signup'),
    path('likes/', user_likes, name='user_likes'),
    path('properties/', get_properties, name='get_properties'),
    path('bookings/', manage_bookings, name='manage_bookings'),
    path('bookings/<int:booking_id>/reschedule/', reschedule_booking, name='reschedule_booking'),
]