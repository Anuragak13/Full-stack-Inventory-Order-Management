import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        customer_id: "",
        product_id: "",
        quantity: "",
    });

    const fetchData = async () => {
        try {
            const [orderRes, customerRes, productRes] = await Promise.all([
                api.get("/orders"),
                api.get("/customers"),
                api.get("/products"),
            ]);

            setOrders(orderRes.data);
            setCustomers(customerRes.data);
            setProducts(productRes.data);
        } catch (err) {
            toast.error("Failed to load data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const createOrder = async (e) => {
        e.preventDefault();

        if (
            !form.customer_id ||
            !form.product_id ||
            !form.quantity
        ) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await api.post("/orders", {
                customer_id: Number(form.customer_id),
                items: [
                    {
                        product_id: Number(form.product_id),
                        quantity: Number(form.quantity),
                    },
                ],
            });

            toast.success("Order Created Successfully");

            setForm({
                customer_id: "",
                product_id: "",
                quantity: "",
            });

            fetchData();
        } catch (err) {
            toast.error(
                err.response?.data?.detail ||
                "Failed to create order"
            );
        }
    };

    const deleteOrder = async (id) => {
        if (!window.confirm("Delete this order?")) return;

        try {
            await api.delete(`/orders/${id}`);
            toast.success("Order Deleted");
            fetchData();
        } catch (err) {
            toast.error(
                err.response?.data?.detail ||
                "Unable to delete order"
            );
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">
                Orders
            </h1>

            <form
                onSubmit={createOrder}
                className="bg-white p-5 rounded-xl shadow mb-6"
            >
                <h2 className="text-xl font-semibold mb-4">
                    Create New Order
                </h2>

                <div className="grid md:grid-cols-3 gap-3">

                    <select
                        className="border p-2 rounded"
                        value={form.customer_id}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                customer_id: e.target.value,
                            })
                        }
                    >
                        <option value="">Select Customer</option>

                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.full_name}
                            </option>
                        ))}
                    </select>


                    <select
                        className="border p-2 rounded"
                        value={form.product_id}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                product_id: e.target.value,
                            })
                        }
                    >
                        <option value="">Select Product</option>

                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.quantity})
                            </option>
                        ))}
                    </select>


                    <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        className="border p-2 rounded"
                        value={form.quantity}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                quantity: e.target.value,
                            })
                        }
                    />
                </div>

                <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded mt-4 hover:bg-purple-700"
                >
                    Create Order
                </button>
            </form>

            {/* Orders List */}
            <div className="bg-white p-5 rounded-xl shadow">
                <h2 className="text-xl font-semibold mb-4">
                    Order History
                </h2>

                {orders.length === 0 ? (
                    <p className="text-gray-500">
                        No orders found.
                    </p>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            className="flex justify-between items-center border-b py-4"
                        >
                            <div>
                                <strong className="text-lg">
                                    Order #{order.id}
                                </strong>

                                <br />

                                Customer: {order.customer_name}

                                <br />

                                Email: {order.customer_email}

                                <br />

                                Total Amount: ₹{order.total_amount}

                                <br />

                                Date:{" "}
                                {new Date(
                                    order.created_at
                                ).toLocaleString()}
                            </div>

                            <button
                                onClick={() => deleteOrder(order.id)}
                                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}