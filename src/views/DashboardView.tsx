import React, { useEffect, useState } from 'react';
import { InventoryService } from '../services/inventoryService';
import { DashboardMetrics, Product } from '../types/database';
import { formatCurrency } from '../lib/utils';
import {
  TrendingUp,
  AlertOctagon,
  PackageX,
  Wallet,
  ArrowUpRight,
  ClipboardList,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { NavItem } from '../components/layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavItem) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [criticalProducts, setCriticalProducts] = useState<Product[]>([]);
  const [highMarginProducts, setHighMarginProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await InventoryService.getDashboardMetrics();
      const products = await InventoryService.getProducts();

      setMetrics(data);
      // Items that are out of stock or below reorder point
      const critical = products.filter(p => p.current_stock <= p.reorder_point);
      setCriticalProducts(critical);

      // Top 5 margin items
      const sortedByMargin = [...products]
        .filter(p => p.selling_price > 0)
        .sort((a, b) => {
          const marginA = (a.selling_price - a.cost_price) / a.selling_price;
          const marginB = (b.selling_price - b.cost_price) / b.selling_price;
          return marginB - marginA;
        })
        .slice(0, 5);
      setHighMarginProducts(sortedByMargin);
    } catch (e) {
      console.error('Error loading dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Loading Belmarose live inventory metrics...</span>
        </div>
      </div>
    );
  }

  const budgetPercent = Math.min(100, Math.round((metrics.weeklySpend / metrics.weeklyBudget) * 100));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Operations Control Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock valuation, weekly reorder calculation, and consumption audit
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => onNavigate('ordering')}
            className="gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generate Weekly Reorder</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('stock-take')}
            className="gap-1.5"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Start Physical Count</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate('wastage')}
            className="gap-1.5 text-slate-700"
          >
            <span>Log Wastage</span>
          </Button>
        </div>
      </div>

      {/* Critical Stock Alert Bar if items out of stock */}
      {metrics.outOfStockCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50/70 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-red-900">
                {metrics.outOfStockCount} Liquor Items Currently OUT OF STOCK
              </h4>
              <Badge variant="danger" className="text-[10px]">Urgent</Badge>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Top volume sellers are at zero stock: Double Black, Black Label, Budweiser Premium. Reorder immediately to avoid weekend revenue loss.
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onNavigate('ordering')}
            className="flex-shrink-0 text-xs"
          >
            Review Reorder Plan <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Total Inventory Value</p>
              <div className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {formatCurrency(metrics.totalInventoryValue)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-semibold text-slate-700">{metrics.totalProductsCount}</span> liquor lines evaluated
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Warning */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Low Stock / Out of Stock</p>
              <div className="h-8 w-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertOctagon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-amber-600 font-mono">
                  {metrics.lowStockItemsCount + metrics.outOfStockCount}
                </h3>
                <span className="text-xs text-slate-500">items need reorder</span>
              </div>
              <div className="flex gap-2 mt-1.5">
                <Badge variant="danger" className="text-[10px]">
                  {metrics.outOfStockCount} zero stock
                </Badge>
                <Badge variant="warning" className="text-[10px]">
                  {metrics.lowStockItemsCount} below par
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discrepancies */}
        <Card
          className="hover:border-slate-300 transition-colors cursor-pointer"
          onClick={() => onNavigate('discrepancies')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Unresolved Discrepancies</p>
              <div className="h-8 w-8 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-red-600 font-mono">
                  {metrics.unresolvedDiscrepanciesCount}
                </h3>
                <span className="text-xs text-slate-500">audit flags</span>
              </div>
              <p className="text-[11px] text-red-600/90 font-medium mt-1">
                -{formatCurrency(metrics.unresolvedDiscrepancyValue)} financial variance
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Spend vs Budget */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Weekly Requisition Spend</p>
              <span className="text-xs font-semibold text-slate-700 font-mono">
                {budgetPercent}% of budget
              </span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {formatCurrency(metrics.weeklySpend)}
              </h3>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercent > 90 ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Cap limit: {formatCurrency(metrics.weeklyBudget)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Critical Reorders vs Profit Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reorder Priorities (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Reorder Priorities (Velocity Engine)</CardTitle>
                <CardDescription>
                  Calculated using 2-week historical sales run rate and current shelf counts
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('ordering')}
                className="text-xs text-blue-600 hover:text-blue-700 gap-1"
              >
                <span>Full Sheet</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-y border-slate-100 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">Liquor Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">In Hand</th>
                      <th className="py-2.5 px-3 text-right">Reorder Point</th>
                      <th className="py-2.5 px-3 text-right">2-Wk Sales</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criticalProducts.slice(0, 7).map(product => {
                      const isZero = product.current_stock <= 0;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {product.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {product.category?.name || 'Spirits'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            <span className={isZero ? 'text-red-600 font-bold' : 'text-slate-800'}>
                              {product.current_stock} {product.uom}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {product.reorder_point} {product.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {product.last_2week_sales}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isZero ? (
                              <Badge variant="danger" dot className="text-[10px]">
                                Out of Stock
                              </Badge>
                            ) : (
                              <Badge variant="warning" dot className="text-[10px]">
                                Low Stock
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Profit Margin Heatmap & Wastage */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Top Profit Margin Lines</CardTitle>
                <Badge variant="success" className="text-[10px] font-mono">
                  Avg {metrics.avgProfitMarginPercent}% Margin
                </Badge>
              </div>
              <CardDescription>
                Highest gross margin items (Menu Selling Price vs Purchase Cost)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {highMarginProducts.map(p => {
                const marginPercent = Math.round(((p.selling_price - p.cost_price) / p.selling_price) * 100);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Cost: {formatCurrency(p.cost_price)} | Menu: {formatCurrency(p.selling_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 font-mono text-sm">
                        +{marginPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
