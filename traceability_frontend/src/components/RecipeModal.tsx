'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Beaker, Package, Layers, Loader2, Search, Check, ChevronDown, Link2 } from 'lucide-react';
import Portal from './Portal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Ingredient {
    id: string;
    name: string;
    type: string;
}

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // The product object with recipes
}

function SearchableIngredientSelect({
    ingredients,
    value,
    onChange
}: {
    ingredients: Ingredient[],
    value: string,
    onChange: (id: string, name?: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Find name of current value
    const selectedIngredient = ingredients.find(ing => ing.id === value);

    useEffect(() => {
        if (selectedIngredient && !isOpen) {
            setSearchTerm(selectedIngredient.name);
        }
    }, [selectedIngredient, isOpen]);

    const filtered = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showCreateOption = searchTerm.length > 0 && !ingredients.some(ing => ing.name.toLowerCase() === searchTerm.toLowerCase());

    const handleCreateIngredient = async () => {
        setIsCreating(true);
        try {
            const res = await api.post('/recipes/ingredients', {
                name: searchTerm,
                type: 'Raw Material'
            });
            const newIng = res.data;
            toast.success(`Registered new ingredient: ${newIng.name}`);
            onChange(newIng.id, newIng.name);
            setIsOpen(false);
        } catch (err) {
            toast.error('Failed to register new ingredient');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="relative flex-1">
            <div className="relative group/input">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Type ingredient name (e.g. Salt)..."
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-9 py-2.5 outline-none focus:border-primary transition-all font-bold text-sm shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[10000]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-[10001] overflow-hidden max-h-60 overflow-y-auto ring-4 ring-black/5"
                        >
                            {/* Create New Option */}
                            {showCreateOption && (
                                <button
                                    type="button"
                                    disabled={isCreating}
                                    onClick={handleCreateIngredient}
                                    className="w-full flex items-center gap-3 px-4 py-4 bg-primary/5 hover:bg-primary/10 transition-colors border-b border-slate-100 dark:border-slate-700 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-black text-primary uppercase tracking-tight">Create New Ingredient</span>
                                        <span className="text-xs text-slate-500 font-bold italic">"{searchTerm}"</span>
                                    </div>
                                </button>
                            )}

                            {filtered.length > 0 ? (
                                filtered.map(ing => (
                                    <button
                                        key={ing.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(ing.id);
                                            setSearchTerm(ing.name);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-none"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-white">{ing.name}</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{ing.type}</span>
                                        </div>
                                        {value === ing.id && <Check className="w-4 h-4 text-primary" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-6 py-10 text-center">
                                    {!searchTerm ? (
                                        <>
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                                <Search className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mb-1">
                                                {ingredients.length === 0 ? 'Ingredient list is empty' : 'Search for an ingredient'}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                Type to search or record a new material
                                            </p>
                                        </>
                                    ) : !showCreateOption && (
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                            No matching ingredients found<br />
                                            <span className="text-[10px] text-primary italic">Try a different search term</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function RecipeModal({ isOpen, onClose, onSuccess, initialData }: RecipeModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Grains',
        recipe_version: 'V1.0'
    });
    const [selectedIngredients, setSelectedIngredients] = useState<{ ingredient_id: string, expected_percentage: number, coa_link: string, coa_status: string }[]>([
        { ingredient_id: '', expected_percentage: 0, coa_link: '', coa_status: 'PENDING' }
    ]);

    useEffect(() => {
        if (isOpen) {
            fetchIngredients();
            if (initialData) {
                // Populate form for editing
                setFormData({
                    name: initialData.name,
                    category: initialData.category,
                    recipe_version: initialData.recipes?.[0]?.version || 'V1.0'
                });

                // Populate ingredients from the latest recipe
                const latestRecipe = initialData.recipes?.[0];
                if (latestRecipe && latestRecipe.ingredients) {
                    setSelectedIngredients(latestRecipe.ingredients.map((i: any) => ({
                        ingredient_id: i.ingredient_id,
                        expected_percentage: i.expected_percentage,
                        coa_link: i.coa_link || '',
                        coa_status: i.coa_status || 'PENDING'
                    })));
                }
            } else {
                // Reset form for creation
                setFormData({
                    name: '',
                    category: 'Grains',
                    recipe_version: 'V1.0'
                });
                setSelectedIngredients([{ ingredient_id: '', expected_percentage: 0, coa_link: '', coa_status: 'PENDING' }]);
            }
        }
    }, [isOpen, initialData]);

    async function fetchIngredients() {
        try {
            const res = await api.get('/recipes/ingredients');
            setIngredients(res.data || []);
        } catch (err) {
            toast.error('Failed to load ingredients list');
        }
    }

    const addIngredientRow = () => {
        setSelectedIngredients([...selectedIngredients, { ingredient_id: '', expected_percentage: 0, coa_link: '', coa_status: 'PENDING' }]);
    };

    const removeIngredientRow = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: string, value: string | number) => {
        const updated = [...selectedIngredients];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-set status to AVAILABLE when a COA link is entered
        if (field === 'coa_link' && typeof value === 'string' && value.length > 0) {
            updated[index].coa_status = 'AVAILABLE';
        }
        // Clear COA link when status is set to PENDING or NOT_REQUIRED
        if (field === 'coa_status' && (value === 'PENDING' || value === 'NOT_REQUIRED')) {
            updated[index].coa_link = '';
        }

        setSelectedIngredients(updated);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validation
        const totalPercentage = selectedIngredients.reduce((sum, item) => sum + Number(item.expected_percentage), 0);
        if (totalPercentage !== 100) {
            toast.error(`Total percentage must be 100%. Current: ${totalPercentage}%`);
            return;
        }

        if (selectedIngredients.some(item => !item.ingredient_id)) {
            toast.error('Please select an ingredient for all rows');
            return;
        }

        setSubmitting(true);
        try {
            let productId = initialData?.id;

            if (!productId) {
                // 1. Create Product (New)
                const productRes = await api.post('/recipes/products', {
                    name: formData.name,
                    category: formData.category
                });
                productId = productRes.data.id;
            } else {
                // Update Product if name or category changed
                if (formData.name !== initialData.name || formData.category !== initialData.category) {
                    await api.put(`/recipes/products/${productId}`, {
                        name: formData.name,
                        category: formData.category
                    });
                }
            }

            // 2. Create Recipe for this product
            await api.post('/recipes', {
                product_id: productId,
                version: formData.recipe_version,
                ingredients: selectedIngredients.map(ing => ({
                    ingredient_id: ing.ingredient_id,
                    expected_percentage: ing.expected_percentage,
                    coa_status: ing.coa_status,
                    coa_link: ing.coa_link || null,
                }))
            });

            toast.success('Product Recipe defined successfully!');
            onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Failed to define recipe';
            toast.error(typeof msg === 'string' ? msg : 'Validation error');
        } finally {
            setSubmitting(false);
        }
    }

    if (!isOpen) return null;

    const coaStatusOptions = [
        { value: 'AVAILABLE', label: 'Available', color: 'text-emerald-500' },
        { value: 'PENDING', label: 'Pending', color: 'text-amber-500' },
        { value: 'NOT_REQUIRED', label: 'Hide', color: 'text-slate-400' },
    ];

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
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Beaker className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {initialData ? 'Edit Product Recipe' : 'Define New Recipe'}
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg align-middle ml-2">V2.1</span>
                                </h2>
                                <p className="text-slate-500 text-sm font-medium">
                                    {initialData ? 'Update product specs or create a new recipe version' : 'Create a new product master and its Bill of Materials'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Section 1: Product Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Package className="w-3.5 h-3.5 text-primary" />
                                    Product Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Premium Peanut Butter"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary transition-all font-medium"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Layers className="w-3.5 h-3.5 text-primary" />
                                    Category
                                </label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary transition-all font-medium appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option>Grains</option>
                                    <option>Processed Food</option>
                                    <option>Spices</option>
                                    <option>Dairy</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Beaker className="w-3.5 h-3.5 text-primary" />
                                    Recipe Version
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="V1.0"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-primary transition-all font-medium"
                                    value={formData.recipe_version}
                                    onChange={e => setFormData({ ...formData, recipe_version: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Section 2: Bill of Materials */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                                    <Plus className="w-3.5 h-3.5 text-primary" />
                                    Bill of Materials (Ingredients)
                                </label>
                                <button
                                    type="button"
                                    onClick={addIngredientRow}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    Add Row
                                </button>
                            </div>

                            <div className="space-y-3">
                                {selectedIngredients.map((row, idx) => (
                                    <motion.div
                                        layout
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800"
                                    >
                                        {/* Row 1: Ingredient selector + percentage */}
                                        <div className="flex items-center gap-3">
                                            <SearchableIngredientSelect
                                                ingredients={ingredients}
                                                value={row.ingredient_id}
                                                onChange={(id, newName) => {
                                                    if (newName) {
                                                        setIngredients(prev => [...prev, { id, name: newName, type: 'Raw Material' }]);
                                                    }
                                                    updateIngredient(idx, 'ingredient_id', id);
                                                }}
                                            />
                                            <div className="flex items-center gap-2 w-32">
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="0.0"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-primary transition-all text-right font-bold"
                                                    value={row.expected_percentage}
                                                    onChange={e => updateIngredient(idx, 'expected_percentage', e.target.value)}
                                                />
                                                <span className="text-xs font-bold text-slate-400">%</span>
                                            </div>
                                            {selectedIngredients.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeIngredientRow(idx)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Row 2: COA status dropdown + conditional COA link */}
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={row.coa_status}
                                                onChange={e => updateIngredient(idx, 'coa_status', e.target.value)}
                                                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-primary transition-all text-xs font-black uppercase tracking-wide appearance-none cursor-pointer ${
                                                    row.coa_status === 'AVAILABLE' ? 'text-emerald-500' :
                                                    row.coa_status === 'PENDING' ? 'text-amber-500' :
                                                    'text-slate-400'
                                                }`}
                                                style={{ minWidth: '120px' }}
                                            >
                                                {coaStatusOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>

                                            {row.coa_status === 'AVAILABLE' && (
                                                <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                                                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <input
                                                        type="url"
                                                        placeholder="COA Link (Google Drive URL)"
                                                        className="flex-1 bg-transparent outline-none text-xs font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
                                                        value={row.coa_link}
                                                        onChange={e => updateIngredient(idx, 'coa_link', e.target.value)}
                                                    />
                                                    {row.coa_link && (
                                                        <a
                                                            href={row.coa_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                                        >
                                                            verify
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {row.coa_status === 'PENDING' && (
                                                <span className="flex-1 text-[11px] font-bold text-amber-500/70 italic pl-2">
                                                    COA document is pending...
                                                </span>
                                            )}

                                            {row.coa_status === 'NOT_REQUIRED' && (
                                                <span className="flex-1 text-[11px] font-bold text-slate-400/70 italic pl-2">
                                                    COA not required — hidden from reports
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Strength</span>
                            <span className={`text-sm font-black ${selectedIngredients.reduce((sum, item) => sum + Number(item.expected_percentage), 0) === 100 ? 'text-primary' : 'text-slate-500'}`}>
                                {selectedIngredients.reduce((sum, item) => sum + Number(item.expected_percentage), 0)}% / 100%
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {initialData ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    initialData ? 'Save Changes' : 'Register Recipe'
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </Portal>
    );
}
