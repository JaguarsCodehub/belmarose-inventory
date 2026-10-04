import React from 'react';
import { UserRole } from '../../types/database';
import { isSupabaseConfigured } from '../../lib/supabase';
import { ShieldCheck, UserCheck, Users, Database, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  title: string;
}

export function Header({ currentRole, onRoleChange, title }: HeaderProps) {
  const isConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight text-slate-900">{title}</h1>
        <span className="hidden sm:inline-block text-xs text-slate-400">|</span>
        <div className="hidden sm:flex items-center gap-1.5">
          <Badge
            variant={isConnected ? 'success' : 'secondary'}
            dot
            className="text-[11px] font-medium"
          >
            {isConnected ? 'Supabase Connected' : 'Local State Engine (Ready to Sync)'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Switcher Demo */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
          <span className="px-2 text-[11px] font-medium text-slate-500 hidden md:inline">
            Active Role:
          </span>
          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              currentRole === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Full administrative permissions, budgets, discrepancy resolution"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => onRoleChange('manager')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              currentRole === 'manager'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ordering, requisition planning, PO generation"
          >
            <UserCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>Manager</span>
          </button>
          <button
            onClick={() => onRoleChange('staff')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              currentRole === 'staff'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Daily physical counts, stock-taking, wastage logging"
          >
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span>Staff</span>
          </button>
        </div>

        <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium text-xs">
          {currentRole === 'admin' ? 'AD' : currentRole === 'manager' ? 'MG' : 'ST'}
        </div>
      </div>
    </header>
  );
}
