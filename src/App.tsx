import React, { useState } from 'react';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { UserRole } from './types/database';

// Views
import { DashboardView } from './views/DashboardView';
import { InventorySplitView } from './views/InventorySplitView';
import { WeeklyOrderingView } from './views/WeeklyOrderingView';
import { StockTakeView } from './views/StockTakeView';
import { DiscrepanciesView } from './views/DiscrepanciesView';
import { WastageView } from './views/WastageView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { VendorsView } from './views/VendorsView';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Title mapping
  const titleMap: Record<NavItem, string> = {
    dashboard: 'Executive Dashboard & P&L',
    inventory: 'Inventory Master (Split-Pane)',
    ordering: 'Weekly Requisition & Order Engine',
    'stock-take': 'Physical Stock Take & Handover Audit',
    discrepancies: 'Discrepancy & Variance Investigation',
    wastage: 'Wastage, Spoilage & Pour Loss',
    receiving: 'Purchase Orders & Inbound Shipments',
    vendors: 'Suppliers & Distributor Accounts',
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentRole={currentRole}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky App Header with Role Switcher & Sync Badge */}
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          title={titleMap[currentTab]}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView onNavigate={setCurrentTab} />
          )}

          {currentTab === 'inventory' && (
            <InventorySplitView currentRole={currentRole} />
          )}

          {currentTab === 'ordering' && (
            <WeeklyOrderingView
              currentRole={currentRole}
              onNavigateToPOs={() => setCurrentTab('receiving')}
            />
          )}

          {currentTab === 'stock-take' && (
            <StockTakeView
              currentRole={currentRole}
              onNavigateToDiscrepancies={() => setCurrentTab('discrepancies')}
            />
          )}

          {currentTab === 'discrepancies' && (
            <DiscrepanciesView currentRole={currentRole} />
          )}

          {currentTab === 'wastage' && (
            <WastageView currentRole={currentRole} />
          )}

          {currentTab === 'receiving' && (
            <PurchaseOrdersView
              currentRole={currentRole}
              onNavigateToOrdering={() => setCurrentTab('ordering')}
            />
          )}

          {currentTab === 'vendors' && (
            <VendorsView currentRole={currentRole} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
