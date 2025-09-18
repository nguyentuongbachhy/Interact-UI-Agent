from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, and_, or_
from fastapi import HTTPException, status
from typing import List
from .models import Product
from .schemas import CreateProductRequest, UpdateProductRequest, SearchProductsRequest
from auth.models import User
import math

class ProductService:
    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user

    def create_product(self, request: CreateProductRequest) -> Product:
        product = Product(
            name=request.name,
            description=request.description,
            price=request.price,
            quantity=request.quantity,
            category=request.category,
            image_url=request.image_url,
            user_id=self.current_user.id
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def get_products(self, request: SearchProductsRequest) -> dict:
        query = self.db.query(Product).filter(Product.user_id == self.current_user.id)
        
        if request.query:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{request.query}%"),
                    Product.description.ilike(f"%{request.query}%")
                )
            )
        
        if request.filters:
            if request.filters.category:
                query = query.filter(Product.category == request.filters.category)
            if request.filters.min_price is not None:
                query = query.filter(Product.price >= request.filters.min_price)
            if request.filters.max_price is not None:
                query = query.filter(Product.price <= request.filters.max_price)
            if request.filters.in_stock is not None:
                if request.filters.in_stock:
                    query = query.filter(Product.quantity > 0)
                else:
                    query = query.filter(Product.quantity == 0)
        
        total = query.count()
        
        if request.sort_order == "asc":
            query = query.order_by(asc(getattr(Product, request.sort_by)))
        else:
            query = query.order_by(desc(getattr(Product, request.sort_by)))
        
        offset = (request.page - 1) * request.limit
        products = query.offset(offset).limit(request.limit).all()
        
        total_pages = math.ceil(total / request.limit)
        
        return {
            "products": products,
            "total": total,
            "page": request.page,
            "limit": request.limit,
            "total_pages": total_pages
        }

    def get_product(self, product_id: int) -> Product:
        product = self.db.query(Product).filter(
            and_(Product.id == product_id, Product.user_id == self.current_user.id)
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product

    def update_product(self, product_id: int, request: UpdateProductRequest) -> Product:
        product = self.get_product(product_id)
        
        for field, value in request.dict(exclude_unset=True).items():
            setattr(product, field, value)
        
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        self.db.delete(product)
        self.db.commit()

    def get_categories(self) -> List[dict]:
        categories = self.db.query(
            Product.category,
            func.count(Product.id).label("product_count")
        ).filter(
            and_(Product.user_id == self.current_user.id, Product.category.isnot(None))
        ).group_by(Product.category).all()
        
        return [
            {
                "id": str(hash(cat.category)),
                "name": cat.category,
                "description": None,
                "product_count": cat.product_count
            }
            for cat in categories
        ]