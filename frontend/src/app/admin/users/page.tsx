"use client";
import React, { useState, useEffect } from "react";
import { Trash2, Search } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]); // 👈 naya
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const [usersRes, ordersRes] = await Promise.all([
        fetch(`${API}/admin/get-users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/admin/get-all-order`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const d = await usersRes.json();
      const o = await ordersRes.json();
      setUsers(d.data || []);
      setOrders(o.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const getDisplayName = (u: any) => {
    if (u.Name && u.Name !== "Guest") return u.Name;
    const userOrder = orders.find((o) => o.userId?._id === u._id);
    return userOrder?.shipping?.name || "Guest";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      const token = sessionStorage.getItem("admin_token");
      await fetch(`${API}/admin/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed");
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.Name?.toLowerCase().includes(search.toLowerCase()) ||
      u.Email?.toLowerCase().includes(search.toLowerCase()) ||
      u.ContactNumber?.includes(search),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Users ({users.length})
        </h1>
      </div>
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#81190B] text-sm"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#81190B] mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Role",
                    "Verified",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getDisplayName(u)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {u.Email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {u.ContactNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${u.Role === "Admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        {u.Role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isMobileVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {u.isMobileVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.Role !== "Admin" && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
