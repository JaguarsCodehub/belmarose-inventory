import { Discrepancy, DiscrepancyStatus } from '../types/database';
import { INITIAL_DISCREPANCIES } from './mockData';
import { InventoryService } from './inventoryService';

const STORAGE_KEY_DISCREPANCIES = 'belmarose_discrepancies_v1';

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

export class DiscrepancyService {
  // Get all discrepancies with product details hydrated
  static async getDiscrepancies(): Promise<Discrepancy[]> {
    const items = getLocal<Discrepancy[]>(STORAGE_KEY_DISCREPANCIES, INITIAL_DISCREPANCIES);
    const products = await InventoryService.getProducts();

    return items.map(d => ({
      ...d,
      product: products.find(p => p.id === d.product_id),
    }));
  }

  // Create new discrepancy
  static async logDiscrepancy(data: Omit<Discrepancy, 'id' | 'created_at'>): Promise<Discrepancy> {
    const items = getLocal<Discrepancy[]>(STORAGE_KEY_DISCREPANCIES, INITIAL_DISCREPANCIES);
    const newDiscrepancy: Discrepancy = {
      ...data,
      id: `disc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };

    items.unshift(newDiscrepancy);
    setLocal(STORAGE_KEY_DISCREPANCIES, items);
    return newDiscrepancy;
  }

  // Update status (e.g. Investigating -> Resolved / Written Off)
  static async updateStatus(
    id: string,
    status: DiscrepancyStatus,
    resolutionNotes: string,
    reviewedBy: string = 'Admin'
  ): Promise<Discrepancy> {
    const items = getLocal<Discrepancy[]>(STORAGE_KEY_DISCREPANCIES, INITIAL_DISCREPANCIES);
    const index = items.findIndex(d => d.id === id);
    if (index < 0) throw new Error('Discrepancy not found');

    items[index] = {
      ...items[index],
      status,
      resolution_notes: resolutionNotes,
      reviewed_by: reviewedBy,
      resolved_at: status === 'resolved' || status === 'written_off' ? new Date().toISOString() : undefined,
    };

    setLocal(STORAGE_KEY_DISCREPANCIES, items);
    const products = await InventoryService.getProducts();
    return {
      ...items[index],
      product: products.find(p => p.id === items[index].product_id),
    };
  }
}
