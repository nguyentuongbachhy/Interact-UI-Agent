from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func, and_, or_
from fastapi import HTTPException, status, UploadFile
from typing import List, Dict, Any
from datetime import datetime
import uuid
import shutil
from pathlib import Path

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
        
        if product.image_url and product.image_url.startswith("/uploads/"):
            image_path = Path("." + product.image_url)
            if image_path.exists():
                image_path.unlink()
        
        self.db.delete(product)
        self.db.commit()

    def bulk_update_products(self, ids: List[str], updates: Dict[str, Any]) -> List[Product]:
        id_ints = [int(id) for id in ids]
        products = self.db.query(Product).filter(
            and_(Product.id.in_(id_ints), Product.user_id == self.current_user.id)
        ).all()
        
        for product in products:
            for field, value in updates.items():
                if hasattr(product, field):
                    setattr(product, field, value)
        
        self.db.commit()
        return products

    def bulk_update_price(self, ids: List[str], price_multiplier: float) -> List[Product]:
        id_ints = [int(id) for id in ids]
        products = self.db.query(Product).filter(
            and_(Product.id.in_(id_ints), Product.user_id == self.current_user.id)
        ).all()
        
        for product in products:
            product.price = round(product.price * price_multiplier, 2)
        
        self.db.commit()
        return products

    def get_product_stats(self) -> Dict[str, Any]:
        query = self.db.query(Product).filter(Product.user_id == self.current_user.id)
        
        total = query.count()
        in_stock = query.filter(Product.quantity > 0).count()
        out_of_stock = query.filter(Product.quantity == 0).count()
        
        total_value = query.with_entities(func.sum(Product.price * Product.quantity)).scalar() or 0
        avg_price = query.with_entities(func.avg(Product.price)).scalar() or 0
        
        categories_count = self.db.query(Product.category).filter(
            and_(Product.user_id == self.current_user.id, Product.category.isnot(None))
        ).distinct().count()
        
        return {
            "total": total,
            "in_stock": in_stock,
            "out_of_stock": out_of_stock,
            "total_value": float(total_value),
            "average_price": float(avg_price),
            "categories_count": categories_count
        }

    def get_products_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Product]:
        return self.db.query(Product).filter(
            and_(
                Product.user_id == self.current_user.id,
                Product.created_at >= start_date,
                Product.created_at <= end_date
            )
        ).order_by(desc(Product.created_at)).all()

    def get_top_selling_products(self, limit: int = 10) -> List[Product]:
        return self.db.query(Product).filter(
            Product.user_id == self.current_user.id
        ).order_by(desc(Product.quantity)).limit(limit).all()

    def get_low_stock_products(self, threshold: int = 5) -> List[Product]:
        return self.db.query(Product).filter(
            and_(
                Product.user_id == self.current_user.id,
                Product.quantity <= threshold,
                Product.quantity > 0
            )
        ).order_by(asc(Product.quantity)).all()

    def upload_product_image(self, product_id: int, file: UploadFile) -> str:
        product = self.get_product(product_id)
        
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        upload_dir = Path("uploads/products")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
        filename = f"{product_id}_{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        image_url = f"/uploads/products/{filename}"
        
        if product.image_url and product.image_url.startswith("/uploads/"):
            old_path = Path("." + product.image_url)
            if old_path.exists():
                old_path.unlink()
        
        product.image_url = image_url
        self.db.commit()
        
        return image_url

    def delete_product_image(self, product_id: int) -> None:
        product = self.get_product(product_id)
        
        if product.image_url and product.image_url.startswith("/uploads/"):
            file_path = Path("." + product.image_url)
            if file_path.exists():
                file_path.unlink()
            product.image_url = None
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