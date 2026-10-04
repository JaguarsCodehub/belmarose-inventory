import React, { useState, useEffect } from 'react';
import { Product, Category, Vendor, StockMovement, UserRole } from '../types/database';
import { InventoryService } from '../services/inventoryService';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Search,
  Plus,
  Edit2,
  SlidersHorizontal,
  History,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  Building2,
  Package,
  Layers,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface InventorySplitViewProps {
  currentRole: UserRole;
}

export function InventorySplitView({ currentRole }: InventorySplitViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prods = await InventoryService.getProducts();
    const cats = await InventoryService.getCategories();
    const vens = await InventoryService.getVendors();

    setProducts(prods);
    setCategories(cats);
    setVendors(vens);

    if (prods.length > 0 && !selectedProduct) {
      setSelectedProduct(prods[0]);
      loadMovements(prods[0].id);
    }
  };

  const loadMovements = async (productId: string) => {
    const history = await InventoryService.getProductMovements(productId);
    setMovements(history);
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    loadMovements(prod.id);
  };

  const handleSaveStockAdjustment = async () => {
    if (!selectedProduct) return;
    try {
      const updated = await InventoryService.adjustStock(
        selectedProduct.id,
        adjustQty,
        adjustReason || 'Manual inventory correction',
        currentRole === 'admin' ? 'Admin' : 'Manager'
      );
      setIsAdjustModalOpen(false);
      await loadData();
      setSelectedProduct(updated);
      await loadMovements(updated.id);
    } catch (e) {
      console.error('Error adjusting stock', e);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await InventoryService.saveProduct(editFormData as any);
      setIsEditModalOpen(false);
      setIsAddModalOpen(false);
      await loadData();
      setSelectedProduct(updated);
    } catch (e) {
      console.error('Error saving product', e);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || p.category_id === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.current_stock <= p.reorder_point && p.current_stock > 0;
    if (stockFilter === 'out') matchesStock = p.current_stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50">
      {/* Top Filter and Action Bar */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search liquor name, SKU..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock filter toggles */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                stockFilter === 'low' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                stockFilter === 'out' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {currentRole === 'admin' && (
          <Button
            size="sm"
            onClick={() => {
              setEditFormData({
                name: '',
                category_id: categories[0]?.id || '',
                vendor_id: vendors[0]?.id || '',
                uom: 'BTL.',
                cost_price: 0,
                selling_price: 0,
                current_stock: 0,
                reorder_point: 5,
                ideal_stock: 20,
                min_order_qty: 1,
                case_size: 1,
              });
              setIsAddModalOpen(true);
            }}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Liquor Line</span>
          </Button>
        )}
      </div>

      {/* Split-Pane Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Product Table */}
        <div className="flex-1 overflow-y-auto border-r border-slate-200/80 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 border-b border-slate-200 font-medium z-10">
              <tr>
                <th className="py-2.5 px-4">Item & SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">In Hand</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Menu Price</th>
                <th className="py-2.5 px-3 text-right">Margin</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const isSelected = selectedProduct?.id === p.id;
                const isZero = p.current_stock <= 0;
                const isLow = p.current_stock <= p.reorder_point && p.current_stock > 0;
                const marginPercent = p.selling_price > 0
                  ? Math.round(((p.selling_price - p.cost_price) / p.selling_price) * 100)
                  : 0;

                return (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-2 border-l-blue-600'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        {p.category?.name || 'Spirits'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      <span
                        className={
                          isZero
                            ? 'text-red-600 font-bold'
                            : isLow
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-900'
                        }
                      >
                        {p.current_stock} {p.uom}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(p.cost_price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-900 font-medium">
                      {formatCurrency(p.selling_price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600">
                      {marginPercent}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isZero ? (
                        <Badge variant="danger" dot className="text-[10px]">
                          Empty
                        </Badge>
                      ) : isLow ? (
                        <Badge variant="warning" dot className="text-[10px]">
                          Low
                        </Badge>
                      ) : (
                        <Badge variant="success" dot className="text-[10px]">
                          Healthy
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs">
              No products found matching your search criteria.
            </div>
          )}
        </div>

        {/* Right Pane: Selected Item Detail Drawer (Notion/Linear style) */}
        {selectedProduct ? (
          <div className="w-[420px] flex-shrink-0 bg-white border-l border-slate-200/80 overflow-y-auto p-6 space-y-6">
            {/* Header with Title and Quick Edit */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedProduct.sku}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProduct.category?.name} • Unit: {selectedProduct.uom}
                </p>
              </div>

              {currentRole !== 'staff' && (
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => {
                    setEditFormData(selectedProduct);
                    setIsEditModalOpen(true);
                  }}
                  title="Edit product parameters"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                </Button>
              )}
            </div>

            {/* In-Hand Stock Highlight Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Current Physical Stock</span>
                {selectedProduct.current_stock <= selectedProduct.reorder_point ? (
                  <Badge variant="warning" dot className="text-[10px]">
                    Below Reorder Point
                  </Badge>
                ) : (
                  <Badge variant="success" dot className="text-[10px]">
                    Adequate Stock
                  </Badge>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-slate-900">
                    {selectedProduct.current_stock}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{selectedProduct.uom}</span>
                </div>

                {currentRole !== 'staff' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAdjustQty(selectedProduct.current_stock);
                      setAdjustReason('');
                      setIsAdjustModalOpen(true);
                    }}
                    className="h-8 text-xs font-medium"
                  >
                    Adjust Count
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Reorder Point</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {selectedProduct.reorder_point} {selectedProduct.uom}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Case / Min Order</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {selectedProduct.case_size > 1 ? `${selectedProduct.case_size} pk` : `${selectedProduct.min_order_qty} ${selectedProduct.uom}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Financials & Pricing
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-xs">
                  <p className="text-slate-400 text-[11px]">Purchase Cost</p>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {formatCurrency(selectedProduct.cost_price)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-xs">
                  <p className="text-slate-400 text-[11px]">Menu Selling Price</p>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {formatCurrency(selectedProduct.selling_price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier / Vendor Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Primary Supplier
              </h4>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>{selectedProduct.vendor?.name || 'Allied Spirits'}</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Contact: {selectedProduct.vendor?.contact_person} ({selectedProduct.vendor?.phone})
                </p>
                <p className="text-slate-500 text-[11px]">
                  Terms: {selectedProduct.vendor?.payment_terms || 'Net 15 Days'}
                </p>
              </div>
            </div>

            {/* Stock Movement Audit Ledger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Audit Ledger
                </h4>
                <History className="h-3.5 w-3.5 text-slate-400" />
              </div>

              <div className="space-y-2">
                {movements.map(m => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-md border border-slate-100 bg-slate-50/50 text-[11px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 capitalize">
                        {m.movement_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                    <p className="text-slate-500">{m.notes}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>By: {m.created_by}</span>
                      <span>{formatDate(m.created_at)}</span>
                    </div>
                  </div>
                ))}

                {movements.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No adjustments recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        description="Record physical bottle correction with audit trail logging"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              New Count ({selectedProduct?.uom})
            </label>
            <Input
              type="number"
              step="0.01"
              value={adjustQty}
              onChange={e => setAdjustQty(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Current in system: {selectedProduct?.current_stock} {selectedProduct?.uom}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reason for Adjustment
            </label>
            <Input
              type="text"
              placeholder="e.g. Physical recount, discrepancy correction"
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveStockAdjustment}>
              Save Adjustment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit / Add Product Modal */}
      <Modal
        isOpen={isEditModalOpen || isAddModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIsAddModalOpen(false);
        }}
        title={isAddModalOpen ? 'Add Liquor Product' : `Edit: ${editFormData.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Product Name"
            value={editFormData.name || ''}
            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={editFormData.category_id || ''}
                onChange={e => setEditFormData({ ...editFormData, category_id: e.target.value })}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Supplier</label>
              <select
                value={editFormData.vendor_id || ''}
                onChange={e => setEditFormData({ ...editFormData, vendor_id: e.target.value })}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Cost Price (₹)"
              type="number"
              step="0.01"
              value={editFormData.cost_price || 0}
              onChange={e => setEditFormData({ ...editFormData, cost_price: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              step="0.01"
              value={editFormData.selling_price || 0}
              onChange={e => setEditFormData({ ...editFormData, selling_price: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Unit (UOM)"
              value={editFormData.uom || 'BTL.'}
              onChange={e => setEditFormData({ ...editFormData, uom: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Reorder Point"
              type="number"
              value={editFormData.reorder_point || 5}
              onChange={e => setEditFormData({ ...editFormData, reorder_point: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Ideal Stock Par"
              type="number"
              value={editFormData.ideal_stock || 20}
              onChange={e => setEditFormData({ ...editFormData, ideal_stock: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Case Size"
              type="number"
              value={editFormData.case_size || 1}
              onChange={e => setEditFormData({ ...editFormData, case_size: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditModalOpen(false);
                setIsAddModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
