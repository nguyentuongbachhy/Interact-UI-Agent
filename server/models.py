# Import all models to ensure SQLAlchemy can resolve relationships
from auth.models import User
from products.models import Product

# Make sure both models are available for relationship resolution
__all__ = ["User", "Product"]