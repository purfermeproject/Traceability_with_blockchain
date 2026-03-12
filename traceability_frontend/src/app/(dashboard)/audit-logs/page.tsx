'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, User, Info, Search, Calendar, Terminal } from 'lucide-react';
import api from '@/lib/api';
import { AuditLog } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        try {
            const res = await api.get('audit-logs');
            setLogs(res.data.items);
        } catch (err) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 font-sans">
            <header>
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    <Terminal className="w-3 h-3" />
                    Restricted Access
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Audit Ledger (Refreshed)</h1>
                <p className="text-slate-500">Immutable record of all administrative actions performed on the platform.</p>
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Filter by action or user ID..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {filteredLogs.map((log, idx) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="glass dark:glass-dark rounded-2xl p-6 border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                        >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                <Shield className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{log.action}</h4>
                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                        ID: #{log.id}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <User className="w-3.5 h-3.5" />
                                        Admin: {log.user_name || log.user_email}
                                    </span>
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <Clock className="w-3.5 h-3.5" />
                                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                    Inspect Data
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-2xl" />)}
                </div>
            )}

            {!loading && filteredLogs.length === 0 && (
                <div className="py-20 text-center glass rounded-3xl">
                    <p className="text-slate-500">No audit logs found.</p>
                </div>
            )}
        </div>
    );
}
