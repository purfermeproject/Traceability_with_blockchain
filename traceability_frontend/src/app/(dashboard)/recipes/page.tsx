'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Package, MoreVertical, FileText, Beaker, Layers } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import RecipeModal from '@/components/RecipeModal';

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipes();
    }, []);

    async function fetchRecipes() {
        try {
            const res = await api.get('/recipes/products');
            setRecipes(res.data || []);
        } catch (err) {
            toast.error('Failed to load recipes');
        } finally {
            setLoading(false);
        }
    }

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleNew = () => {
        setSelectedProduct(null);
        setShowModal(true);
    };

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Product Recipes</h1>
                    <p className="text-slate-500">Configure ingredient bills-of-materials and product manufacturing specs.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Define New Recipe
                </button>
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search by product name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredRecipes.map((recipe, idx) => (
                        <motion.div
                            key={recipe.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleEdit(recipe)}
                            className="glass dark:glass-dark rounded-[2rem] p-6 hover:border-primary/50 transition-all group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <Package className="w-8 h-8" />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === recipe.id ? null : recipe.id);
                                        }}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors relative z-10"
                                    >
                                        <MoreVertical className="w-5 h-5 text-slate-400" />
                                    </button>

                                    <AnimatePresence>
                                        {activeMenuId === recipe.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-20"
                                                    onClick={() => setActiveMenuId(null)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-30 p-2 ring-4 ring-black/5"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            handleEdit(recipe);
                                                            setActiveMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white rounded-xl transition-all flex items-center gap-3 group/item"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-white/20 group-hover/item:text-white transition-colors">
                                                            <Beaker className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">Edit Recipe</span>
                                                            <span className="text-[10px] opacity-70 uppercase tracking-widest font-black">View & modify specs</span>
                                                        </div>
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{recipe.name}</h3>
                                <p className="text-slate-500 text-sm line-clamp-2">{recipe.description || 'No description provided.'}</p>
                            </div>

                            <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Layers className="w-4 h-4" />
                                    {recipe.recipes?.[0]?.ingredients?.length || 0} Ingredients
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Beaker className="w-4 h-4" />
                                    QA Protocol V1
                                </div>
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

            {!loading && filteredRecipes.length === 0 && (
                <div className="py-20 text-center glass rounded-[2rem]">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No product recipes defined yet.</p>
                    <p className="text-sm text-slate-400">Recipes are used to map lot cycles to final batches.</p>
                </div>
            )}
            {/* Modal */}
            <RecipeModal
                isOpen={showModal}
                initialData={selectedProduct}
                onClose={() => {
                    setShowModal(false);
                    setSelectedProduct(null);
                }}
                onSuccess={fetchRecipes}
            />
        </div>
    );
}
