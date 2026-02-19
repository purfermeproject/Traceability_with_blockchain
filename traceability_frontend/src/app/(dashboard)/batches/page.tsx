'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    Lock,
    FileText,
    ShieldCheck,
    Clock,
    Eye,
    QrCode,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { Batch } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function BatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBatches();
    }, []);

    async function fetchBatches() {
        try {
            const res = await api.get('/batches');
            setBatches(res.data.items);
        } catch (err) {
            toast.error('Failed to load batches');
        } finally {
            setLoading(false);
        }
    }

    const filteredBatches = batches.filter(b =>
        b.batch_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Batch Lifecycle</h1>
                    <p className="text-slate-500">Review, validate, and publish production batches to the blockchain.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Create New Batch
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by batch code..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Filter className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filters</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredBatches.map((batch, idx) => (
                        <motion.div
                            key={batch.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-[2.5rem] p-8 border-white/5 relative group cursor-pointer hover:border-primary/30 transition-all duration-300 shadow-xl hover:shadow-primary/5"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${batch.status === 'LOCKED' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                    {batch.status === 'LOCKED' ? <ShieldCheck className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${batch.status === 'LOCKED' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'
                                    }`}>
                                    {batch.status}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Batch Code</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-outfit">{batch.batch_code}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Created</p>
                                    <p className="text-sm dark:text-slate-300 font-medium">{format(new Date(batch.created_at), 'MMM dd, yyyy')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">SKU Reference</p>
                                    <p className="text-sm dark:text-slate-300 font-medium">PF-OATS-01</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                    <Eye className="w-4 h-4" />
                                    Review
                                </button>
                                {batch.status === 'LOCKED' ? (
                                    <button className="w-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform">
                                        <QrCode className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button className="flex-1 bg-primary text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all">
                                        Lock Batch
                                        <Lock className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                                <ArrowRight className="w-6 h-6 text-primary" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-80 bg-slate-100 dark:bg-slate-900/50 animate-pulse rounded-[2.5rem]" />
                    ))}
                </div>
            )}

            {!loading && filteredBatches.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white mb-2">No active batches</h2>
                    <p className="text-slate-500 max-w-sm text-center">Start tracking your product journey by creating a new production batch.</p>
                </div>
            )}
        </div>
    );
}
