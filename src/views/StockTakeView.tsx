import React, { useState, useEffect } from 'react';
import { Product, StockTakeSession, StockTakeType, UserRole } from '../types/database';
import { InventoryService } from '../services/inventoryService';
import { StockTakeService } from '../services/stockTakeService';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Play,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

interface StockTakeViewProps {
  currentRole: UserRole;
  onNavigateToDiscrepancies: () => void;
}

export function StockTakeView({ currentRole, onNavigateToDiscrepancies }: StockTakeViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pastSessions, setPastSessions] = useState<StockTakeSession[]>([]);
  const [activeSession, setActiveSession] = useState<StockTakeSession | null>(null);

  // In-session count state: map productId -> counted quantity
  const [counts, setCounts] = useState<{ [productId: string]: number }>({});
  const [notes, setNotes] = useState<{ [productId: string]: string }>({});
  const [conductedByName, setConductedByName] = useState<string>('Staff: Rajesh');
  const [sessionType, setSessionType] = useState<StockTakeType>('daily_closing');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<{ session: StockTakeSession; discrepanciesFound: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prods = await InventoryService.getProducts();
    const sessions = await StockTakeService.getSessions();
    setProducts(prods);
    setPastSessions(sessions);
  };

  const handleStartSession = async () => {
    const session = await StockTakeService.startSession(
      sessionType,
      conductedByName,
      `Physical count initiated by ${conductedByName}`
    );
    setActiveSession(session);

    // Initialize counts with current system stock as starting reference
    const initialCounts: { [productId: string]: number } = {};
    products.forEach(p => {
      initialCounts[p.id] = p.current_stock;
    });
    setCounts(initialCounts);
    setCompletionResult(null);
  };

  const handleCountChange = (productId: string, val: number) => {
    setCounts(prev => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSubmitCounts = async () => {
    if (!activeSession) return;
    setIsSubmitting(true);
    try {
      const itemsToSubmit = products.map(p => ({
        productId: p.id,
        countedQty: counts[p.id] ?? p.current_stock,
        notes: notes[p.id] || '',
      }));

      const res = await StockTakeService.submitCounts(
        activeSession.id,
        itemsToSubmit,
        conductedByName
      );

      setCompletionResult(res);
      setActiveSession(null);
      await loadData();
    } catch (e) {
      console.error('Error submitting stock take', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Physical Stock Take & Count Audit
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              Daily / Spot Checks
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct daily opening/closing counts. Any variance between expected and physical count is automatically recorded into the Discrepancy Registry.
          </p>
        </div>
      </div>

      {/* Completion Alert */}
      {completionResult && (
        <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h4 className="font-semibold text-sm">
              Stock Take Completed: {completionResult.session.session_code}
            </h4>
          </div>
          <p className="text-xs text-emerald-700">
            {completionResult.discrepanciesFound > 0 ? (
              <>
                Detected <strong>{completionResult.discrepanciesFound} variances</strong> between system stock and counted stock.
                Discrepancy tickets have been automatically filed for administrative review.
              </>
            ) : (
              'All counts matched system stock with 100% precision. No variances found!'
            )}
          </p>
          {completionResult.discrepanciesFound > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onNavigateToDiscrepancies}
              className="text-xs bg-white text-emerald-800 border-emerald-300"
            >
              Review Discrepancy Log
            </Button>
          )}
        </div>
      )}

      {/* If No Active Session: Show Launch Card */}
      {!activeSession ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Session Config Card */}
          <Card className="md:col-span-1 border-blue-200/70 shadow-xs">
            <CardHeader className="bg-blue-50/40 pb-4">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
                <Play className="h-4 w-4 text-blue-600" />
                <span>Launch New Stock Take</span>
              </CardTitle>
              <CardDescription>
                Select count type and responsible staff member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Count Type
                </label>
                <select
                  value={sessionType}
                  onChange={e => setSessionType(e.target.value as StockTakeType)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="daily_closing">Daily Closing Count (Bar Handover)</option>
                  <option value="daily_opening">Daily Opening Count (Pre-Shift)</option>
                  <option value="spot_check">Spot Check Audit (Surprise)</option>
                  <option value="weekly_audit">Full Weekly Comprehensive Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Auditor / Staff Name
                </label>
                <Input
                  value={conductedByName}
                  onChange={e => setConductedByName(e.target.value)}
                  placeholder="e.g. Staff: Rohan / Lead Bartender"
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleStartSession} className="w-full gap-1.5 shadow-sm">
                  <Play className="h-3.5 w-3.5" />
                  <span>Start Physical Count</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Past Sessions List */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <span>Recent Stock Take Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-y border-slate-100 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">Session Code</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Conducted By</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Variance Impact</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastSessions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                          {s.session_code}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-600">
                          {s.type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{s.conducted_by}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDate(s.started_at)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          <span className={s.total_variance_cost && s.total_variance_cost < 0 ? 'text-red-600' : 'text-slate-800'}>
                            {s.total_variance_cost ? formatCurrency(s.total_variance_cost) : '₹0'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge variant="success" dot className="text-[10px]">
                            {s.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Active Count Sheet */
        <Card className="border-blue-300">
          <CardHeader className="bg-blue-50/30 flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base text-blue-950">
                  Active Session: {activeSession.session_code}
                </CardTitle>
                <Badge variant="default" className="text-[10px]">
                  In Progress
                </Badge>
              </div>
              <CardDescription>
                Auditor: <strong>{activeSession.conducted_by}</strong> • Mode:{' '}
                <strong>{activeSession.type.replace('_', ' ')}</strong>
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSession(null)}
                className="text-xs"
              >
                Cancel Session
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitCounts}
                disabled={isSubmitting}
                className="text-xs gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Finalize & Submit Count</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">SR.</th>
                    <th className="py-2.5 px-3">Liquor Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Expected (System)</th>
                    <th className="py-2.5 px-4 text-center bg-blue-50/40">Physical Count</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                    <th className="py-2.5 px-3 text-right">Cost Impact</th>
                    <th className="py-2.5 px-4">Staff Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p, idx) => {
                    const counted = counts[p.id] ?? p.current_stock;
                    const diff = Number((counted - p.current_stock).toFixed(2));
                    const costImpact = Number((diff * p.cost_price).toFixed(2));
                    const hasDiscrepancy = Math.abs(diff) > 0.001;

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          hasDiscrepancy
                            ? diff < 0
                              ? 'bg-red-50/30'
                              : 'bg-amber-50/30'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{p.category?.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                          {p.current_stock} {p.uom}
                        </td>
                        <td className="py-2 px-4 text-center bg-blue-50/20">
                          <input
                            type="number"
                            step="0.01"
                            value={counts[p.id] !== undefined ? counts[p.id] : p.current_stock}
                            onChange={e =>
                              handleCountChange(p.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-24 text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white shadow-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {diff === 0 ? (
                            <span className="text-slate-400">0.00</span>
                          ) : diff < 0 ? (
                            <span className="text-red-600">{diff}</span>
                          ) : (
                            <span className="text-blue-600">+{diff}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span
                            className={
                              costImpact < 0
                                ? 'text-red-600 font-semibold'
                                : costImpact > 0
                                ? 'text-blue-600 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            {formatCurrency(costImpact)}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={notes[p.id] || ''}
                            onChange={e =>
                              setNotes(prev => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="w-full text-xs py-1 px-2 border border-slate-200 rounded text-slate-700 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
