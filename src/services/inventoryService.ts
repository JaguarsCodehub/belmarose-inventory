import { Product, Category, Vendor, StockMovement, DashboardMetrics } from '../types/database';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_VENDORS, INITIAL_DISCREPANCIES, INITIAL_WASTAGE_LOGS, INITIAL_PURCHASE_ORDERS } from './mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage keys for offline / pre-db development
const STORAGE_KEY_PRODUCTS = 'belmarose_products_v1';
const STORAGE_KEY_CATEGORIES = 'belmarose_categories_v1';
const STORAGE_KEY_VENDORS = 'belmarose_vendors_v1';
const STORAGE_KEY_MOVEMENTS = 'belmarose_movements_v1';

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

export class InventoryService {
  // Get all categories
  static async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) return data;
    }
    return getLocal<Category[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
  }

  // Get all vendors
  static async getVendors(): Promise<Vendor[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('vendors').select('*').order('name');
      if (!error && data && data.length > 0) return data;
    }
    return getLocal<Vendor[]>(STORAGE_KEY_VENDORS, INITIAL_VENDORS);
  }

  // Get all products with category and vendor hydrated
  static async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), vendor:vendors(*)')
        .order('name');
      if (!error && data && data.length > 0) return data;
    }

    const products = getLocal<Product[]>(STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS);
    const categories = await this.getCategories();
    const vendors = await this.getVendors();

    return products.map(p => ({
      ...p,
      category: categories.find(c => c.id === p.category_id),
      vendor: vendors.find(v => v.id === p.vendor_id),
    }));
  }

  // Save / Update product
  static async saveProduct(productData: Partial<Product> & { name: string }): Promise<Product> {
    if (isSupabaseConfigured()) {
      if (productData.id) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productData.id)
          .select('*, category:categories(*), vendor:vendors(*)')
          .single();
        if (!error && data) return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select('*, category:categories(*), vendor:vendors(*)')
          .single();
        if (!error && data) return data;
      }
    }

    // Local fallback
    const products = getLocal<Product[]>(STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS);
    const categories = await this.getCategories();
    const vendors = await this.getVendors();

    let updatedProduct: Product;

    if (productData.id) {
      const index = products.findIndex(p => p.id === productData.id);
      if (index >= 0) {
        updatedProduct = { ...products[index], ...productData, updated_at: new Date().toISOString() };
        products[index] = updatedProduct;
      } else {
        throw new Error('Product not found');
      }
    } else {
      const newId = `p-${Date.now()}`;
      const newSku = productData.sku || `LIQ-${productData.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      updatedProduct = {
        id: newId,
        sku: newSku,
        name: productData.name,
        category_id: productData.category_id || categories[0]?.id || 'cat-beer',
        vendor_id: productData.vendor_id || vendors[0]?.id || 'ven-ub',
        uom: productData.uom || 'BTL.',
        cost_price: Number(productData.cost_price || 0),
        selling_price: Number(productData.selling_price || 0),
        current_stock: Number(productData.current_stock || 0),
        opening_stock: Number(productData.current_stock || 0),
        reorder_point: Number(productData.reorder_point || 5),
        ideal_stock: Number(productData.ideal_stock || 20),
        min_order_qty: Number(productData.min_order_qty || 1),
        case_size: Number(productData.case_size || 1),
        last_2week_sales: Number(productData.last_2week_sales || 0),
        is_active: true,
        notes: productData.notes || '',
        created_at: new Date().toISOString(),
      };
      products.push(updatedProduct);
    }

    setLocal(STORAGE_KEY_PRODUCTS, products);

    return {
      ...updatedProduct,
      category: categories.find(c => c.id === updatedProduct.category_id),
      vendor: vendors.find(v => v.id === updatedProduct.vendor_id),
    };
  }

  // Adjust stock quantity with audit ledger entry
  static async adjustStock(
    productId: string,
    newQuantity: number,
    reason: string,
    conductedBy: string = 'Admin'
  ): Promise<Product> {
    const products = await this.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const previousStock = product.current_stock;
    const diff = newQuantity - previousStock;

    // Record movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      product_id: productId,
      movement_type: 'audit_adjustment',
      quantity: diff,
      previous_stock: previousStock,
      new_stock: newQuantity,
      notes: reason,
      created_by: conductedBy,
      created_at: new Date().toISOString()
    };

    const movements = getLocal<StockMovement[]>(STORAGE_KEY_MOVEMENTS, []);
    movements.unshift(movement);
    setLocal(STORAGE_KEY_MOVEMENTS, movements);

    // Update product
    return await this.saveProduct({
      ...product,
      current_stock: newQuantity,
      notes: product.notes ? `${product.notes} | Adjusted: ${reason}` : `Adjusted: ${reason}`
    });
  }

  // Get stock ledger movements for a product
  static async getProductMovements(productId: string): Promise<StockMovement[]> {
    const movements = getLocal<StockMovement[]>(STORAGE_KEY_MOVEMENTS, []);
    return movements.filter(m => m.product_id === productId);
  }

  // Calculate high-level executive dashboard metrics
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const products = await this.getProducts();
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.current_stock * p.cost_price), 0);
    const lowStockItemsCount = products.filter(p => p.current_stock <= p.reorder_point && p.current_stock > 0).length;
    const outOfStockCount = products.filter(p => p.current_stock <= 0).length;

    // Calculate margins
    const marginProducts = products.filter(p => p.selling_price > 0);
    const totalMargin = marginProducts.reduce((acc, p) => {
      const margin = ((p.selling_price - p.cost_price) / p.selling_price) * 100;
      return acc + margin;
    }, 0);
    const avgProfitMarginPercent = marginProducts.length ? totalMargin / marginProducts.length : 0;

    return {
      totalInventoryValue,
      totalProductsCount: products.length,
      lowStockItemsCount,
      outOfStockCount,
      unresolvedDiscrepanciesCount: INITIAL_DISCREPANCIES.filter(d => d.status !== 'resolved' && d.status !== 'written_off').length,
      unresolvedDiscrepancyValue: Math.abs(INITIAL_DISCREPANCIES.filter(d => d.status !== 'resolved').reduce((acc, d) => acc + d.variance_value, 0)),
      weeklySpend: 62480.00,
      weeklyBudget: 150000.00,
      monthlyWastageValue: INITIAL_WASTAGE_LOGS.reduce((acc, w) => acc + w.cost_impact, 0),
      avgProfitMarginPercent: Math.round(avgProfitMarginPercent),
    };
  }
}
