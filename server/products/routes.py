from fastapi import APIRouter, Depends, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
from auth import get_current_user, User
from .schemas import (
    CreateProductRequest,
    UpdateProductRequest, 
    ProductResponse,
    ProductsResponse,
    SearchProductsRequest,
    SearchFilters,
    BulkUpdateRequest,
    BulkUpdatePriceRequest,
    ProductStatsResponse,
    ImportProductsResponse,
    ImageUploadResponse
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

@router.put("/products/bulk-update")
def bulk_update_products(
    request: BulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    products = service.bulk_update_products(request.ids, request.updates)
    
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
        for p in products
    ]
    
    return {
        "data": products_response,
        "message": "Products updated successfully",
        "success": True
    }

@router.put("/products/bulk-update-price")
def bulk_update_price(
    request: BulkUpdatePriceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    products = service.bulk_update_price(request.ids, request.price_multiplier)
    
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
        for p in products
    ]
    
    return {
        "data": products_response,
        "message": "Product prices updated successfully",
        "success": True
    }

@router.get("/products/stats")
def get_product_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    stats = service.get_product_stats()
    
    return {
        "data": ProductStatsResponse(**stats),
        "message": "Product statistics retrieved successfully",
        "success": True
    }

@router.get("/products/by-date")
def get_products_by_date_range(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    products = service.get_products_by_date_range(start_date, end_date)
    
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
        for p in products
    ]
    
    return {
        "data": products_response,
        "message": "Products by date range retrieved successfully",
        "success": True
    }

@router.get("/products/top-selling")
def get_top_selling_products(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    products = service.get_top_selling_products(limit)
    
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
        for p in products
    ]
    
    return {
        "data": products_response,
        "message": "Top selling products retrieved successfully",
        "success": True
    }

@router.get("/products/low-stock")
def get_low_stock_products(
    threshold: int = Query(5, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    products = service.get_low_stock_products(threshold)
    
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
        for p in products
    ]
    
    return {
        "data": products_response,
        "message": "Low stock products retrieved successfully",
        "success": True
    }

@router.get("/products/export")
def export_products(
    format: str = Query("csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if format == "csv":
        content = "id,name,description,price,quantity,category\n"
        media_type = "text/csv"
        filename = "products.csv"
    else:
        content = "Export functionality not implemented"
        media_type = "application/octet-stream" 
        filename = "products.xlsx"
    
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/products/import")
def import_products(
    file: UploadFile = File(...),
    skip_duplicates: bool = Query(False),
    update_existing: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "data": ImportProductsResponse(
            imported=0,
            updated=0,
            skipped=0,
            errors=["Import functionality not implemented"]
        ),
        "message": "Import completed",
        "success": True
    }

@router.post("/products/{product_id}/image")
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    image_url = service.upload_product_image(product_id, file)
    
    return {
        "data": ImageUploadResponse(image_url=image_url),
        "message": "Product image uploaded successfully",
        "success": True
    }

@router.delete("/products/{product_id}/image")
def delete_product_image(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ProductService(db, current_user)
    service.delete_product_image(product_id)
    
    return {
        "data": None,
        "message": "Product image deleted successfully",
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