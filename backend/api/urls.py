from django.urls import path
from .views import check_email, login_user, signup_user, user_likes, get_liked_properties, get_properties, get_listed_properties, manage_bookings, reschedule_booking, update_profile, migrate_coords

urlpatterns = [
    path('check-email/', check_email, name='check_email'),
    path('login/', login_user, name='login'),
    path('signup/', signup_user, name='signup'),
    path('profile/update/', update_profile, name='update_profile'),
    path('likes/', user_likes, name='user_likes'),
    path('liked-properties/', get_liked_properties, name='get_liked_properties'),
    path('properties/', get_properties, name='get_properties'),
    path('listed-properties/', get_listed_properties, name='get_listed_properties'),
    path('bookings/', manage_bookings, name='manage_bookings'),
    path('bookings/<int:booking_id>/reschedule/', reschedule_booking, name='reschedule_booking'),
    path('migrate-coords/', migrate_coords, name='migrate_coords'),
]