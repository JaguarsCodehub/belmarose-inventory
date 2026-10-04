import { WastageLog, WastageReason } from '../types/database';
import { INITIAL_WASTAGE_LOGS } from './mockData';
import { InventoryService } from './inventoryService';

const STORAGE_KEY_WASTAGE = 'belmarose_wastage_v1';

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

export class WastageService {
  static async getWastageLogs(): Promise<WastageLog[]> {
    const logs = getLocal<WastageLog[]>(STORAGE_KEY_WASTAGE, INITIAL_WASTAGE_LOGS);
    const products = await InventoryService.getProducts();

    return logs.map(w => ({
      ...w,
      product: products.find(p => p.id === w.product_id),
    }));
  }

  static async recordWastage(
    productId: string,
    quantity: number,
    reason: WastageReason,
    loggedBy: string,
    notes?: string
  ): Promise<WastageLog> {
    const products = await InventoryService.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const costImpact = Number((quantity * product.cost_price).toFixed(2));

    const newLog: WastageLog = {
      id: `wst-${Date.now()}`,
      product_id: productId,
      product,
      quantity,
      reason,
      cost_impact: costImpact,
      logged_by: loggedBy,
      notes,
      logged_at: new Date().toISOString(),
    };

    const logs = getLocal<WastageLog[]>(STORAGE_KEY_WASTAGE, INITIAL_WASTAGE_LOGS);
    logs.unshift(newLog);
    setLocal(STORAGE_KEY_WASTAGE, logs);

    // Auto deduct from current stock with an audit ledger entry
    const newStock = Math.max(0, Number((product.current_stock - quantity).toFixed(2)));
    await InventoryService.adjustStock(
      productId,
      newStock,
      `Wastage logged: ${quantity} ${product.uom} (${reason}) - ${notes || ''}`,
      loggedBy
    );

    return newLog;
  }
}
