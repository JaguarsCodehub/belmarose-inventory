import React from 'react';
import {
  LayoutDashboard,
  Wine,
  ShoppingCart,
  ClipboardCheck,
  AlertTriangle,
  Trash2,
  Truck,
  Building2,
  ChevronRight,
  Database,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types/database';

export type NavItem =
  | 'dashboard'
  | 'inventory'
  | 'ordering'
  | 'stock-take'
  | 'discrepancies'
  | 'wastage'
  | 'receiving'
  | 'vendors';

interface SidebarProps {
  currentTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  currentRole: UserRole;
}

export function Sidebar({ currentTab, onTabChange, currentRole }: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard' as NavItem,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
      badge: undefined,
    },
    {
      id: 'inventory' as NavItem,
      label: 'Inventory Master',
      icon: Wine,
      roles: ['admin', 'manager', 'staff'],
      badge: '20',
    },
    {
      id: 'ordering' as NavItem,
      label: 'Weekly Ordering',
      icon: ShoppingCart,
      roles: ['admin', 'manager'],
      badge: 'Suggest',
    },
    {
      id: 'stock-take' as NavItem,
      label: 'Physical Stock Take',
      icon: ClipboardCheck,
      roles: ['admin', 'manager', 'staff'],
      badge: undefined,
    },
    {
      id: 'discrepancies' as NavItem,
      label: 'Discrepancy Audit',
      icon: AlertTriangle,
      roles: ['admin', 'manager'],
      badge: '3',
      alert: true,
    },
    {
      id: 'wastage' as NavItem,
      label: 'Wastage & Spoilage',
      icon: Trash2,
      roles: ['admin', 'manager', 'staff'],
      badge: undefined,
    },
    {
      id: 'receiving' as NavItem,
      label: 'Purchase Orders',
      icon: Truck,
      roles: ['admin', 'manager'],
      badge: undefined,
    },
    {
      id: 'vendors' as NavItem,
      label: 'Suppliers & Vendors',
      icon: Building2,
      roles: ['admin', 'manager'],
      badge: undefined,
    },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0F172A] text-slate-300 flex flex-col justify-between border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 text-sm">
            🍸
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">BELMAROSE</h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">BAR & INVENTORY</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Operations
          </div>
          {allowedItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left group',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      isActive
                        ? 'bg-blue-700 text-white'
                        : item.alert
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Outlet Location Indicator & DB schema link */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-200">Main Bar (Outlet #1)</span>
          </div>
          <span className="text-[10px] text-slate-500">Single Loc v1</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">20 Liquor Lines Active</p>
      </div>
    </aside>
  );
}
