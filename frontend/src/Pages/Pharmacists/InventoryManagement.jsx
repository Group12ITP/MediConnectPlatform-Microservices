import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("pharmacistToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const emptyItem = {
  rxcui: "",
  genericName: "",
  brandName: "",
  manufacturer: "",
  dosageForm: "",
  strength: "",
  quantityInStock: 0,
  unit: "units",
  pricePerUnit: 0,
  currency: "LKR",
  reorderLevel: 10,
  requiresPrescription: true,
};

const InventoryManagement = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/pharmacy/inventory`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Unable to load inventory");
      setItems(json.data || []);
    } catch (err) {
      setMessage(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const isEdit = Boolean(editingId);
      const res = await fetch(
        isEdit ? `${API}/pharmacy/inventory/${editingId}` : `${API}/pharmacy/inventory`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify(form),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Unable to save inventory item");
      setForm(emptyItem);
      setEditingId(null);
      setMessage(isEdit ? "Inventory item updated." : "Inventory item added.");
      await loadItems();
    } catch (err) {
      setMessage(err.message || "Unable to save item.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      rxcui: item.rxcui || "",
      genericName: item.genericName || "",
      brandName: item.brandName || "",
      manufacturer: item.manufacturer || "",
      dosageForm: item.dosageForm || "",
      strength: item.strength || "",
      quantityInStock: item.quantityInStock ?? 0,
      unit: item.unit || "units",
      pricePerUnit: item.pricePerUnit ?? 0,
      currency: item.currency || "LKR",
      reorderLevel: item.reorderLevel ?? 10,
      requiresPrescription: item.requiresPrescription ?? true,
    });
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${API}/pharmacy/inventory/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      setMessage("Inventory item deleted.");
      await loadItems();
    } catch (err) {
      setMessage(err.message || "Unable to delete item.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header Section */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-500 mt-2">Manage your pharmacy's medicine inventory efficiently</p>
        </div>

        {/* Add/Edit Form Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              {editingId ? "Edit Medicine" : "Add New Medicine"}
            </h2>
            <p className="text-teal-100 text-sm mt-1">
              {editingId ? "Update the medicine details" : "Fill in the details to add a new medicine to inventory"}
            </p>
          </div>

          <form onSubmit={submit} className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RXCUI *</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="Enter RXCUI code" 
                  value={form.rxcui} 
                  onChange={(e) => setField("rxcui", e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name *</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="e.g., Paracetamol" 
                  value={form.genericName} 
                  onChange={(e) => setField("genericName", e.target.value)} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="e.g., Panadol" 
                  value={form.brandName} 
                  onChange={(e) => setField("brandName", e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="Manufacturer name" 
                  value={form.manufacturer} 
                  onChange={(e) => setField("manufacturer", e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage Form</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="e.g., Tablet, Capsule" 
                  value={form.dosageForm} 
                  onChange={(e) => setField("dosageForm", e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strength</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="e.g., 500mg" 
                  value={form.strength} 
                  onChange={(e) => setField("strength", e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  type="number" 
                  placeholder="Quantity in stock" 
                  value={form.quantityInStock} 
                  onChange={(e) => setField("quantityInStock", Number(e.target.value))} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  placeholder="e.g., tablets, bottles" 
                  value={form.unit} 
                  onChange={(e) => setField("unit", e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Unit *</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={form.pricePerUnit} 
                  onChange={(e) => setField("pricePerUnit", Number(e.target.value))} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                >
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                  type="number" 
                  placeholder="Alert when stock below" 
                  value={form.reorderLevel} 
                  onChange={(e) => setField("reorderLevel", Number(e.target.value))} 
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.requiresPrescription} 
                    onChange={(e) => setField("requiresPrescription", e.target.checked)} 
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires Prescription</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={saving}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  editingId 
                    ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : editingId ? "Update Item" : "Add Item"}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyItem);
                  }}
                  className="px-6 py-2.5 rounded-xl font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`rounded-xl p-4 ${
            message.includes("deleted") || message.includes("Unable") 
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}>
            <div className="flex items-center gap-2">
              {message.includes("deleted") || message.includes("Unable") ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}

        {/* Inventory List Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Current Inventory</h2>
                <p className="text-sm text-gray-500 mt-1">Total {items.length} medicine{items.length !== 1 ? 's' : ''} in stock</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={loadItems}
                  className="p-2 text-gray-500 hover:text-teal-600 transition-colors"
                  title="Refresh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 mt-4">Loading inventory...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No inventory items yet</p>
              <p className="text-gray-400 text-sm mt-2">Start by adding your first medicine above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600 text-sm">
                    <th className="px-6 py-4 font-semibold">Medicine</th>
                    <th className="px-6 py-4 font-semibold">RXCUI</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Prescription</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.genericName}</div>
                        <div className="text-gray-500 text-sm">{item.brandName || "No brand"}</div>
                        {item.manufacturer && (
                          <div className="text-gray-400 text-xs mt-1">{item.manufacturer}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.rxcui}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            item.quantityInStock <= item.reorderLevel && item.quantityInStock > 0
                              ? "text-amber-600"
                              : item.quantityInStock === 0
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}>
                            {item.quantityInStock}
                          </span>
                          <span className="text-gray-500 text-sm">{item.unit}</span>
                          {item.quantityInStock <= item.reorderLevel && item.quantityInStock > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Low Stock</span>
                          )}
                          {item.quantityInStock === 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of Stock</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.currency} {item.pricePerUnit.toFixed(2)}
                        </div>
                        {item.dosageForm && (
                          <div className="text-gray-500 text-xs">{item.dosageForm} {item.strength}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.requiresPrescription ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            OTC
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEdit(item)} 
                            className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => remove(item._id)} 
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;