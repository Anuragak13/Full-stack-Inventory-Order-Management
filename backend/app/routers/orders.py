from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models import Order, OrderItem, Product, Customer
from ..schemas import OrderCreate, OrderOut, OrderItemDetailOut

router = APIRouter(prefix="/orders", tags=["Orders"])


def build_order_out(order: Order) -> OrderOut:
    items = []
    for item in order.items:
        items.append(OrderItemDetailOut(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_sku=item.product.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=round(item.quantity * item.unit_price, 2)
        ))
    return OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name,
        customer_email=order.customer.email,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items
    )


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {payload.customer_id} not found"
        )

    product_ids = [item.product_id for item in payload.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate products in order. Combine quantities instead."
        )

    validated_items = []
    total_amount = 0.0

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Requested: {item.quantity}, Available: {product.quantity}"
            )
        
        subtotal = round(product.price * item.quantity, 2)
        total_amount += subtotal
        validated_items.append((product.id, item.quantity, product.price, product.name))

    new_order = Order(
        customer_id=payload.customer_id,
        total_amount=round(total_amount, 2)
    )
    db.add(new_order)
    db.flush()

    for p_id, qty, unit_price, p_name in validated_items:
        affected_rows = db.query(Product).filter(
            Product.id == p_id,
            Product.quantity >= qty
        ).update({Product.quantity: Product.quantity - qty}, synchronize_session=False)

        if not affected_rows:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock allocation conflict encountered for '{p_name}'. Please refresh your checkout."
            )

        db.add(OrderItem(
            order_id=new_order.id,
            product_id=p_id,
            quantity=qty,
            unit_price=unit_price
        ))

    db.commit()

    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product)
        )
        .filter(Order.id == new_order.id)
        .first()
    )
    return build_order_out(order)


@router.get("/", response_model=List[OrderOut])
def get_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product)
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return [build_order_out(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product)
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return build_order_out(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
        
    for item in order.items:
        item.product.quantity += item.quantity

    db.delete(order)
    db.commit()