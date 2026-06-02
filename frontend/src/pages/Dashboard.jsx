import { useEffect, useState } from "react";
import api from "../api/api";
import {
    Package,
    Users,
    ShoppingCart,
    AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get("/dashboard");
            setData(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!data) {
        return (
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Loading Dashboard...</h1>
            </div>
        );
    }

    const averageOrderValue =
        data.total_orders > 0
            ? (data.total_revenue / data.total_orders).toFixed(2)
            : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Dashboard</h1>
                    <p className="text-slate-500">
                        Monitor inventory, customers and orders.
                    </p>
                </div>

                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    ● System Healthy
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Products</p>
                        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900">
                            {data.total_products}
                        </h2>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="text-blue-500" size={24} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Customers</p>
                        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900">
                            {data.total_customers}
                        </h2>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                        <Users className="text-green-500" size={24} />
                    </div>
                </div>


                <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Orders</p>
                        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-gray-900">
                            {data.total_orders}
                        </h2>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <ShoppingCart className="text-purple-500" size={24} />
                    </div>
                </div>


                <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Low Stock</p>
                        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-red-600">
                            {data.low_stock_products.length}
                        </h2>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                    </h3>
                    <p className="text-3xl font-bold text-green-600 mt-2 truncate">
                        ₹{Number(data.total_revenue).toLocaleString("en-IN")}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Average Order Value
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2 truncate">
                        ₹{Number(averageOrderValue).toLocaleString("en-IN")}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Current Inventory Value
                    </h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2 truncate">
                        ₹{Number(data.total_inventory_value || 0).toLocaleString("en-IN")}
                    </p>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Low Stock Products
                </h2>

                {data.low_stock_products.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                        No low stock products.
                    </p>
                ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                        <table className="w-full border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.low_stock_products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{product.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{product.sku}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">{product.quantity}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {product.quantity <= 2 ? (
                                                <span className="inline-flex items-center bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    Critical
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center bg-yellow-50 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    Warning
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}