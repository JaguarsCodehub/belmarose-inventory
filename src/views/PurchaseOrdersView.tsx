import React, { useState, useEffect } from 'react';
import { PurchaseOrder, POStatus, UserRole } from '../types/database';
import { OrderingService } from '../services/orderingService';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Printer,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface PurchaseOrdersViewProps {
  currentRole: UserRole;
  onNavigateToOrdering: () => void;
}

export function PurchaseOrdersView({ currentRole, onNavigateToOrdering }: PurchaseOrdersViewProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivedCounts, setReceivedCounts] = useState<{ [productId: string]: number }>({});
  const [receivedByName, setReceivedByName] = useState<string>('Staff: Rajesh');
  const [successNote, setSuccessNote] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const list = await OrderingService.getPurchaseOrders();
    setOrders(list);
  };

  const handleOpenReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialCounts: { [productId: string]: number } = {};
    (po.items || []).forEach(item => {
      initialCounts[item.product_id] = item.ordered_qty;
    });
    setReceivedCounts(initialCounts);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = async () => {
    if (!selectedPO) return;
    try {
      const itemsPayload = Object.entries(receivedCounts).map(([productId, receivedQty]) => ({
        productId,
        receivedQty,
      }));

      await OrderingService.receiveDelivery(selectedPO.id, itemsPayload, receivedByName);
      setIsReceiveModalOpen(false);
      setSuccessNote(`Delivery received for ${selectedPO.po_number}. Product stock balances have been updated!`);
      setTimeout(() => setSuccessNote(null), 3000);
      await loadOrders();
    } catch (e) {
      console.error('Error receiving delivery', e);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Supplier Purchase Orders & Deliveries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track orders sent to liquor distributors and log delivery check-ins to auto-replenish shelf stock.
          </p>
        </div>

        <Button size="sm" onClick={onNavigateToOrdering} className="gap-1.5 shadow-sm">
          <span>Create New Order Requisition</span>
        </Button>
      </div>

      {successNote && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold">{successNote}</span>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Active & Completed Purchase Orders</CardTitle>
          <CardDescription>
            Audit trail of PO numbers, supplier dispatch, and delivery acceptance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-3">Distributor / Supplier</th>
                  <th className="py-2.5 px-3">Date Ordered</th>
                  <th className="py-2.5 px-3 text-right">Order Value</th>
                  <th className="py-2.5 px-3">Ordered By</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(po => {
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {po.po_number}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>{po.vendor?.name || 'Distributor'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {po.vendor?.payment_terms}
                        </p>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {formatDate(po.created_at)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(po.total_amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{po.ordered_by}</td>
                      <td className="py-3 px-3">
                        {po.status === 'received' && (
                          <Badge variant="success" dot className="text-[10px]">
                            Received
                          </Badge>
                        )}
                        {po.status === 'submitted' && (
                          <Badge variant="default" dot className="text-[10px]">
                            In Transit / Sent
                          </Badge>
                        )}
                        {po.status === 'draft' && (
                          <Badge variant="secondary" className="text-[10px]">
                            Draft
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {po.status === 'submitted' ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenReceive(po)}
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Check-in Delivery</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Completed {formatDate(po.received_at || po.created_at)}
                          </span>
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

      {/* Receive Delivery Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={`Receive Delivery: ${selectedPO?.po_number}`}
        description="Verify supplier invoice quantities. Stocks will be auto-incremented into inventory."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-900">{selectedPO?.vendor?.name}</p>
              <p className="text-[11px] text-slate-500">Ordered by: {selectedPO?.ordered_by}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Total Order Value</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {selectedPO ? formatCurrency(selectedPO.total_amount) : ''}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Received By (Staff / Store Manager)
            </label>
            <input
              type="text"
              value={receivedByName}
              onChange={e => setReceivedByName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded border border-slate-200 text-slate-800"
            />
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2">Item Name</th>
                <th className="py-2 text-right">Ordered Qty</th>
                <th className="py-2 text-center bg-blue-50/50">Actual Received</th>
                <th className="py-2 text-right">Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(selectedPO?.items || []).map(item => (
                <tr key={item.id}>
                  <td className="py-2 font-medium text-slate-900">{item.product?.name}</td>
                  <td className="py-2 text-right font-mono text-slate-600">
                    {item.ordered_qty} {item.product?.uom}
                  </td>
                  <td className="py-1 text-center bg-blue-50/20">
                    <input
                      type="number"
                      min="0"
                      value={receivedCounts[item.product_id] ?? item.ordered_qty}
                      onChange={e =>
                        setReceivedCounts(prev => ({
                          ...prev,
                          [item.product_id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 text-center font-mono font-bold text-xs py-1 rounded border border-slate-300 bg-white"
                    />
                  </td>
                  <td className="py-2 text-right font-mono text-slate-600">
                    {formatCurrency(item.unit_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmReceive} className="bg-emerald-600 hover:bg-emerald-700">
              Confirm Receipt & Add Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
