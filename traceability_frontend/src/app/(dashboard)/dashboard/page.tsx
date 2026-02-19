'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    FileText,
    Clock,
    TrendingUp,
    AlertCircle,
    Package,
} from 'lucide-react';
import api from '@/lib/api';
import { DashboardMetrics } from '@/types';

const MetricCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass dark:glass-dark rounded-[2rem] p-6 relative overflow-hidden group"
    >
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500`} style={{ backgroundColor: color }} />
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{value}</h3>
                <p className="text-xs text-slate-400 font-medium">{subtext}</p>
            </div>
            <div className={`p-4 rounded-2xl`} style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
    </motion.div>
);

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await api.get('/dashboard/metrics');
                setMetrics(res.data);
            } catch (err) {
                console.error('Failed to fetch metrics', err);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-[2rem]" />)}
            </div>
        </div>;
    }

    return (
        <div className="space-y-10 font-sans">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Overview</h1>
                <p className="text-slate-500">Real-time supply chain and batch traceability metrics.</p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Active Batches (Draft)"
                    value={metrics?.active_batches.draft || 0}
                    subtext="Pending review & locking"
                    icon={FileText}
                    color="#10b981"
                />
                <MetricCard
                    title="Published Batches"
                    value={metrics?.active_batches.locked || 0}
                    subtext="Immutable records on system"
                    icon={ShieldCheck}
                    color="#3b82f6"
                />
                <MetricCard
                    title="Pending COAs"
                    value={metrics?.pending_coas || 0}
                    subtext="Validation required"
                    icon={AlertCircle}
                    color="#f59e0b"
                />
                <MetricCard
                    title="Total Production"
                    value={metrics?.active_batches.total || 0}
                    subtext="Lifetime batch count"
                    icon={Package}
                    color="#8b5cf6"
                />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass dark:glass-dark rounded-[2rem] p-8 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Batch History
                        </h2>
                        <button className="text-sm font-medium text-primary hover:underline">View All</button>
                    </div>
                    <div className="flex items-center justify-center h-full text-slate-500 italic">
                        Chart component (Production Timeline) will be integrated here...
                    </div>
                </div>

                <div className="glass dark:glass-dark rounded-[2rem] p-8">
                    <h2 className="text-xl font-bold dark:text-white mb-8 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Activity
                    </h2>
                    <div className="space-y-6">
                        <p className="text-slate-500 text-sm italic">Connect the Audit Log websocket or fetch recent logs here...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
