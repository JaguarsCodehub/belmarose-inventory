import React, { useState, useEffect } from 'react';
import { Vendor, Product, UserRole } from '../types/database';
import { InventoryService } from '../services/inventoryService';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Plus,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

interface VendorsViewProps {
  currentRole: UserRole;
}

export function VendorsView({ currentRole }: VendorsViewProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: 'Net 15 Days',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const v = await InventoryService.getVendors();
    const p = await InventoryService.getProducts();
    setVendors(v);
    setProducts(p);
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: Vendor = {
      id: `ven-${Date.now()}`,
      name: newVendor.name || '',
      contact_person: newVendor.contact_person || '',
      phone: newVendor.phone || '',
      email: newVendor.email || '',
      address: newVendor.address || '',
      payment_terms: newVendor.payment_terms || 'Net 15 Days',
      is_active: true,
    };
    const updated = [created, ...vendors];
    setVendors(updated);
    localStorage.setItem('belmarose_vendors_v1', JSON.stringify(updated));
    setIsAddModalOpen(false);
    setNewVendor({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: 'Net 15 Days',
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Suppliers & Liquor Distributors
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage distribution partners, commercial payment credit terms, and purchase contacts.
          </p>
        </div>

        {currentRole === 'admin' && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </Button>
        )}
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendors.map(v => {
          const suppliedCount = products.filter(p => p.vendor_id === v.id).length;
          return (
            <Card key={v.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{v.name}</h4>
                      <p className="text-[11px] text-slate-500">Contact: {v.contact_person}</p>
                    </div>
                  </div>
                  <Badge variant="success" dot className="text-[10px]">
                    Active
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{v.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{v.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    <span>Terms: {v.payment_terms}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span>{suppliedCount} Liquor lines supplied</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Liquor Supplier / Distributor"
        description="Save commercial vendor credentials and dispatch contacts"
      >
        <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
          <Input
            label="Supplier Company Name"
            placeholder="e.g. Allied Spirits Distributors Ltd."
            value={newVendor.name || ''}
            onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
            required
          />
          <Input
            label="Key Account Manager / Contact Person"
            placeholder="e.g. Vikram Malhotra"
            value={newVendor.contact_person || ''}
            onChange={e => setNewVendor({ ...newVendor, contact_person: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              placeholder="+91 98210 54321"
              value={newVendor.phone || ''}
              onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="orders@supplier.com"
              value={newVendor.email || ''}
              onChange={e => setNewVendor({ ...newVendor, email: e.target.value })}
              required
            />
          </div>
          <Input
            label="Payment Credit Terms"
            placeholder="e.g. Weekly Net 7, Net 15 Days, Cash on Delivery"
            value={newVendor.payment_terms || ''}
            onChange={e => setNewVendor({ ...newVendor, payment_terms: e.target.value })}
          />
          <Input
            label="Depot Address"
            placeholder="e.g. Lower Parel, Mumbai"
            value={newVendor.address || ''}
            onChange={e => setNewVendor({ ...newVendor, address: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
