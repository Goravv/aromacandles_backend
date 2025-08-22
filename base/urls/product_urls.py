from django.urls import path
from base.views import product_views as views

urlpatterns = [
    # Product CRUD
    path('', views.getProducts, name="products"),
    path('create/', views.createProduct, name="product-create"),
    path('upload/', views.uploadImage, name="image-upload"),
    path('top/', views.getTopProducts, name='top-products'),

    # Single Product
    path('<str:pk>/', views.getProduct, name="product"),
    path('update/<str:pk>/', views.updateProduct, name="product-update"),
    path('delete/<str:pk>/', views.deleteProduct, name="product-delete"),

    # Reviews
    path('<str:pk>/reviews/', views.createProductReview, name="create-review"),

    # Extra Images
    path('<str:pk>/images/add/', views.addProductImage, name="add-product-image"),
    path('<str:pk>/images/<int:image_id>/delete/', views.deleteProductImage, name="delete-product-image"),

    # Colors
    path('<str:pk>/colors/add/', views.addProductColor, name="add-product-color"),
    path('<str:pk>/colors/<int:color_id>/delete/', views.deleteProductColor, name="delete-product-color"),
]

product_urls = urlpatterns
