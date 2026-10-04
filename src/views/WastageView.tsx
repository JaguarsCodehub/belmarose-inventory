import React, { useState, useEffect } from 'react';
import { WastageLog, WastageReason, Product, UserRole } from '../types/database';
import { WastageService } from '../services/wastageService';
import { InventoryService } from '../services/inventoryService';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Trash2,
  Plus,
  AlertCircle,
  Wine,
  GlassWater,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface WastageViewProps {
  currentRole: UserRole;
}

export function WastageView({ currentRole }: WastageViewProps) {
  const [logs, setLogs] = useState<WastageLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [reason, setReason] = useState<WastageReason>('spillage');
  const [loggedByName, setLoggedByName] = useState<string>('Staff: Rohan');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await WastageService.getWastageLogs();
    const prods = await InventoryService.getProducts();
    setLogs(list);
    setProducts(prods);
    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const estimatedImpact = selectedProduct ? wasteQty * selectedProduct.cost_price : 0;

  const handleRecordWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      await WastageService.recordWastage(
        selectedProductId,
        wasteQty,
        reason,
        loggedByName,
        notes
      );
      setIsLogModalOpen(false);
      setNotes('');
      setWasteQty(1);
      await loadData();
    } catch (e) {
      console.error('Error logging wastage', e);
    }
  };

  const totalWastageCost = logs.reduce((acc, l) => acc + l.cost_impact, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Wastage, Spillage & Complimentary Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log bottle breakages, draft beer spillage, corked wine, and complimentary VIP rounds with real-time inventory deduction.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsLogModalOpen(true)}
          className="gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Record Spillage / Wastage</span>
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Total Wastage Cost</p>
            <h3 className="text-2xl font-bold font-mono text-red-600 mt-2">
              {formatCurrency(totalWastageCost)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct cost to bar P&L</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Breakage & Accidents</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {logs.filter(l => l.reason === 'breakage' || l.reason === 'spillage').length} events
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Bar floor spillage slips</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Complimentary / Tasting</p>
            <h3 className="text-2xl font-bold font-mono text-blue-600 mt-2">
              {logs.filter(l => l.reason === 'complimentary').length} rounds
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Authorized guest pours</p>
          </CardContent>
        </Card>
      </div>

      {/* Table of Wastage Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Historical Spillage & Wastage Entries</CardTitle>
          <CardDescription>
            Audit log with logged staff member, impact value, and incident report
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Liquor Name</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-right">Cost Impact</th>
                  <th className="py-2.5 px-3">Logged By</th>
                  <th className="py-2.5 px-4">Staff Incident Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(log.logged_at)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{log.product?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{log.product?.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-600">
                      -{log.quantity} {log.product?.uom}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(log.cost_impact)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{log.logged_by}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Wastage Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Record Liquor Spillage / Wastage"
        description="Deducts stock immediately and calculates financial cost impact"
      >
        <form onSubmit={handleRecordWastage} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Liquor Item
            </label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.current_stock} {p.uom} in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Wasted Quantity (${selectedProduct?.uom || 'BTL.'})`}
              type="number"
              step="0.01"
              min="0.01"
              value={wasteQty}
              onChange={e => setWasteQty(parseFloat(e.target.value) || 0)}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as WastageReason)}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
              >
                <option value="spillage">Spillage (Draft tap / pour)</option>
                <option value="breakage">Bottle Breakage (Accidental drop)</option>
                <option value="spoilage">Spoilage / Flat / Corked</option>
                <option value="complimentary">Complimentary / VIP Pour</option>
                <option value="bartender_error">Bartender Pouring Error</option>
                <option value="expired">Expired Date</option>
              </select>
            </div>
          </div>

          {/* Cost preview */}
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-900 font-medium text-xs">Estimated Cost Impact:</span>
            <span className="font-mono font-bold text-red-600 text-sm">
              {formatCurrency(estimatedImpact)}
            </span>
          </div>

          <Input
            label="Logged by (Staff Name)"
            value={loggedByName}
            onChange={e => setLoggedByName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Incident Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Slipped while carrying crate to service station 1"
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Confirm & Deduct Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
