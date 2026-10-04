import { Product, WeeklyOrderPlan, WeeklyOrderPlanItem, PurchaseOrder, PurchaseOrderItem } from '../types/database';
import { InventoryService } from './inventoryService';
import { INITIAL_ORDER_PLAN, INITIAL_PURCHASE_ORDERS } from './mockData';

const STORAGE_KEY_ORDER_PLANS = 'belmarose_order_plans_v1';
const STORAGE_KEY_POS = 'belmarose_purchase_orders_v1';

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

export interface SuggestedOrderRow {
  product: Product;
  stockInHand: number;
  last2WeekSales: number;
  runRatePerWeek: number;
  suggestedQty: number;
  requisitionQty: number;
  unitCost: number;
  estimatedCost: number;
  projectedStockAfter: number;
}

export class OrderingService {
  // Calculate AI/Velocity suggestion based on Belmarose historical run-rate
  static calculateSuggestedOrder(product: Product): number {
    const sales = product.last_2week_sales || 0;
    const currentStock = product.current_stock || 0;
    const weeklyRate = sales / 2;
    // We want a safety stock of 1.5 to 2 weeks plus replenish what was sold
    const targetBuffer = Math.max(product.reorder_point, weeklyRate * 2);
    const deficit = targetBuffer - currentStock;

    if (deficit <= 0) return 0;

    // Round up according to min_order_qty or case_size for beers
    const step = product.case_size > 1 ? product.case_size : product.min_order_qty || 1;
    const suggested = Math.ceil(deficit / step) * step;
    return Math.max(0, suggested);
  }

  // Get active weekly ordering plan
  static async getCurrentOrderPlan(): Promise<{ plan: WeeklyOrderPlan; rows: SuggestedOrderRow[] }> {
    const products = await InventoryService.getProducts();
    const plans = getLocal<WeeklyOrderPlan[]>(STORAGE_KEY_ORDER_PLANS, [INITIAL_ORDER_PLAN]);
    const plan = plans[0] || INITIAL_ORDER_PLAN;

    const rows: SuggestedOrderRow[] = products.map(product => {
      const suggested = this.calculateSuggestedOrder(product);
      // Default requisition starts with suggested or 0
      const requisition = suggested;
      const estimatedCost = requisition * product.cost_price;

      return {
        product,
        stockInHand: product.current_stock,
        last2WeekSales: product.last_2week_sales,
        runRatePerWeek: Number((product.last_2week_sales / 2).toFixed(2)),
        suggestedQty: suggested,
        requisitionQty: requisition,
        unitCost: product.cost_price,
        estimatedCost,
        projectedStockAfter: product.current_stock + requisition,
      };
    });

    return { plan, rows };
  }

  // Convert Weekly Requisition directly into Supplier Purchase Orders grouped by Vendor
  static async generatePOsFromRequisition(
    rows: SuggestedOrderRow[],
    orderedBy: string = 'Admin'
  ): Promise<PurchaseOrder[]> {
    const existingPOs = getLocal<PurchaseOrder[]>(STORAGE_KEY_POS, INITIAL_PURCHASE_ORDERS);
    const vendors = await InventoryService.getVendors();

    // Group items with requisitionQty > 0 by vendor
    const itemsToOrder = rows.filter(r => r.requisitionQty > 0);
    const groupedByVendor = new Map<string, SuggestedOrderRow[]>();

    itemsToOrder.forEach(item => {
      const vendorId = item.product.vendor_id || 'ven-allied';
      if (!groupedByVendor.has(vendorId)) {
        groupedByVendor.set(vendorId, []);
      }
      groupedByVendor.get(vendorId)!.push(item);
    });

    const newPOs: PurchaseOrder[] = [];
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let counter = 1;

    groupedByVendor.forEach((vendorRows, vendorId) => {
      const vendor = vendors.find(v => v.id === vendorId);
      const totalAmount = vendorRows.reduce((sum, r) => sum + (r.requisitionQty * r.unitCost), 0);
      const poId = `po-${Date.now()}-${counter}`;
      const poNumber = `PO-${dateStr}-${String(counter).padStart(3, '0')}`;
      counter++;

      const poItems: PurchaseOrderItem[] = vendorRows.map((r, idx) => ({
        id: `poi-${poId}-${idx}`,
        po_id: poId,
        product_id: r.product.id,
        product: r.product,
        ordered_qty: r.requisitionQty,
        received_qty: 0,
        unit_cost: r.unitCost,
        total_cost: r.requisitionQty * r.unitCost,
      }));

      const newPO: PurchaseOrder = {
        id: poId,
        po_number: poNumber,
        vendor_id: vendorId,
        vendor,
        status: 'submitted',
        total_amount: totalAmount,
        budget_exceeded: false,
        ordered_by: orderedBy,
        created_at: new Date().toISOString(),
        expected_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        notes: `Weekly automated order generated for ${vendor?.name || 'Supplier'}`,
        items: poItems,
      };

      newPOs.push(newPO);
    });

    const updatedPOs = [...newPOs, ...existingPOs];
    setLocal(STORAGE_KEY_POS, updatedPOs);
    return newPOs;
  }

  // Get all purchase orders
  static async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const pos = getLocal<PurchaseOrder[]>(STORAGE_KEY_POS, INITIAL_PURCHASE_ORDERS);
    const vendors = await InventoryService.getVendors();
    const products = await InventoryService.getProducts();

    return pos.map(po => ({
      ...po,
      vendor: vendors.find(v => v.id === po.vendor_id),
      items: (po.items || []).map(item => ({
        ...item,
        product: products.find(p => p.id === item.product_id),
      })),
    }));
  }

  // Mark PO delivery received and auto-update product stocks
  static async receiveDelivery(
    poId: string,
    receivedItems: { productId: string; receivedQty: number }[],
    receivedBy: string = 'Staff'
  ): Promise<PurchaseOrder> {
    const pos = await this.getPurchaseOrders();
    const po = pos.find(p => p.id === poId);
    if (!po) throw new Error('PO not found');

    const products = await InventoryService.getProducts();

    // Update PO items and product current stock
    for (const rec of receivedItems) {
      const prod = products.find(p => p.id === rec.productId);
      if (prod && rec.receivedQty > 0) {
        await InventoryService.adjustStock(
          prod.id,
          prod.current_stock + rec.receivedQty,
          `Received via ${po.po_number} (${rec.receivedQty} ${prod.uom})`,
          receivedBy
        );
      }
    }

    po.status = 'received';
    po.received_at = new Date().toISOString();

    const allPOs = getLocal<PurchaseOrder[]>(STORAGE_KEY_POS, INITIAL_PURCHASE_ORDERS);
    const idx = allPOs.findIndex(p => p.id === poId);
    if (idx >= 0) {
      allPOs[idx] = po;
      setLocal(STORAGE_KEY_POS, allPOs);
    }

    return po;
  }
}
