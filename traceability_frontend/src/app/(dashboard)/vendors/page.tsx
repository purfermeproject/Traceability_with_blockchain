'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Truck, MoreVertical, Shield, ShieldAlert, Globe, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { Vendor } from '@/types';
import toast from 'react-hot-toast';

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    async function fetchVendors() {
        try {
            const res = await api.get('/vendors');
            setVendors(res.data.items);
        } catch (err) {
            toast.error('Failed to load vendors');
        } finally {
            setLoading(false);
        }
    }

    const filteredVendors = vendors.filter(v =>
        v.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Vendors</h1>
                    <p className="text-slate-500">Manage third-party suppliers and manufacturing partners.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Register Vendor
                </button>
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search by company name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredVendors.map((vendor, idx) => (
                        <motion.div
                            key={vendor.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-[2rem] p-6 hover:border-primary/50 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                                    <Truck className="w-8 h-8" />
                                </div>
                                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{vendor.company_name}</h3>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {vendor.location || 'Global Supplier'}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    {vendor.is_active ? (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                            <Shield className="w-4 h-4" />
                                            ACTIVE
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <ShieldAlert className="w-4 h-4" />
                                            INACTIVE
                                        </span>
                                    )}
                                </div>
                                <button className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                                    <Globe className="w-4 h-4" />
                                    View Catalog
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-[2rem]" />)}
                </div>
            )}

            {!loading && filteredVendors.length === 0 && (
                <div className="py-20 text-center">
                    <p className="text-slate-500">No vendors found matching your search.</p>
                </div>
            )}
        </div>
    );
}
