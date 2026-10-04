import React, { useState, useEffect } from 'react';
import { Discrepancy, DiscrepancyStatus, UserRole } from '../types/database';
import { DiscrepancyService } from '../services/discrepancyService';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  SlidersHorizontal,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

interface DiscrepanciesViewProps {
  currentRole: UserRole;
}

export function DiscrepanciesView({ currentRole }: DiscrepanciesViewProps) {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Resolution form state
  const [newStatus, setNewStatus] = useState<DiscrepancyStatus>('resolved');
  const [resolutionNote, setResolutionNote] = useState<string>('');

  useEffect(() => {
    loadDiscrepancies();
  }, []);

  const loadDiscrepancies = async () => {
    const list = await DiscrepancyService.getDiscrepancies();
    setDiscrepancies(list);
  };

  const handleOpenResolve = (d: Discrepancy) => {
    setSelectedDiscrepancy(d);
    setNewStatus(d.status === 'pending_review' ? 'investigating' : 'resolved');
    setResolutionNote(d.resolution_notes || '');
    setIsResolveModalOpen(true);
  };

  const handleSaveResolution = async () => {
    if (!selectedDiscrepancy) return;
    try {
      await DiscrepancyService.updateStatus(
        selectedDiscrepancy.id,
        newStatus,
        resolutionNote,
        currentRole === 'admin' ? 'Admin' : 'Manager'
      );
      setIsResolveModalOpen(false);
      await loadDiscrepancies();
    } catch (e) {
      console.error('Error saving resolution', e);
    }
  };

  const filtered = discrepancies.filter(d => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  const pendingCount = discrepancies.filter(d => d.status === 'pending_review' || d.status === 'investigating').length;
  const totalFinancialLoss = Math.abs(
    discrepancies.filter(d => d.variance < 0).reduce((acc, d) => acc + d.variance_value, 0)
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Discrepancy & Variance Investigation
            </h2>
            {pendingCount > 0 && (
              <Badge variant="danger" dot className="text-[10px]">
                {pendingCount} Needs Review
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of differences between expected system balance (opening + purchases - sales) and physical bottle count.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Unresolved Variances</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold font-mono text-red-600 mt-2">
              {pendingCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Requires administrative review or spillage slip
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Cumulative Variance Loss</p>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-2">
              -{formatCurrency(totalFinancialLoss)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Net value of physical shortages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Resolved Audit Cases</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold font-mono text-emerald-600 mt-2">
              {discrepancies.filter(d => d.status === 'resolved' || d.status === 'written_off').length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Spillage recorded or written off by management
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Discrepancy Audit Log</CardTitle>
            <CardDescription>
              Review bottle shortage events, investigate causes, and sign off
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs"
            >
              <option value="all">All Statuses ({discrepancies.length})</option>
              <option value="pending_review">Pending Review</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="written_off">Written Off</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Liquor Name</th>
                  <th className="py-2.5 px-3 text-right">Expected</th>
                  <th className="py-2.5 px-3 text-right">Actual Count</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                  <th className="py-2.5 px-3 text-right">Cost Impact</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4">Investigation & Notes</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(d => {
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(d.date)}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{d.product?.name || 'Item'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {d.product?.category?.name} • {d.product?.uom}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {d.expected_qty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                        {d.actual_qty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={d.variance < 0 ? 'text-red-600' : 'text-blue-600'}>
                          {d.variance > 0 ? `+${d.variance}` : d.variance} {d.product?.uom}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        <span className={d.variance_value < 0 ? 'text-red-600' : 'text-slate-800'}>
                          {formatCurrency(d.variance_value)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {d.status === 'pending_review' && (
                          <Badge variant="danger" dot className="text-[10px]">
                            Pending Review
                          </Badge>
                        )}
                        {d.status === 'investigating' && (
                          <Badge variant="warning" dot className="text-[10px]">
                            Investigating
                          </Badge>
                        )}
                        {d.status === 'resolved' && (
                          <Badge variant="success" dot className="text-[10px]">
                            Resolved
                          </Badge>
                        )}
                        {d.status === 'written_off' && (
                          <Badge variant="secondary" className="text-[10px]">
                            Written Off
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{d.resolution_notes || 'No notes added'}</p>
                        {d.reviewed_by && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            By: {d.reviewed_by}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {currentRole !== 'staff' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenResolve(d)}
                            className="h-7 text-xs px-2.5"
                          >
                            Update
                          </Button>
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

      {/* Resolve Discrepancy Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Review Variance: ${selectedDiscrepancy?.product?.name}`}
        description="Update audit state and record manager findings or spillage reference"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Variance Quantity</span>
              <span className="font-bold text-red-600">
                {selectedDiscrepancy?.variance} {selectedDiscrepancy?.product?.uom}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Financial Impact</span>
              <span className="font-bold text-red-600">
                {selectedDiscrepancy ? formatCurrency(selectedDiscrepancy.variance_value) : ''}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Audit Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as DiscrepancyStatus)}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
            >
              <option value="pending_review">Pending Review</option>
              <option value="investigating">Investigating (Checking CCTV / Bar Logs)</option>
              <option value="resolved">Resolved (Spillage Slip Filed / Stock Adjusted)</option>
              <option value="written_off">Written Off (Authorized Management Loss)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Resolution Remarks / Evidence
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              placeholder="e.g. Spillage slip #204 verified. Customer glass breakage accounted for."
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveResolution}>
              Save Resolution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
