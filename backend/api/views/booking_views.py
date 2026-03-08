from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from api.models import Property, Booking
from api.serializers import BookingSerializer

@api_view(['GET', 'POST'])
def manage_bookings(request):
    """
    GET: List all bookings for a specific user (query param email).
    POST: Create a new booking.
    """
    if request.method == 'GET':
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email query param required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            bookings = Booking.objects.filter(user=user).select_related('property').order_by('-created_at')
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        email = request.data.get('email')
        property_id = request.data.get('property_id')
        date = request.data.get('date')
        time = request.data.get('time')

        if not all([email, property_id, date, time]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                
            property_obj = Property.objects.get(id=property_id)
            
            booking = Booking.objects.create(
                user=user,
                property=property_obj,
                date=date,
                time=time,
                status='upcoming'
            )
            
            serializer = BookingSerializer(booking, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def reschedule_booking(request, booking_id):
    """
    Updates the date and time of an existing booking.
    """
    date = request.data.get('date')
    time = request.data.get('time')
    email = request.data.get('email')

    if not all([date, time, email]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        booking = Booking.objects.get(id=booking_id, user=user)
        booking.date = date
        booking.time = time
        booking.save()
        
        serializer = BookingSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found or not owned by user"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
