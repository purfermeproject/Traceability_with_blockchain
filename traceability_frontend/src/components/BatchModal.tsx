'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Beaker, Package, Layers, Loader2, Search, Check, ChevronDown, ShieldCheck, MapPin, Truck, Sprout, ArrowRight } from 'lucide-react';
import Portal from './Portal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Product, CropCycle, Vendor } from '@/types';

interface BatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BatchModal({ isOpen, onClose, onSuccess }: BatchModalProps) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Data lists
    const [products, setProducts] = useState<any[]>([]);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        batch_code: '',
        product_id: '',
        recipe_id: '',
        forensic_report_url: ''
    });

    const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            fetchCropCycles();
            fetchVendors();
            // Reset state
            setStep(1);
            setFormData({ batch_code: '', product_id: '', recipe_id: '', forensic_report_url: '' });
            setSelectedIngredients([]);
        }
    }, [isOpen]);

    async function fetchProducts() {
        try {
            const res = await api.get('/recipes/products');
            setProducts(res.data || []);
        } catch (err) {
            toast.error('Failed to load products');
        }
    }

    async function fetchCropCycles() {
        try {
            const res = await api.get('/crop-cycles');
            setCropCycles(res.data.items || []);
        } catch (err) {
            toast.error('Failed to load crop cycles');
        }
    }

    async function fetchVendors() {
        try {
            const res = await api.get('/vendors');
            setVendors(res.data.items || []);
        } catch (err) {
            toast.error('Failed to load vendors');
        }
    }

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId);
        setFormData({ ...formData, product_id: productId, recipe_id: product?.recipes?.[0]?.id || '' });
    };

    const handleNextStep = () => {
        if (!formData.batch_code || !formData.product_id || !formData.recipe_id) {
            toast.error('Please fill in all header details');
            return;
        }

        // Prepare ingredients from recipe
        const product = products.find(p => p.id === formData.product_id);
        const recipe = product?.recipes?.find((r: any) => r.id === formData.recipe_id);

        if (recipe && recipe.ingredients) {
            setSelectedIngredients(recipe.ingredients.map((ing: any) => ({
                ingredient_id: ing.ingredient_id,
                ingredient_name: ing.ingredient_name,
                expected_percentage: ing.expected_percentage,
                actual_percentage: ing.expected_percentage,
                source_type: 'VENDOR', // default
                crop_cycle_id: null,
                vendor_id: null,
                coa_status: 'PENDING',
                coa_link: ''
            })));
        }

        setStep(2);
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        const updated = [...selectedIngredients];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedIngredients(updated);
    };

    async function handleSubmit() {
        // Validation
        const totalPercentage = selectedIngredients.reduce((sum, item) => sum + Number(item.actual_percentage), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            toast.error(`Total percentage must be 100%. Current: ${totalPercentage}%`);
            return;
        }

        if (selectedIngredients.some(item => (item.source_type === 'FARM' && !item.crop_cycle_id) || (item.source_type === 'VENDOR' && !item.vendor_id))) {
            toast.error('Please select a source (Farm/Vendor) for all ingredients');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/batches', {
                batch_code: formData.batch_code,
                product_id: formData.product_id,
                recipe_id: formData.recipe_id,
                forensic_report_url: formData.forensic_report_url || null,
                ingredients: selectedIngredients
            });

            toast.success('Batch registered successfully!');
            onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Failed to register batch';
            toast.error(typeof msg === 'string' ? msg : 'Validation error');
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    const selectedProduct = products.find(p => p.id === formData.product_id);

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
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Register New Batch
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg align-middle ml-2">STEP {step}/2</span>
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">
                                    {step === 1 ? 'Define batch identity and select product recipe' : 'Assign sources and lot IDs to ingredients'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {step === 1 ? (
                            <div className="max-w-xl mx-auto space-y-8 py-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                        <Package className="w-3.5 h-3.5 text-primary" />
                                        Batch Code / Lot Reference
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. BATCH-2024-001"
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary transition-all font-bold uppercase"
                                        value={formData.batch_code}
                                        onChange={e => setFormData({ ...formData, batch_code: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                        <Layers className="w-3.5 h-3.5 text-primary" />
                                        Select Final Product
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {products.map(p => (
                                            <div
                                                key={p.id}
                                                role="button"
                                                onClick={() => handleProductChange(p.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.product_id === p.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${formData.product_id === p.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm">{p.name}</p>
                                                        <p className="text-[10px] opacity-70 uppercase font-black">{p.category}</p>
                                                    </div>
                                                </div>
                                                {formData.product_id === p.id && <Check className="w-5 h-5" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedProduct && selectedProduct.recipes && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                                <Beaker className="w-3.5 h-3.5 text-primary" />
                                                Recipe Selection
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary transition-all font-bold appearance-none"
                                                value={formData.recipe_id}
                                                onChange={e => setFormData({ ...formData, recipe_id: e.target.value })}
                                            >
                                                {selectedProduct.recipes.map((r: any) => (
                                                    <option key={r.id} value={r.id}>
                                                        VERSION {r.version} ({r.ingredients?.length} Ingredients)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                                Full Forensic Report URL (Google Drive)
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://drive.google.com/..."
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary transition-all font-bold"
                                                value={formData.forensic_report_url}
                                                onChange={e => setFormData({ ...formData, forensic_report_url: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-primary/5 p-6 rounded-3xl border border-primary/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{formData.batch_code}</h3>
                                            <p className="text-xs text-slate-500 font-bold">{selectedProduct?.name} • Recipe {selectedProduct?.recipes?.find((r: any) => r.id === formData.recipe_id)?.version}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 italic">Ingredient Sourcing (Bill of Materials)</h4>

                                    <div className="grid grid-cols-1 gap-4">
                                        {selectedIngredients.map((ing, idx) => (
                                            <div key={idx} className="glass dark:glass-dark rounded-[2rem] p-6 border-slate-100 dark:border-slate-800 transition-all hover:border-primary/20">
                                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">{idx + 1}</span>
                                                            <h5 className="font-bold text-slate-800 dark:text-white">{ing.ingredient_name}</h5>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg font-black text-slate-500">
                                                                REQ: {ing.expected_percentage}%
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    className="w-full bg-white dark:bg-slate-800 border-none px-2 py-1 text-sm font-bold text-primary outline-none focus:ring-1 ring-primary/20 rounded-md"
                                                                    value={ing.actual_percentage}
                                                                    onChange={e => updateIngredient(idx, 'actual_percentage', e.target.value)}
                                                                />
                                                                <span className="text-[10px] font-black text-slate-400">%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row gap-4 flex-[2]">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest leading-none">Source Type</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateIngredient(idx, 'source_type', 'FARM')}
                                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[10px] font-black transition-all border ${ing.source_type === 'FARM'
                                                                        ? 'bg-emerald-500 border-emerald-600 text-white'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                                                                        }`}
                                                                >
                                                                    <Sprout className="w-3.5 h-3.5" />
                                                                    FARM
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateIngredient(idx, 'source_type', 'VENDOR')}
                                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-[10px] font-black transition-all border ${ing.source_type === 'VENDOR'
                                                                        ? 'bg-blue-500 border-blue-600 text-white'
                                                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                                                                        }`}
                                                                >
                                                                    <Truck className="w-3.5 h-3.5" />
                                                                    VENDOR
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex-[1.5]">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest leading-none">
                                                                {ing.source_type === 'FARM' ? 'Select Lot / Crop Cycle' : 'Select Registered Vendor'}
                                                            </label>
                                                            <select
                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-primary transition-all dark:text-white mb-3"
                                                                value={ing.source_type === 'FARM' ? (ing.crop_cycle_id || '') : (ing.vendor_id || '')}
                                                                onChange={e => updateIngredient(idx, ing.source_type === 'FARM' ? 'crop_cycle_id' : 'vendor_id', e.target.value)}
                                                            >
                                                                <option value="">{ing.source_type === 'FARM' ? '-- Select Crop Cycle --' : '-- Select Vendor --'}</option>
                                                                {ing.source_type === 'FARM' ? (
                                                                    cropCycles.map(c => (
                                                                        <option key={c.id} value={c.id}>{c.lot_reference_code} ({c.crop_name})</option>
                                                                    ))
                                                                ) : (
                                                                    vendors.map(v => (
                                                                        <option key={v.id} value={v.id}>{v.company_name} ({v.city})</option>
                                                                    ))
                                                                )}
                                                            </select>

                                                            <div className="flex gap-2">
                                                                <div className="flex-1">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest leading-none">COA Status</label>
                                                                    <select
                                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-primary transition-all dark:text-white"
                                                                        value={ing.coa_status}
                                                                        onChange={e => updateIngredient(idx, 'coa_status', e.target.value)}
                                                                    >
                                                                        <option value="PENDING">PENDING</option>
                                                                        <option value="AVAILABLE">AVAILABLE</option>
                                                                        <option value="NOT_REQUIRED">NOT REQUIRED</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex-[2]">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest leading-none">COA Link (Google Drive)</label>
                                                                    <input
                                                                        type="url"
                                                                        placeholder="https://drive.google.com/..."
                                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-primary transition-all dark:text-white"
                                                                        value={ing.coa_link || ''}
                                                                        onChange={e => updateIngredient(idx, 'coa_link', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-col">
                            {step === 2 && (
                                <>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Composition</span>
                                    <span className={`text-sm font-black ${Math.abs(selectedIngredients.reduce((sum, item) => sum + Number(item.actual_percentage), 0) - 100) < 0.1 ? 'text-primary' : 'text-slate-500'}`}>
                                        {selectedIngredients.reduce((sum, item) => sum + Number(item.actual_percentage), 0)}% / 100%
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={step === 1 ? onClose : () => setStep(1)}
                                className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-outfit"
                            >
                                {step === 1 ? 'Cancel' : 'Back to Step 1'}
                            </button>
                            <button
                                disabled={submitting}
                                onClick={step === 1 ? handleNextStep : handleSubmit}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 font-outfit"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {step === 1 ? 'Continue to Sourcing' : 'Register Production Batch'}
                                        <ArrowRight className="w-5 h-5 ml-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}
