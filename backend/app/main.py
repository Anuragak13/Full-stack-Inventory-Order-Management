import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import engine, Base, get_db
from .models import Product, Customer, Order
from .schemas import DashboardOut, ProductOut
from .routers import products, customers, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Production-ready API for managing products, customers, and orders",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Inventory & Order Management API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.get("/dashboard", response_model=DashboardOut, tags=["Dashboard"])
def get_dashboard(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()

    total_revenue = (
        db.query(
            func.coalesce(func.sum(Order.total_amount), 0)
        ).scalar()
    )

    total_inventory_value = (
        db.query(
            func.coalesce(
                func.sum(Product.price * Product.quantity),
                0
            )
        ).scalar()
    )

    low_stock = (
        db.query(Product)
        .filter(Product.quantity <= 5)
        .order_by(Product.quantity)
        .all()
    )

    return DashboardOut(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_inventory_value=total_inventory_value,
        low_stock_products=[
            ProductOut.model_validate(p)
            for p in low_stock
        ],
    )