'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Sprout, Calendar, Tag, ChevronRight, Activity, Beaker } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const stageColors = {
    'SOWING': 'bg-blue-500/10 text-blue-500',
    'GROWING': 'bg-emerald-500/10 text-emerald-500',
    'HARVESTED': 'bg-amber-500/10 text-amber-500',
    'PROCESSING': 'bg-purple-500/10 text-purple-500',
    'COMPLETED': 'bg-slate-500/10 text-slate-500',
};

export default function CropCyclesPage() {
    const [cycles, setCycles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCycles();
    }, []);

    async function fetchCycles() {
        try {
            const res = await api.get('/crop_cycles');
            setCycles(res.data.items);
        } catch (err) {
            toast.error('Failed to load crop cycles');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Crop Cycles</h1>
                    <p className="text-slate-500">Monitor harvesting schedules and seed-to-harvest timelines.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Log Initial Cycle
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by lot code or farmer..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {cycles.map((cycle, idx) => (
                        <motion.div
                            key={cycle.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all cursor-pointer"
                        >
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Sprout className="w-8 h-8" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold dark:text-white font-outfit">{cycle.lot_reference_code}</h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${(stageColors as any)[cycle.status] || 'bg-slate-500/10 text-slate-500'}`}>
                                        {cycle.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <Calendar className="w-4 h-4" />
                                        Started: {new Date(cycle.start_date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <Tag className="w-4 h-4" />
                                        Farmer ID: {cycle.farmer_id.substring(0, 8)}...
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-500 font-semibold whitespace-nowrap">
                                        <Beaker className="w-4 h-4" />
                                        COA Ready
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="hidden md:flex flex-col items-end mr-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Progress</p>
                                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '75%' }} />
                                    </div>
                                </div>
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary px-6 py-3 rounded-xl font-bold transition-all group/btn">
                                    View Timeline
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />)}
                </div>
            )}

            {!loading && cycles.length === 0 && (
                <div className="py-20 text-center glass dark:glass-dark rounded-[2.5rem]">
                    <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold dark:text-white mb-1">No crop cycles logged</h3>
                    <p className="text-slate-500">Farmers can log their seed-to-harvest data here to start the chain.</p>
                </div>
            )}
        </div>
    );
}
