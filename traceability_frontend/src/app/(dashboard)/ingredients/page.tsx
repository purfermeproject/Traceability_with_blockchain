'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, Beaker, MoreVertical, Shield, ShieldAlert, 
    X, Loader2, Edit2, Trash2, CheckCircle2, Info
} from 'lucide-react';
import api from '@/lib/api';
import { Ingredient } from '@/types';
import toast from 'react-hot-toast';

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const emptyForm = {
        name: '',
        type: 'Raw Material',
        requires_tracking: false,
        procurement_details: '',
        key_benefits: [] as { title: string; desc: string }[]
    };
    const [form, setForm] = useState(emptyForm);
    const [benefitForm, setBenefitForm] = useState({ title: '', desc: '' });

    useEffect(() => {
        fetchIngredients();
    }, []);

    async function fetchIngredients() {
        try {
            const res = await api.get('/recipes/ingredients');
            setIngredients(res.data || []);
        } catch (err) {
            toast.error('Failed to load ingredients');
        } finally {
            setLoading(false);
        }
    }

    const filteredIngredients = ingredients.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                key_benefits_json: JSON.stringify(form.key_benefits)
            };
            
            if (editingIngredient) {
                await api.put(`/recipes/ingredients/${editingIngredient.id}`, payload);
                toast.success('Ingredient updated successfully!');
            } else {
                await api.post('/recipes/ingredients', payload);
                toast.success('Ingredient registered successfully!');
            }
            handleCloseModal();
            fetchIngredients();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : 'Failed to save ingredient');
        } finally {
            setSubmitting(false);
        }
    }

    function handleEdit(ing: Ingredient) {
        setEditingIngredient(ing);
        let benefits: { title: string; desc: string }[] = [];
        try {
            if (ing.key_benefits_json) {
                const parsed = JSON.parse(ing.key_benefits_json);
                if (Array.isArray(parsed)) {
                    benefits = parsed.map(b => typeof b === 'string' ? { title: b, desc: '' } : b);
                }
            }
        } catch (e) {
            benefits = [];
        }

        setForm({
            name: ing.name,
            type: ing.type,
            requires_tracking: ing.requires_tracking,
            procurement_details: ing.procurement_details || '',
            key_benefits: benefits
        });
        setShowModal(true);
    }

    function handleCloseModal() {
        setShowModal(false);
        setEditingIngredient(null);
        setForm(emptyForm);
        setBenefitForm({ title: '', desc: '' });
    }

    const addBenefit = () => {
        if (!benefitForm.title.trim()) return;
        if (form.key_benefits.some(b => b.title.toLowerCase() === benefitForm.title.trim().toLowerCase())) {
            toast.error('Benefit title already exists');
            return;
        }
        setForm(prev => ({
            ...prev,
            key_benefits: [...prev.key_benefits, { ...benefitForm }]
        }));
        setBenefitForm({ title: '', desc: '' });
    };

    const removeBenefit = (index: number) => {
        setForm(prev => ({
            ...prev,
            key_benefits: prev.key_benefits.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Ingredients Master</h1>
                    <p className="text-slate-500">Manage base materials and transparency metadata for the consumer portal.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Add Ingredient
                </button>
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search by ingredient name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredIngredients.map((ing, idx) => (
                        <motion.div
                            key={ing.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-[2rem] p-6 hover:border-primary/50 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <Beaker className="w-8 h-8" />
                                </div>
                                <button
                                    onClick={() => handleEdit(ing)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{ing.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-black uppercase tracking-widest">
                                        {ing.type}
                                    </span>
                                    {ing.requires_tracking && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-black uppercase tracking-widest flex items-center gap-1">
                                            <Shield className="w-3 h-3" /> Tracked
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-sm mt-4 line-clamp-2 italic">
                                    {ing.procurement_details || 'No procurement details recorded.'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex -space-x-2">
                                    {ing.key_benefits_json && JSON.parse(ing.key_benefits_json).length > 0 ? (
                                        JSON.parse(ing.key_benefits_json).slice(0, 3).map((_: any, i: number) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-slate-900 flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-slate-500">No benefits listed</div>
                                    )}
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {ing.procurement_details ? 'Transparency: High' : 'Transparency: low'}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            )}

            {/* ── Ingredient Modal ────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <div
                        className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
                        onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl mt-[5vh] mb-12"
                        >
                            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Beaker className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-outfit">
                                            {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
                                        </h2>
                                        <p className="text-sm text-slate-400">
                                            Manage material data and consumer transparency info.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-2 px-1 text-xs uppercase tracking-widest">Material Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Organic Oats"
                                                required
                                                value={form.name}
                                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3 px-4 text-white outline-none transition-all placeholder:text-slate-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-2 px-1 text-xs uppercase tracking-widest">Category Type</label>
                                            <select
                                                value={form.type}
                                                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3 px-4 text-white outline-none transition-all appearance-none"
                                            >
                                                <option value="Raw Material">Raw Material</option>
                                                <option value="Packaging">Packaging</option>
                                                <option value="Additive">Additive</option>
                                                <option value="Spice">Spice</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 group hover:border-emerald-500/50 transition-all cursor-pointer"
                                             onClick={() => setForm(prev => ({ ...prev, requires_tracking: !prev.requires_tracking }))}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${form.requires_tracking ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white">Require Tracking</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Enable for farm-to-fork tracing</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.requires_tracking ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'}`}>
                                                {form.requires_tracking && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-2 px-1 text-xs uppercase tracking-widest flex items-center gap-2">
                                                Procurement Details
                                                <Info className="w-3 h-3 text-primary" />
                                            </label>
                                            <textarea
                                                rows={4}
                                                placeholder="Where and how is this sourced? (For consumers)"
                                                value={form.procurement_details}
                                                onChange={(e) => setForm(prev => ({ ...prev, procurement_details: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-3 px-4 text-white outline-none transition-all placeholder:text-slate-600 resize-none text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-2 px-1 text-xs uppercase tracking-widest">Key Benefits</label>
                                            <div className="space-y-2 mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Benefit Title (e.g. Non-GMO)"
                                                    value={benefitForm.title}
                                                    onChange={(e) => setBenefitForm(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2 px-4 text-white outline-none transition-all text-sm"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Description (Optional)"
                                                        value={benefitForm.desc}
                                                        onChange={(e) => setBenefitForm(prev => ({ ...prev, desc: e.target.value }))}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                                        className="flex-1 bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2 px-4 text-white outline-none transition-all text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addBenefit}
                                                        className="p-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {form.key_benefits.map((benefit, idx) => (
                                                    <div key={idx} className="flex items-start justify-between bg-white/5 border border-white/10 p-3 rounded-xl group transition-all">
                                                        <div>
                                                            <p className="text-xs font-bold text-white">{benefit.title}</p>
                                                            {benefit.desc && (
                                                                <p className="text-[10px] text-slate-500 line-clamp-1">{benefit.desc}</p>
                                                            )}
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeBenefit(idx)}
                                                            className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {form.key_benefits.length === 0 && (
                                                    <p className="text-[10px] text-slate-600 italic px-1 font-bold">No benefits added yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-8">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold transition-all border border-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-3 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                                        ) : (
                                            editingIngredient ? (
                                                <><Edit2 className="w-5 h-5" /> Update Ingredient</>
                                            ) : (
                                                <><Plus className="w-5 h-5" /> Register Ingredient</>
                                            )
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
