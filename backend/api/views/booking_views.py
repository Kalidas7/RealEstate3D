from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.models import Property, Booking
from api.serializers import BookingSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_bookings(request):
    """
    GET: List all bookings for the authenticated user.
    POST: Create a new booking.
    """
    user = request.user

    if request.method == 'GET':
        try:
            bookings = Booking.objects.filter(user=user).select_related('property').order_by('-created_at')
            serializer = BookingSerializer(bookings, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        property_id = request.data.get('property_id')
        date = request.data.get('date')
        time = request.data.get('time')

        if not all([property_id, date, time]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
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

        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reschedule_booking(request, booking_id):
    """
    Updates the date and time of an existing booking owned by the authenticated user.
    """
    date = request.data.get('date')
    time = request.data.get('time')

    if not all([date, time]):
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        booking.date = date
        booking.time = time
        booking.save()

        serializer = BookingSerializer(booking, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found or not owned by user"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
