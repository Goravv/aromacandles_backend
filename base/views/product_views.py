from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from base.models import Product, Review
from base.serializers import ProductSerializer
from django.shortcuts import get_object_or_404




@api_view(['GET'])
def getProducts(request):
    query = request.query_params.get('keyword', '')
    products = Product.objects.filter(name__icontains=query).order_by('-createdAt')

    page = request.query_params.get('page', 1)
    paginator = Paginator(products, 4)

    try:
        products = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        products = paginator.page(1)

    serializer = ProductSerializer(products, many=True)
    return Response({
        'products': serializer.data,
        'page': int(page),
        'pages': paginator.num_pages
    })


@api_view(['GET'])
def getTopProducts(request):
    products = Product.objects.filter(rating__gte=4).order_by('-rating')[0:5]
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)



@api_view(['GET'])
def getProduct(request, pk):
    try:
        product = Product.objects.get(_id=pk)
        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def createProduct(request):
    user = request.user

    product = Product.objects.create(
        user=user,
        name='Sample Name',
        price=0,
        brand='Sample Brand',
        countInStock=0,
        category='Sample Category',
        description=''
    )

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateProduct(request, pk):
    try:
        product = Product.objects.get(_id=pk)
        data = request.data

        for field in ['name', 'price', 'brand', 'countInStock', 'category', 'description']:
            setattr(product, field, data.get(field, getattr(product, field)))

        product.save()
        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)

    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProduct(request, pk):
    try:
        product = Product.objects.get(_id=pk)
        product.delete()
        return Response({'detail': 'Product deleted successfully'})
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['POST'])
def uploadImage(request):
    data = request.data

    product_id = data['product_id']
    product = Product.objects.get(_id=product_id)

    product.image = request.FILES.get('image')
    product.save()

    return Response('Image was uploaded')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createProductReview(request, pk):
    user = request.user
    product = get_object_or_404(Product, _id=pk)
    data = request.data

    if product.review_set.filter(user=user).exists():
        return Response({'detail': 'Product already reviewed'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rating = float(data.get('rating', 0))
    except (ValueError, TypeError):
        return Response({'detail': 'Invalid rating value'}, status=status.HTTP_400_BAD_REQUEST)

    if rating <= 0:
        return Response({'detail': 'Please select a valid rating'}, status=status.HTTP_400_BAD_REQUEST)

    Review.objects.create(
        user=user,
        product=product,
        name=user.first_name,
        rating=rating,
        comment=data.get('comment', '')
    )

    reviews = product.review_set.all()
    product.numReviews = reviews.count()
    product.rating = sum([r.rating for r in reviews]) / reviews.count()
    product.save()

    return Response({'detail': 'Review added successfully'})
