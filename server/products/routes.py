from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from auth import get_current_user, User
from .schemas import (
    CreateProductRequest,
    UpdateProductRequest, 
    ProductResponse,
    ProductsResponse,
    SearchProductsRequest,
    SearchFilters,
    Category
)
from .service import ProductService

router = APIRouter(tags=["products"])

@router.post("/products")
def create_product(
    request: CreateProductRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    product = service.create_product(request)
    product_data = ProductResponse(
        id=str(product.id),
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        category=product.category,
        image_url=product.image_url,
        user_id=str(product.user_id),
        created_at=product.created_at,
        updated_at=product.updated_at
    )
    
    return {
        "data": product_data,
        "message": "Product created successfully",
        "success": True
    }

@router.get("/products")
def get_products(
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    in_stock: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    filters = SearchFilters(
        category=category,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock
    )
    
    search_request = SearchProductsRequest(
        query=query,
        filters=filters,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    service = ProductService(db, current_user)
    result = service.get_products(search_request)
    
    products_response = [
        ProductResponse(
            id=str(p.id),
            name=p.name,
            description=p.description,
            price=p.price,
            quantity=p.quantity,
            category=p.category,
            image_url=p.image_url,
            user_id=str(p.user_id),
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in result["products"]
    ]
    
    products_data = ProductsResponse(
        products=products_response,
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"]
    )
    
    return {
        "data": products_data,
        "message": "Products retrieved successfully",
        "success": True
    }

@router.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    product = service.get_product(product_id)
    product_data = ProductResponse(
        id=str(product.id),
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        category=product.category,
        image_url=product.image_url,
        user_id=str(product.user_id),
        created_at=product.created_at,
        updated_at=product.updated_at
    )
    
    return {
        "data": product_data,
        "message": "Product retrieved successfully",
        "success": True
    }

@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    request: UpdateProductRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    product = service.update_product(product_id, request)
    product_data = ProductResponse(
        id=str(product.id),
        name=product.name,
        description=product.description,
        price=product.price,
        quantity=product.quantity,
        category=product.category,
        image_url=product.image_url,
        user_id=str(product.user_id),
        created_at=product.created_at,
        updated_at=product.updated_at
    )
    
    return {
        "data": product_data,
        "message": "Product updated successfully",
        "success": True
    }

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    service.delete_product(product_id)
    return {
        "data": None,
        "message": "Product deleted successfully",
        "success": True
    }

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    categories_data = service.get_categories()
    return {
        "data": categories_data,
        "message": "Categories retrieved successfully",
        "success": True
    }