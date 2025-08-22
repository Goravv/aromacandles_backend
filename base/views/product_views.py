from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import get_object_or_404

from base.models import Product, Review, ProductImage, ProductColor
from base.serializers import ProductSerializer, ProductImageSerializer, ProductColorSerializer


# ---------------------------
# Products
# ---------------------------
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
    product = get_object_or_404(Product, _id=pk)
    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


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
    product = get_object_or_404(Product, _id=pk)
    data = request.data

    # 1. Update basic product fields
    for field in ['name', 'price', 'brand', 'countInStock', 'category', 'description']:
        if field in data:
            setattr(product, field, data[field])
    product.save()

    # 2. Handle colors (replace all with new ones if provided)
    if 'colors' in data:
        ProductColor.objects.filter(product=product).delete()  # remove old colors
        for color in data['colors']:
            name = color.get('name')
            rgb = color.get('rgb')
            if name and rgb:
                ProductColor.objects.create(product=product, name=name, rgb=rgb)

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProduct(request, pk):
    product = get_object_or_404(Product, _id=pk)
    product.delete()
    return Response({'detail': 'Product deleted successfully'})


# ---------------------------
# Product Main Image Upload
# ---------------------------
@api_view(['POST'])
def uploadImage(request):
    data = request.data
    product_id = data['product_id']
    product = get_object_or_404(Product, _id=product_id)

    product.image = request.FILES.get('image')
    product.save()

    return Response('Image was uploaded')


# ---------------------------
# Product Reviews
# ---------------------------
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


# ---------------------------
# Extra Product Images
# ---------------------------
@api_view(['POST'])
@permission_classes([IsAdminUser])
def addProductImage(request, pk):
    """Add extra image for a product"""
    product = get_object_or_404(Product, _id=pk)

    if 'image' not in request.FILES:
        return Response({'detail': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILES['image']
    product_image = ProductImage.objects.create(product=product, image=image)

    serializer = ProductImageSerializer(product_image, many=False)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProductImage(request, pk, image_id):
    product = get_object_or_404(Product, _id=pk)
    image = get_object_or_404(ProductImage, id=image_id, product=product)
    image.delete()
    return Response({'detail': 'Image deleted successfully'})


# ---------------------------
# Product Colors
# ---------------------------
@api_view(['POST'])
@permission_classes([IsAdminUser])
def addProductColor(request, pk):
    """Add a color option for a product"""
    product = get_object_or_404(Product, _id=pk)
    data = request.data

    name = data.get('name')
    rgb = data.get('rgb')

    if not name or not rgb:
        return Response({'detail': 'Name and RGB value are required'}, status=status.HTTP_400_BAD_REQUEST)

    color = ProductColor.objects.create(product=product, name=name, rgb=rgb)
    serializer = ProductColorSerializer(color, many=False)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProductColor(request, pk, color_id):
    product = get_object_or_404(Product, _id=pk)
    color = get_object_or_404(ProductColor, id=color_id, product=product)
    color.delete()
    return Response({'detail': 'Color deleted successfully'})
