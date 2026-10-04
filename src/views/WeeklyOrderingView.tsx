import React, { useState, useEffect } from 'react';
import { OrderingService, SuggestedOrderRow } from '../services/orderingService';
import { WeeklyOrderPlan, UserRole } from '../types/database';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  Sparkles,
  AlertTriangle,
  Printer,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Save,
  Truck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface WeeklyOrderingViewProps {
  currentRole: UserRole;
  onNavigateToPOs: () => void;
}

export function WeeklyOrderingView({ currentRole, onNavigateToPOs }: WeeklyOrderingViewProps) {
  const [rows, setRows] = useState<SuggestedOrderRow[]>([]);
  const [plan, setPlan] = useState<WeeklyOrderPlan | null>(null);
  const [budgetLimit, setBudgetLimit] = useState<number>(150000);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Print Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    loadOrderingData();
  }, []);

  const loadOrderingData = async () => {
    setLoading(true);
    try {
      const data = await OrderingService.getCurrentOrderPlan();
      setPlan(data.plan);
      setRows(data.rows);
      setBudgetLimit(data.plan.budget_limit || 150000);
    } catch (e) {
      console.error('Failed to load order plan', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequisitionChange = (productId: string, val: number) => {
    const updated = rows.map(r => {
      if (r.product.id === productId) {
        const reqQty = Math.max(0, val);
        return {
          ...r,
          requisitionQty: reqQty,
          estimatedCost: reqQty * r.unitCost,
          projectedStockAfter: r.stockInHand + reqQty,
        };
      }
      return r;
    });
    setRows(updated);
  };

  const handleApplyAllSuggestions = () => {
    const updated = rows.map(r => ({
      ...r,
      requisitionQty: r.suggestedQty,
      estimatedCost: r.suggestedQty * r.unitCost,
      projectedStockAfter: r.stockInHand + r.suggestedQty,
    }));
    setRows(updated);
  };

  const handleGeneratePOs = async () => {
    try {
      const createdPOs = await OrderingService.generatePOsFromRequisition(
        rows,
        currentRole === 'admin' ? 'Admin' : 'Manager'
      );
      setSuccessMessage(`Successfully created ${createdPOs.length} Supplier Purchase Orders!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onNavigateToPOs();
      }, 1800);
    } catch (e) {
      console.error('Error generating POs', e);
    }
  };

  // Calculations
  const totalRequisitionValue = rows.reduce((sum, r) => sum + r.estimatedCost, 0);
  const totalSuggestedValue = rows.reduce((sum, r) => sum + (r.suggestedQty * r.unitCost), 0);
  const isBudgetExceeded = totalRequisitionValue > budgetLimit;
  const budgetDifference = totalRequisitionValue - budgetLimit;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Computing Belmarose liquor velocity & order recommendations...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Weekly Requisition & Order Engine
            </h2>
            <Badge variant="purple" className="text-[10px] font-mono">
              Velocity Powered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-replaces manual Excel ordering: combines 2-week sales run-rate, current shelf stock, and case multiples.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyAllSuggestions}
            className="text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Apply AI Suggestions</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPrintModalOpen(true)}
            className="text-xs gap-1.5 text-slate-700"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Printable Order Sheet</span>
          </Button>

          {currentRole !== 'staff' && (
            <Button
              size="sm"
              onClick={handleGeneratePOs}
              disabled={totalRequisitionValue === 0}
              className="text-xs gap-1.5 shadow-sm"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Convert to Supplier POs</span>
            </Button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Budget Limit Warning Banner */}
      {isBudgetExceeded ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900">
              Budget Warning: Requisition exceeds weekly cap by {formatCurrency(budgetDifference)}
            </h4>
            <p className="text-xs text-red-700 mt-0.5">
              Current total is {formatCurrency(totalRequisitionValue)} against the allocated budget of{' '}
              {formatCurrency(budgetLimit)}. Please adjust high-value spirit requisitions before final PO approval.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-red-800">
              {Math.round((totalRequisitionValue / budgetLimit) * 100)}% Used
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              Weekly Budget Health: <strong>{formatCurrency(totalRequisitionValue)}</strong> of{' '}
              <strong>{formatCurrency(budgetLimit)}</strong> allocated
            </span>
          </div>
          <span className="font-mono text-emerald-600 font-semibold">
            {formatCurrency(budgetLimit - totalRequisitionValue)} remaining
          </span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total Requisition Value</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(totalRequisitionValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {rows.filter(r => r.requisitionQty > 0).length} lines to be ordered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">AI Suggested Purchase Total</p>
            <h3 className="text-xl font-bold font-mono text-blue-600 mt-1">
              {formatCurrency(totalSuggestedValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Based on historical 2-week sales velocity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Weekly Budget Ceiling</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(budgetLimit)}
              </h3>
              {currentRole === 'admin' && (
                <button
                  onClick={() => {
                    const newBudget = prompt('Set new weekly budget limit (₹):', String(budgetLimit));
                    if (newBudget && !isNaN(Number(newBudget))) {
                      setBudgetLimit(Number(newBudget));
                    }
                  }}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Edit Cap
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Admin-configured threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Requisition Table (The Belmarose Excel replacement) */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Requisition Worktable (Belmarose Sheet 1 / 29 July)</CardTitle>
            <CardDescription>
              Review stock in hand, check suggested purchases, and adjust requisition quantities.
            </CardDescription>
          </div>
          <span className="text-xs text-slate-500 font-mono">20 Active Liquor SKUs</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">SR.</th>
                  <th className="py-2.5 px-3">Liquor Name</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Stock In Hand</th>
                  <th className="py-2.5 px-3 text-right">2-Wk Sales</th>
                  <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-800">
                    We Suggest
                  </th>
                  <th className="py-2.5 px-3 text-center bg-slate-100/70 font-bold text-slate-900">
                    Requisition Qty
                  </th>
                  <th className="py-2.5 px-3 text-right">Cost of Purchase</th>
                  <th className="py-2.5 px-4 text-right">Projected Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const isOutOfStock = row.stockInHand <= 0;
                  const isLow = row.stockInHand <= row.product.reorder_point && row.stockInHand > 0;

                  return (
                    <tr
                      key={row.product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        row.requisitionQty > 0 ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900">{row.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {row.product.category?.name} • {row.product.uom}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(row.unitCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={
                            isOutOfStock
                              ? 'text-red-600 font-bold'
                              : isLow
                              ? 'text-amber-600 font-semibold'
                              : 'text-slate-800'
                          }
                        >
                          {row.stockInHand}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {row.last2WeekSales}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold bg-blue-50/40 text-blue-700">
                        {row.suggestedQty}
                      </td>
                      <td className="py-2 px-3 text-center bg-slate-50/60">
                        <input
                          type="number"
                          min="0"
                          step={row.product.case_size > 1 ? row.product.case_size : 1}
                          value={row.requisitionQty}
                          onChange={e =>
                            handleRequisitionChange(row.product.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 text-center font-mono font-bold text-xs py-1 rounded border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(row.estimatedCost)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600 font-medium">
                        {row.projectedStockAfter} {row.product.uom}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold text-xs text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Weekly Requisition Value:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-700">
                    {formatCurrency(totalSuggestedValue)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {rows.reduce((sum, r) => sum + r.requisitionQty, 0)} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900 text-sm">
                    {formatCurrency(totalRequisitionValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Printable Supplier Order Sheet Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Supplier Order Dispatch Sheet (Printable)"
        description="Official weekly requisition slip for liquor distributor orders"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 border border-slate-200 rounded-lg space-y-4 print:border-none">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">BELMAROSE BAR & LOUNGE</h2>
                <p className="text-slate-500 text-[11px]">LIQUOR PROCUREMENT & REQUISITION ORDER</p>
                <p className="text-slate-500 text-[11px]">Period: 4th Week July • Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-900">ORDER REF: REQ-{new Date().toISOString().slice(0, 10)}</p>
                <p className="text-slate-500 text-[11px]">Outlet: Main Bar Stockroom</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 font-semibold">
                  <th className="py-1.5">SKU</th>
                  <th className="py-1.5">Item Name</th>
                  <th className="py-1.5 text-right">Order Qty</th>
                  <th className="py-1.5 text-right">Unit Cost</th>
                  <th className="py-1.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.filter(r => r.requisitionQty > 0).map(r => (
                  <tr key={r.product.id}>
                    <td className="py-1.5 font-mono text-[11px] text-slate-500">{r.product.sku}</td>
                    <td className="py-1.5 font-semibold text-slate-900">{r.product.name}</td>
                    <td className="py-1.5 text-right font-mono font-bold">{r.requisitionQty} {r.product.uom}</td>
                    <td className="py-1.5 text-right font-mono">{formatCurrency(r.unitCost)}</td>
                    <td className="py-1.5 text-right font-mono font-semibold">{formatCurrency(r.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-400 font-bold">
                  <td colSpan={4} className="py-2 text-right">Grand Total:</td>
                  <td className="py-2 text-right font-mono text-sm">{formatCurrency(totalRequisitionValue)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
              <p>Prepared by: {currentRole.toUpperCase()}</p>
              <p>Authorized Signature: _______________________</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
              Close
            </Button>
            <Button size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
