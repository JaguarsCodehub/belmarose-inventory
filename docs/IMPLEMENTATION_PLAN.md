# Belmarose Stock & Inventory Management System

## Overview
A modern, sleek, high-precision inventory and liquor procurement system built specifically for F&B bars and restaurants, directly modernizing the legacy Excel ordering workflow (`LIQUOR ORDERING.xlsx`).

---

## 🏗️ Architecture & Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Design System:** Custom **shadcn/ui** primitives adhering to Notion/Shopify-clean aesthetics (anti-ui-slop, clean borders, zero generic purple AI cards, high data density, accessible)
- **Database & Backend:**
  - Supabase (PostgreSQL 15+)
  - Complete SQL Migrations with Row-Level Security, audit triggers, and seed data
  - Client-side data access layer via `@supabase/supabase-js` with zero-config fallback to a reactive local storage state engine (allowing 100% interactive testing before connecting Supabase credentials).

---

## 📊 Legacy Excel Transformation Analysis

| Legacy Spreadsheet (`LIQUOR ORDERING.xlsx`) | Modern Software Solution |
|---|---|
| Fragile cell formulas (`=7018.33/2`, `=120+93`) | Typed schema with verified unit costs, automated math, and audit ledgers |
| Scattered sheets per week (`Sheet1`, `29 JULY`) | Persistent weekly ordering engine with automated PO generation |
| No variance or theft detection | Automated physical count auditing with Discrepancy & Variance Investigation Registry |
| Uncontrolled ordering without budget safeguards | Real-time Weekly Budget Cap monitor (`₹1,50,000` default) with over-budget alerts |
| Manual calculation of purchase quantities | Sales Velocity Engine calculating suggested replenishment based on 2-week run-rate & case sizes |
| No spoilage or bartender error accountability | Dedicated Wastage & Spoilage Tracker with P&L impact calculation |

---

## 🗄️ Database Files (Ready for Supabase)

1. **Schema Migration:** [`supabase/migrations/20261002000000_init_schema.sql`](file:///c:/Users/Jyotindra/Desktop/My%20Projects/Web/stock-inventory/supabase/migrations/20261002000000_init_schema.sql)
   - Tables: `categories`, `vendors`, `products`, `stock_take_sessions`, `stock_take_items`, `discrepancies`, `wastage_logs`, `purchase_orders`, `purchase_order_items`, `weekly_order_plans`, `stock_movements`.
   - Audit trigger automatically tracking `updated_at`.
2. **Seed Data:** [`supabase/migrations/20261002000001_seed_belmarose_data.sql`](file:///c:/Users/Jyotindra/Desktop/My%20Projects/Web/stock-inventory/supabase/migrations/20261002000001_seed_belmarose_data.sql)
   - Preloaded with all 20 exact liquor lines from Belmarose (Jagermeister, Budweiser, Corona, Hoegaarden, Chivas 12, Bacardi Blanca & DLX, Skyy, Bulldog, Cabron, Ciroc, Double Black, Black Label, Jack Daniels Fire/Honey/Old No. 7, Le Petit Merlot, Santa Julia Malbec, Pistola Reposado).
3. **Environment Setup:** [`.env`](file:///c:/Users/Jyotindra/Desktop/My%20Projects/Web/stock-inventory/.env) and [`.env.example`](file:///c:/Users/Jyotindra/Desktop/My%20Projects/Web/stock-inventory/.env.example)

---

## 🚀 Key Features Implemented

1. **Executive Dashboard:**
   - Real-time stock valuation in Indian Rupees (₹)
   - Critical out-of-stock and low-stock alerts
   - Unresolved discrepancies counter and financial variance loss
   - Weekly requisition spend vs budget ceiling progress bar
   - Top profit margin leaderboard (Menu Selling Price vs Purchase Cost)

2. **Inventory Master (Split-Pane Notion/Linear Aesthetic):**
   - Search by liquor name, SKU, or category
   - Left pane: Clean data table with stock level badges, costs, selling prices, margins
   - Right pane: Detailed inspection drawer with current stock, reorder point, case size, supplier contact, and an audit ledger

3. **Weekly Requisition & Order Engine:**
   - Velocity replenishment calculation based on 2-week sales run-rate
   - Real-time budget warning banner if requisition exceeds allocated cap
   - "Apply AI Suggestions" one-click filling
   - "Convert to Supplier POs" (automatically groups items by vendor)
   - "Printable Order Sheet" modal formatted for distributor dispatch

4. **Physical Stock Take (Staff-Optimized):**
   - Daily Opening, Daily Closing, and Spot Check audit modes
   - Physical count input with real-time variance calculation (`Counted - System`)
   - Automatic filing of Discrepancy tickets when variance is detected

5. **Discrepancy & Variance Investigation:**
   - Cumulative variance loss tracker
   - Workflow state: `Pending Review` -> `Investigating` -> `Resolved` -> `Written Off`
   - Manager resolution notes logger

6. **Wastage, Spoilage & Pour Loss Tracker:**
   - Log bottle breakage, spillage, flat beer, corked wine, and complimentary VIP rounds
   - Automatic financial impact calculation and stock balance deduction

7. **Purchase Orders & Delivery Check-in:**
   - PO list with status: `Draft`, `Submitted`, `Received`
   - Check-in delivery modal to verify supplier invoice quantities and auto-replenish shelf stock

8. **Role-Based Experience Switcher:**
   - Instant switching between **Admin (Owner)**, **Manager (Ordering)**, and **Staff (Stock-taking)** in the header.
