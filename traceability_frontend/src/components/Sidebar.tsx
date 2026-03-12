'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Sprout,
    Truck,
    Package,
    ClipboardList,
    ShieldCheck,
    Users,
    Beaker,
    LogOut,
    ChevronRight,
    QrCode,
    User as UserIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/hooks/useAuth';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'Farmers', href: '/farmers', icon: Sprout, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'Vendors', href: '/vendors', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'Ingredients', href: '/ingredients', icon: Beaker, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'Crop Cycles', href: '/crop-cycles', icon: ClipboardList, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'Recipes', href: '/recipes', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'Batches', href: '/batches', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'QA'] },
    { name: 'QR Management', href: '/qr-management', icon: QrCode, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Admin Logs', href: '/audit-logs', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
    { name: 'User Management', href: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'My Profile', href: '/profile', icon: UserIcon, roles: ['SUPER_ADMIN', 'ADMIN', 'QA', 'FARMER'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const filteredItems = navItems.filter(item =>
        !user || item.roles.includes(user.role)
    );

    return (
        <div className="flex flex-col h-screen w-64 glass-dark border-r border-slate-800 text-slate-300">
            <div className="p-6 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sprout className="text-white w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    PurFerme
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-lg shadow-primary/50" />
                            )}
                            {isActive && (
                                <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-white/5 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Admin User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.role || 'Guest'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
