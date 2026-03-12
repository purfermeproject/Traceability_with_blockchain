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
    ArrowRight,
    Trash2,
    Hash,
    AlertTriangle,
    Loader2,
    Copy,
    CheckCircle2
} from 'lucide-react';
import api from '@/lib/api';
import { Batch } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import BatchModal from '@/components/BatchModal';
import BatchReviewModal from '@/components/BatchReviewModal';

export default function BatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [hashModal, setHashModal] = useState<{ open: boolean; loading: boolean; data: any }>({ open: false, loading: false, data: null });
    const [copied, setCopied] = useState(false);

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

    const handleLockBatch = async (batchId: string) => {
        try {
            await api.post(`/batches/${batchId}/lock`);
            toast.success('Batch locked and published to blockchain!');
            fetchBatches();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to lock batch');
        }
    };

    const handleDeleteBatch = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/batches/${deleteTarget.id}`);
            toast.success(`Batch ${deleteTarget.code} deleted permanently`);
            setDeleteTarget(null);
            fetchBatches();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete batch');
        } finally {
            setDeleting(false);
        }
    };

    const handleGenerateHash = async (batchId: string) => {
        setHashModal({ open: true, loading: true, data: null });
        try {
            const res = await api.post(`/batches/${batchId}/generate-hash`);
            setHashModal({ open: true, loading: false, data: res.data });
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to generate hash');
            setHashModal({ open: false, loading: false, data: null });
        }
    };

    const copyHash = (hash: string) => {
        navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Batch Lifecycle</h1>
                    <p className="text-slate-500">Review, validate, and publish production batches to the blockchain.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
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
                                    <p suppressHydrationWarning className="text-sm dark:text-slate-300 font-medium">
                                        {batch.created_at ? format(new Date(batch.created_at), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedBatchId(batch.id);
                                        setShowReviewModal(true);
                                    }}
                                    className="flex-1 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <Eye className="w-4 h-4" />
                                    Review
                                </button>
                                {batch.status === 'LOCKED' ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateHash(batch.id);
                                        }}
                                        className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                                    >
                                        <Hash className="w-4 h-4" />
                                        View Hash
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLockBatch(batch.id);
                                        }}
                                        className="flex-1 bg-primary text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                                    >
                                        Lock Batch
                                        <Lock className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTarget({ id: batch.id, code: batch.batch_code });
                                    }}
                                    className="w-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                    title="Delete batch"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
            {/* Modal */}
            <BatchModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchBatches}
            />

            <BatchReviewModal
                isOpen={showReviewModal}
                batchId={selectedBatchId}
                onClose={() => setShowReviewModal(false)}
                onLockSuccess={fetchBatches}
            />

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !deleting && setDeleteTarget(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white/20 p-8"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Delete Batch</h3>
                                    <p className="text-sm text-slate-500 font-medium">This action is permanent and cannot be undone.</p>
                                </div>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl mb-6">
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    You are about to permanently delete batch <span className="font-black text-red-500">{deleteTarget.code}</span> and all its associated ingredient records.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 justify-end">
                                <button
                                    disabled={deleting}
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={deleting}
                                    onClick={handleDeleteBatch}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
                                >
                                    {deleting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4" /> Delete Permanently</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hash Display Modal */}
            <AnimatePresence>
                {hashModal.open && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setHashModal({ open: false, loading: false, data: null })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white/20 p-8"
                        >
                            {hashModal.loading ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                    <p className="text-slate-500 font-bold animate-pulse">Computing SHA-256 hash...</p>
                                </div>
                            ) : hashModal.data && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                            <Hash className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Blockchain Hash</h3>
                                            <p className="text-sm text-slate-500 font-medium">{hashModal.data.batch_code}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stored Hash (SHA-256)</label>
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                                <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{hashModal.data.stored_hash}</code>
                                                <button
                                                    onClick={() => copyHash(hashModal.data.stored_hash)}
                                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                                                    title="Copy hash"
                                                >
                                                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${hashModal.data.integrity_ok
                                            ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                                            }`}>
                                            {hashModal.data.integrity_ok ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                            )}
                                            <div>
                                                <p className={`text-sm font-bold ${hashModal.data.integrity_ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                                    {hashModal.data.integrity_ok ? 'Integrity Verified' : 'Integrity Mismatch'}
                                                </p>
                                                <p className={`text-xs ${hashModal.data.integrity_ok ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                    {hashModal.data.integrity_ok
                                                        ? 'Computed hash matches the stored blockchain hash.'
                                                        : 'WARNING: The computed hash does NOT match the stored hash. Data may have been tampered with.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setHashModal({ open: false, loading: false, data: null })}
                                        className="w-full py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
