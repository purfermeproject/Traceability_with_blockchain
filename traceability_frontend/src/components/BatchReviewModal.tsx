'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Clock, AlertTriangle, CheckCircle2, Loader2, Lock, ArrowRight, ExternalLink, MapPin, Truck, Sprout, FileText, Edit2 } from 'lucide-react';
import Portal from './Portal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface BatchReviewModalProps {
    isOpen: boolean;
    batchId: string | null;
    onClose: () => void;
    onLockSuccess: () => void;
}

export default function BatchReviewModal({ isOpen, batchId, onClose, onLockSuccess }: BatchReviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isEditingDocs, setIsEditingDocs] = useState(false);
    const [editDocs, setEditDocs] = useState({
        forensic_report_url: '',
        ingredients: [] as any[]
    });

    useEffect(() => {
        if (isOpen && batchId) {
            fetchReviewData();
        }
    }, [isOpen, batchId]);

    async function fetchReviewData() {
        setLoading(true);
        try {
            const res = await api.get(`/batches/${batchId}/review`);
            setReviewData(res.data);
            setEditDocs({
                forensic_report_url: res.data.forensic_report_url || '',
                ingredients: res.data.ingredients.map((ing: any) => ({
                    ingredient_id: ing.ingredient_id,
                    coa_status: ing.coa_status,
                    coa_link: ing.coa_link || ''
                }))
            });
        } catch (err) {
            toast.error('Failed to load review data');
            onClose();
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveCompliance() {
        if (!batchId) return;
        setSubmitting(true);
        try {
            await api.patch(`/batches/${batchId}/compliance`, editDocs);
            toast.success('Compliance documents updated!');
            setIsEditingDocs(false);
            fetchReviewData();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update compliance');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleLock() {
        if (!batchId) return;
        setSubmitting(true);
        try {
            await api.post(`/batches/${batchId}/lock`);
            toast.success('Batch locked and published to blockchain!');
            onLockSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to lock batch');
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Quality Assurance Review
                                    <span className={`text-[10px] px-2 py-1 rounded-lg align-middle ml-2 ${reviewData?.status === 'LOCKED' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {reviewData?.status || 'LOADING...'}
                                    </span>
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">Verify ingredient composition and sourcing before blockchain publication.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-slate-500 font-bold animate-pulse">Running deviation analysis...</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Batch Info Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="glass dark:glass-dark p-6 rounded-3xl border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Identifier</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{reviewData.batch_code}</p>
                                    </div>
                                    <div className="glass dark:glass-dark p-6 rounded-3xl border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Composition</p>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-xl font-black ${reviewData.is_lockable ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {reviewData.total_actual_percentage}%
                                            </p>
                                            {reviewData.is_lockable ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="glass dark:glass-dark p-6 rounded-3xl border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">QA Warnings</p>
                                        <p className={`text-xl font-black ${reviewData.warnings.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {reviewData.warnings.length} Issues Found
                                        </p>
                                    </div>
                                </div>

                                {/* Compliance Documents Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Compliance Documentation</h3>
                                        {reviewData?.status === 'DRAFT' && !isEditingDocs && (
                                            <button
                                                onClick={() => setIsEditingDocs(true)}
                                                className="text-[10px] font-black uppercase text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                Update Documents
                                            </button>
                                        )}
                                        {isEditingDocs && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        setIsEditingDocs(false);
                                                        fetchReviewData();
                                                    }}
                                                    className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveCompliance}
                                                    disabled={submitting}
                                                    className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                                                >
                                                    {submitting ? 'Saving...' : 'Save All Changes'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`glass dark:glass-dark p-6 rounded-3xl border transition-all ${reviewData.forensic_report_url || isEditingDocs ? 'border-primary/20' : 'border-amber-500/20 bg-amber-500/5'}`}>
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-4 min-w-[200px]">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reviewData.forensic_report_url || isEditingDocs ? 'bg-primary text-white' : 'bg-amber-500 text-white'}`}>
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">Full Forensic Report</h4>
                                                    <p className="text-xs text-slate-500">Master compliance link</p>
                                                </div>
                                            </div>

                                            {isEditingDocs ? (
                                                <div className="flex-1 max-w-md relative group">
                                                    <input
                                                        type="text"
                                                        value={editDocs.forensic_report_url}
                                                        onChange={(e) => setEditDocs({ ...editDocs, forensic_report_url: e.target.value })}
                                                        placeholder="Paste PDF URL (e.g. Google Drive)"
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 text-xs dark:text-white outline-none focus:border-primary transition-all pr-12"
                                                    />
                                                    <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                </div>
                                            ) : (
                                                <>
                                                    {reviewData.forensic_report_url ? (
                                                        <a
                                                            href={reviewData.forensic_report_url}
                                                            target="_blank"
                                                            className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary transition-all hover:text-white"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            View Report
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg">Missing Document</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Ingredient Table */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Ingredient Deviation Report</h3>
                                    <div className="glass dark:glass-dark rounded-[2rem] overflow-hidden border-slate-100 dark:border-slate-800 shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    <th className="px-6 py-4">Ingredient ID</th>
                                                    <th className="px-6 py-4">Recipe (Exp)</th>
                                                    <th className="px-6 py-4">Actual (Log)</th>
                                                    <th className="px-6 py-4">Deviation</th>
                                                    <th className="px-6 py-4">Compliance (COA)</th>
                                                    <th className="px-6 py-4 text-right">QA Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {reviewData.ingredients.map((ing: any, idx: number) => (
                                                    <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-primary" />
                                                                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-xs">{ing.ingredient_id}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-500">{ing.expected_percentage}%</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{ing.actual_percentage}%</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-xs font-black ${ing.deviation === 0 ? 'text-emerald-500' :
                                                                ing.has_deviation ? 'text-red-500' : 'text-amber-500'
                                                                }`}>
                                                                {ing.deviation > 0 ? '+' : ''}{ing.deviation}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isEditingDocs ? (
                                                                <input
                                                                    type="text"
                                                                    value={editDocs.ingredients.find(i => i.ingredient_id === ing.ingredient_id)?.coa_link || ''}
                                                                    onChange={(e) => {
                                                                        const newIngs = [...editDocs.ingredients];
                                                                        const idx = newIngs.findIndex(i => i.ingredient_id === ing.ingredient_id);
                                                                        if (idx !== -1) {
                                                                            newIngs[idx].coa_link = e.target.value;
                                                                            newIngs[idx].coa_status = e.target.value ? 'AVAILABLE' : 'PENDING';
                                                                            setEditDocs({ ...editDocs, ingredients: newIngs });
                                                                        }
                                                                    }}
                                                                    placeholder="COA URL"
                                                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-[10px] dark:text-white outline-none focus:border-primary transition-all"
                                                                />
                                                            ) : (
                                                                <>
                                                                    {ing.coa_link ? (
                                                                        <a
                                                                            href={ing.coa_link}
                                                                            target="_blank"
                                                                            className="flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                                                                        >
                                                                            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </div>
                                                                            <span className="text-[10px] font-black uppercase tracking-tight">View Lab Report</span>
                                                                        </a>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                                            <div className="w-6 h-6 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center">
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                            </div>
                                                                            <span className="text-[10px] font-black uppercase tracking-tight italic">Pending</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {ing.has_deviation ? (
                                                                <div className="flex items-center justify-end gap-1.5 text-red-500 font-bold text-[10px]">
                                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                                    OUT OF SPEC
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-1.5 text-emerald-500 font-bold text-[10px]">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    NOMINAL
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {reviewData.warnings.length > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex gap-4">
                                        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                        <div>
                                            <h4 className="font-black text-amber-700 dark:text-amber-500 text-sm uppercase tracking-tight mb-1">Batch Warning</h4>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                                                This batch has {reviewData.warnings.length} ingredients that deviate significantly from the registered recipe.
                                                Locking this batch will publish these deviations as part of the immutable blockchain record.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
                        <p className="text-xs text-slate-500 max-w-sm font-medium leading-relaxed">
                            <Lock className="w-3 h-3 inline mr-1 mb-0.5" />
                            Locking is irreversible. Immutable snapshots of all vendor and farm data will be stored with this record.
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-outfit"
                            >
                                Close Review
                            </button>
                            {reviewData?.status === 'DRAFT' && (
                                <button
                                    disabled={submitting || !reviewData?.is_lockable}
                                    onClick={handleLock}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 font-outfit group"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</>
                                    ) : (
                                        <>
                                            CONFIRM & LOCK BATCH
                                            <ShieldCheck className="w-5 h-5 ml-1 transition-transform group-hover:scale-110" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}
