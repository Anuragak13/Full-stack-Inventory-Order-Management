from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    quantity: int = 0

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()

    @field_validator("sku")
    @classmethod
    def sku_not_empty(cls, v):
        if not v.strip():
            raise ValueError("SKU cannot be empty")
        return v.strip().upper()

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return round(v, 2)

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v):
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError("Product name cannot be empty")
            return v.strip()
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0")
        return round(v, 2) if v is not None else v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    quantity: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}



class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class CustomerOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}



class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must contain at least one item")
        return v


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


class OrderItemDetailOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    total_amount: float
    created_at: datetime
    items: List[OrderItemDetailOut] = []

    model_config = {"from_attributes": True}



class DashboardOut(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: float
    total_inventory_value: float
    low_stock_products: List[ProductOut]