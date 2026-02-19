'use client';

import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !localStorage.getItem('access_token')) {
            router.push('/login');
        }
    }, [loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Admin Console</h2>
                        <div className="h-4 w-px bg-slate-200 dark:border-slate-800" />
                        <span className="text-sm text-slate-500">Welcome back, {user?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {user?.role}
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#020617]">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
