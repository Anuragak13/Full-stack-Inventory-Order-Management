import { useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

export default function Customers() {
    const [customers, setCustomers] = useState([]);

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
    });

    const fetchCustomers = async () => {
        try {
            const res = await api.get("/customers");
            setCustomers(res.data);
        } catch (err) {
            toast.error("Failed to load customers");
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Client-Side input validation guard checks
        if (!form.full_name.trim()) {
            return toast.error("Full Name field is required");
        }
        if (!form.email.trim()) {
            return toast.error("Email field is required");
        }

        try {
            // Send trimmed payload variables safely matching database schemas
            await api.post("/customers/", {
                full_name: form.full_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null,
            });

            toast.success("Customer Added");

            setForm({
                full_name: "",
                email: "",
                phone: "",
            });

            fetchCustomers();
        } catch (err) {
            console.error("Submission failed:", err);

            // 2. Safe error verification fallback parsing logic
            const backendDetail = err.response?.data?.detail;

            if (Array.isArray(backendDetail)) {
                // Extracts explicit messages from Pydantic 422 error structures
                toast.error(`Validation Error: ${backendDetail[0]?.msg || "Invalid Input Data"}`);
            } else if (typeof backendDetail === "string") {
                // Handles manual HTTPExceptions strings (like 409 Conflict strings)
                toast.error(backendDetail);
            } else {
                toast.error("An unexpected workspace connection error occurred");
            }
        }
    };

    const deleteCustomer = async (id) => {
        try {
            await api.delete(`/customers/${id}`);
            toast.success("Customer Deleted");
            fetchCustomers();
        } catch (err) {
            const backendDetail = err.response?.data?.detail;
            toast.error(
                typeof backendDetail === "string"
                    ? backendDetail
                    : "Unable to delete customer"
            );
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-5">
                Customers
            </h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-5 rounded-xl shadow mb-5"
            >
                <div className="grid md:grid-cols-3 gap-3">
                    <input
                        className="border p-2 rounded"
                        placeholder="Full Name *"
                        value={form.full_name}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                full_name: e.target.value,
                            })
                        }
                    />

                    <input
                        className="border p-2 rounded"
                        placeholder="Email *"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                email: e.target.value,
                            })
                        }
                    />

                    <input
                        className="border p-2 rounded"
                        placeholder="Phone (Optional)"
                        value={form.phone}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                phone: e.target.value,
                            })
                        }
                    />
                </div>

                <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 transition font-medium"
                >
                    Add Customer
                </button>
            </form>

            <div className="bg-white p-4 rounded-xl shadow">
                {customers.length === 0 ? (
                    <p className="text-gray-500 text-sm p-2">
                        No customers found.
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {customers.map((c) => (
                            <div
                                key={c.id}
                                className="flex justify-between items-center py-3 px-2 first:pt-0 last:pb-0"
                            >
                                <div>
                                    <strong className="text-gray-800">{c.full_name}</strong>
                                    <div className="text-sm text-gray-500">{c.email}</div>
                                    <div className="text-xs text-gray-400">{c.phone || "No Phone"}</div>
                                </div>

                                <button
                                    onClick={() => deleteCustomer(c.id)}
                                    className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}