from django.urls import path
from .views import list_categories, list_items

urlpatterns = [
    path('furniture/categories/', list_categories, name='furniture_categories'),
    path('furniture/items/', list_items, name='furniture_items'),
]
