import { StockTakeSession, StockTakeItem, StockTakeType, Product } from '../types/database';
import { InventoryService } from './inventoryService';
import { DiscrepancyService } from './discrepancyService';

const STORAGE_KEY_SESSIONS = 'belmarose_stocktake_sessions_v1';
const STORAGE_KEY_ITEMS = 'belmarose_stocktake_items_v1';

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

export class StockTakeService {
  // Start new stock take session
  static async startSession(
    type: StockTakeType,
    conductedBy: string,
    notes?: string
  ): Promise<StockTakeSession> {
    const sessions = getLocal<StockTakeSession[]>(STORAGE_KEY_SESSIONS, []);
    const sessionCode = `ST-${new Date().toISOString().slice(0, 10)}-${String(sessions.length + 1).padStart(3, '0')}`;

    const newSession: StockTakeSession = {
      id: `ses-${Date.now()}`,
      session_code: sessionCode,
      type,
      status: 'in_progress',
      conducted_by: conductedBy,
      notes,
      started_at: new Date().toISOString(),
    };

    sessions.unshift(newSession);
    setLocal(STORAGE_KEY_SESSIONS, sessions);
    return newSession;
  }

  // Get all sessions
  static async getSessions(): Promise<StockTakeSession[]> {
    return getLocal<StockTakeSession[]>(STORAGE_KEY_SESSIONS, [
      {
        id: 'ses-init-01',
        session_code: 'ST-2026-10-01-001',
        type: 'daily_closing',
        status: 'completed',
        conducted_by: 'Staff: Rohan',
        notes: 'End of month audit count for bar stock',
        started_at: '2026-10-01T22:00:00Z',
        completed_at: '2026-10-01T23:15:00Z',
        items_count: 20,
        total_variance_cost: -397.10
      }
    ]);
  }

  // Submit complete stock count for a session
  static async submitCounts(
    sessionId: string,
    counts: { productId: string; countedQty: number; notes?: string }[],
    conductedBy: string
  ): Promise<{ session: StockTakeSession; discrepanciesFound: number }> {
    const sessions = await this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) throw new Error('Session not found');

    const products = await InventoryService.getProducts();
    const recordedItems: StockTakeItem[] = [];
    let discrepanciesCount = 0;
    let totalVarianceCost = 0;

    for (const count of counts) {
      const product = products.find(p => p.id === count.productId);
      if (!product) continue;

      const systemStock = product.current_stock;
      const countedStock = count.countedQty;
      const variance = Number((countedStock - systemStock).toFixed(2));
      const varianceCost = Number((variance * product.cost_price).toFixed(2));
      totalVarianceCost += varianceCost;

      const item: StockTakeItem = {
        id: `sti-${Date.now()}-${count.productId}`,
        session_id: sessionId,
        product_id: count.productId,
        product,
        system_stock: systemStock,
        counted_stock: countedStock,
        variance,
        variance_cost: varianceCost,
        notes: count.notes,
      };

      recordedItems.push(item);

      // If discrepancy exists, automatically log it in the Discrepancy Registry
      if (Math.abs(variance) > 0.001) {
        discrepanciesCount++;
        await DiscrepancyService.logDiscrepancy({
          product_id: product.id,
          stock_take_session_id: sessionId,
          date: new Date().toISOString().slice(0, 10),
          expected_qty: systemStock,
          actual_qty: countedStock,
          variance,
          variance_value: varianceCost,
          status: 'pending_review',
          reviewed_by: conductedBy,
          resolution_notes: count.notes || `Variance detected in ${sessions[sessionIndex].type} count`,
        });

        // Update product's stock count to match physical count with ledger entry
        await InventoryService.adjustStock(
          product.id,
          countedStock,
          `Stock take count adjustment (${sessions[sessionIndex].session_code})`,
          conductedBy
        );
      }
    }

    // Save items
    const allItems = getLocal<StockTakeItem[]>(STORAGE_KEY_ITEMS, []);
    setLocal(STORAGE_KEY_ITEMS, [...recordedItems, ...allItems]);

    // Mark session complete
    sessions[sessionIndex].status = 'completed';
    sessions[sessionIndex].completed_at = new Date().toISOString();
    sessions[sessionIndex].items_count = counts.length;
    sessions[sessionIndex].total_variance_cost = totalVarianceCost;
    setLocal(STORAGE_KEY_SESSIONS, sessions);

    return {
      session: sessions[sessionIndex],
      discrepanciesFound: discrepanciesCount,
    };
  }
}
