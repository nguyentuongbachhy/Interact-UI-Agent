from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CreateProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    quantity: int
    category: Optional[str] = None
    image_url: Optional[str] = None

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    quantity: int
    category: Optional[str] = None
    image_url: Optional[str] = None
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SearchFilters(BaseModel):
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    in_stock: Optional[bool] = None

class SearchProductsRequest(BaseModel):
    query: Optional[str] = None
    filters: Optional[SearchFilters] = None
    page: Optional[int] = 1
    limit: Optional[int] = 12
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"

class ProductsResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class Category(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    product_count: int