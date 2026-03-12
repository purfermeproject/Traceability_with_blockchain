'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    QrCode,
    Download,
    ExternalLink,
    ShieldCheck,
    Clock,
    FileText,
    Printer,
    Grid
} from 'lucide-react';
import api from '@/lib/api';
import { Batch } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function QRManagementPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBatches();
    }, []);

    async function fetchBatches() {
        try {
            // We only care about LOCKED batches for QR generation
            const res = await api.get('/batches');
            const lockedBatches = res.data.items.filter((b: Batch) => b.status === 'LOCKED');
            setBatches(lockedBatches);
        } catch (err) {
            toast.error('Failed to load locked batches');
        } finally {
            setLoading(false);
        }
    }

    const handleDownloadQR = async (batchCode: string) => {
        try {
            const response = await api.get(`/qr/${batchCode}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `QR_${batchCode}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`QR Code for ${batchCode} downloaded!`);
        } catch (err) {
            toast.error('Failed to download QR code');
        }
    };

    const filteredBatches = batches.filter(b =>
        b.batch_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">QR Management</h1>
                    <p className="text-slate-500">Generate and export traceability QR codes for published batches.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Printer className="w-4 h-4" />
                        Print Sheet
                    </button>
                    <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                        <Download className="w-4 h-4" />
                        Export All
                    </button>
                </div>
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
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4">
                    <Grid className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Layout: Compact</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredBatches.map((batch, idx) => (
                        <motion.div
                            key={batch.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-[2.5rem] p-6 text-center group border border-white/5 hover:border-primary/50 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Decorative QR background */}
                            <QrCode className="absolute -right-8 -bottom-8 w-32 h-32 text-primary opacity-[0.03] group-hover:scale-110 transition-transform duration-700 -rotate-12" />

                            <div className="flex flex-col items-center relative z-10">
                                <div className="w-32 h-32 bg-white rounded-3xl p-3 shadow-2xl shadow-black/20 mb-6 group-hover:scale-105 transition-transform duration-500 relative">
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/qr/${batch.batch_code}`}
                                        alt={batch.batch_code}
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                                        <Download className="w-8 h-8 text-primary drop-shadow-lg" />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">
                                        <ShieldCheck className="w-3 h-3" />
                                        IMMUTABLE
                                    </div>
                                    <h3 className="text-xl font-bold dark:text-white font-outfit truncate max-w-full px-2">{batch.batch_code}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Locked {format(new Date(batch.locked_at || Date.now()), 'MMM d, yyyy')}</p>
                                </div>

                                <div className="flex w-full gap-2">
                                    <button
                                        onClick={() => handleDownloadQR(batch.batch_code)}
                                        className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        PNG
                                    </button>
                                    <Link
                                        href={`/journey/${batch.batch_code}`}
                                        target="_blank"
                                        className="w-12 bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl flex items-center justify-center transition-all group/link relative z-20"
                                    >
                                        <ExternalLink className="w-5 h-5 text-slate-400 group-hover/link:text-primary" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 bg-slate-100 dark:bg-slate-900/50 animate-pulse rounded-[2.5rem]" />
                    ))}
                </div>
            )}

            {!loading && filteredBatches.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center glass rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6">
                        <QrCode className="w-10 h-10 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white mb-2">No QR codes available</h2>
                    <p className="text-slate-500 max-w-sm text-center">QR codes are generated automatically once a batch is successfully Review-Locked.</p>
                </div>
            )}
        </div>
    );
}
