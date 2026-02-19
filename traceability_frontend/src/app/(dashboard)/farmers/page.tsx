'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, User, MoreVertical, Shield, ShieldAlert, Activity } from 'lucide-react';
import api from '@/lib/api';
import { Farmer } from '@/types';
import toast from 'react-hot-toast';

export default function FarmersPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFarmers();
    }, []);

    async function fetchFarmers() {
        try {
            const res = await api.get('/farmers');
            setFarmers(res.data.items);
        } catch (err) {
            toast.error('Failed to load farmers');
        } finally {
            setLoading(false);
        }
    }

    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Farmers</h1>
                    <p className="text-slate-500">Manage and onboard farm partners for the blockchain network.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Onboard Farmer
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {farmers.filter(f => f.is_active).length} Active Partners
                    </span>
                </div>
            </div>

            <div className="glass dark:glass-dark rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="px-8 py-5 text-sm font-semibold text-slate-500">Name & Details</th>
                                <th className="px-8 py-5 text-sm font-semibold text-slate-500">Contact</th>
                                <th className="px-8 py-5 text-sm font-semibold text-slate-500">Status</th>
                                <th className="px-8 py-5 text-sm font-semibold text-slate-500">Farms</th>
                                <th className="px-8 py-5 text-sm font-semibold text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <AnimatePresence>
                                {filteredFarmers.map((farmer, idx) => (
                                    <motion.tr
                                        key={farmer.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{farmer.name}</p>
                                                    <p className="text-xs text-slate-400">Partner #: {farmer.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-400">{farmer.contact_number}</td>
                                        <td className="px-8 py-6">
                                            {farmer.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                                    <Shield className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-500 text-xs font-bold">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-sm">
                                            <button className="text-primary hover:underline font-medium">View Farms</button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <MoreVertical className="w-5 h-5 text-slate-400" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {loading && (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-500 font-medium">Synchronizing with blockchain network...</p>
                    </div>
                )}

                {!loading && filteredFarmers.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold dark:text-white mb-1">No farmers found</h3>
                        <p className="text-slate-500">Try adjusting your search filters or onboard a new partner.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
