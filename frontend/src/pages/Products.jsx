import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null); // Track which product id is being edited

    const [form, setForm] = useState({
        name: "",
        sku: "",
        price: "",
        quantity: "",
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products");
            setProducts(res.data);
        } catch (err) {
            toast.error("Failed to load products");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Load product data into form and switch to Edit Mode
    const startEdit = (product) => {
        setEditingId(product.id);
        setForm({
            name: product.name,
            sku: product.sku, // Keep it for display, backend ignores updates to SKU anyway
            price: product.price.toString(),
            quantity: product.quantity.toString(),
        });
    };

    // Exit Edit Mode and flush inputs
    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            name: "",
            sku: "",
            price: "",
            quantity: "",
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic presence validation check
        if (!form.name.trim() || !form.price || form.quantity === "" || (!editingId && !form.sku.trim())) {
            toast.error("All required fields must be filled out");
            return;
        }

        if (Number(form.price) <= 0) {
            toast.error("Price must be greater than 0");
            return;
        }

        if (Number(form.quantity) < 0) {
            toast.error("Quantity cannot be negative");
            return;
        }

        setLoading(true);

        try {
            if (editingId) {
                // Execute PUT mutation for existing items
                await api.put(`/products/${editingId}`, {
                    name: form.name.trim(),
                    price: Number(form.price),
                    quantity: Number(form.quantity),
                });
                toast.success("Product updated successfully");
            } else {
                // Execute POST mutation for new records
                await api.post("/products", {
                    name: form.name.trim(),
                    sku: form.sku.trim().toUpperCase(),
                    price: Number(form.price),
                    quantity: Number(form.quantity),
                });
                toast.success("Product added successfully");
            }

            cancelEdit(); // Reset form and reset state back to Add mode
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) return;

        try {
            await api.delete(`/products/${id}`);
            toast.success("Product deleted");
            if (editingId === id) cancelEdit(); // Reset form if active selection was deleted
            fetchProducts();
        } catch (err) {
            toast.error(
                err.response?.data?.detail ||
                "Cannot delete product linked to orders"
            );
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Products</h1>
                {editingId && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                        Editing Active Product
                    </span>
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className={`p-6 rounded-xl shadow mb-6 border transition-all duration-200 bg-white ${editingId ? "border-amber-400 ring-2 ring-amber-400/10" : "border-transparent"
                    }`}
            >
                <div className="grid md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Name</label>
                        <input
                            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Stock SKU</label>
                        <input
                            className="border p-3 rounded-lg w-full disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed outline-none"
                            placeholder="SKU"
                            value={form.sku}
                            disabled={!!editingId} // SKU identity is immutable on update endpoints
                            onChange={(e) => setForm({ ...form, sku: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unit Price (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="Price"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Available Quantity</label>
                        <input
                            type="number"
                            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="Quantity"
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 ${editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {loading ? "Processing..." : editingId ? "Update Product" : "Add Product"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="bg-white p-5 rounded-xl shadow">
                {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        No products available.
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {products.map((p) => (
                            <div
                                key={p.id}
                                className="py-4 flex justify-between items-center first:pt-0 last:pb-0"
                            >
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-gray-800">
                                            {p.name}
                                        </h3>
                                        {p.quantity <= 5 && (
                                            <span className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-0.5 rounded text-xs font-semibold">
                                                Low Stock
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 font-mono mt-0.5">
                                        SKU: {p.sku}
                                    </p>
                                    <p className="text-green-600 font-semibold mt-1">
                                        ₹{Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-sm font-medium ${p.quantity <= 5 ? "text-red-500" : "text-gray-600"}`}>
                                        Qty Available: {p.quantity}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEdit(p)}
                                        className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 hover:text-white transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteProduct(p.id)}
                                        className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}