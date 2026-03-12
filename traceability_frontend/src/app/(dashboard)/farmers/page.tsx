'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, User, MoreVertical, Shield, ShieldAlert,
    Activity, X, MapPin, Image as ImageIcon, Loader2, Edit2,
    Warehouse, ExternalLink, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { Farmer, Farm } from '@/types';
import toast from 'react-hot-toast';

const emptyForm = {
    name: '',
    village: '',
    district: '',
    profile_photo_url: '',
    about: '',
};

const emptyFarmForm = {
    name: '',
    location_pin: '',
    acreage: '',
    npk_ratio: '',
    farming_technology: '',
};

export default function FarmersPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Farmer Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Farms Modal State
    const [showFarmsModal, setShowFarmsModal] = useState(false);
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(false);
    const [farmForm, setFarmForm] = useState(emptyFarmForm);
    const [addingFarm, setAddingFarm] = useState(false);

    const [submitting, setSubmitting] = useState(false);

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

    // ── Farmer Actions ──────────────────────────────────────────────────────────

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleEdit(farmer: Farmer) {
        setEditingFarmer(farmer);
        setForm({
            name: farmer.name,
            village: farmer.village,
            district: farmer.district,
            profile_photo_url: farmer.profile_photo_url || '',
            about: farmer.about || '',
        });
        setShowModal(true);
    }

    function handleCloseModal() {
        setShowModal(false);
        setEditingFarmer(null);
        setForm(emptyForm);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: Record<string, string> = {
                name: form.name,
                village: form.village,
                district: form.district,
            };
            if (form.profile_photo_url.trim()) {
                payload.profile_photo_url = form.profile_photo_url.trim();
            }
            if (form.about.trim()) {
                payload.about = form.about.trim();
            }

            if (editingFarmer) {
                await api.patch(`/farmers/${editingFarmer.id}`, payload);
                toast.success(`Farmer "${form.name}" updated successfully!`);
            } else {
                await api.post('/farmers', payload);
                toast.success(`Farmer "${form.name}" onboarded successfully!`);
            }

            handleCloseModal();
            fetchFarmers();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : `Failed to ${editingFarmer ? 'update' : 'onboard'} farmer.`);
        } finally {
            setSubmitting(false);
        }
    }

    // ── Farms Actions ───────────────────────────────────────────────────────────

    async function handleViewFarms(farmer: Farmer) {
        setSelectedFarmer(farmer);
        setShowFarmsModal(true);
        setLoadingFarms(true);
        try {
            const res = await api.get(`/farmers/${farmer.id}/farms`);
            setFarms(res.data);
        } catch (err) {
            toast.error('Failed to load farms');
        } finally {
            setLoadingFarms(false);
        }
    }

    async function handleAddFarm(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedFarmer) return;
        setAddingFarm(true);
        try {
            await api.post(`/farmers/${selectedFarmer.id}/farms`, farmForm);
            toast.success('Farm added successfully!');
            setFarmForm(emptyFarmForm);
            // Refresh farms list
            const res = await api.get(`/farmers/${selectedFarmer.id}/farms`);
            setFarms(res.data);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : 'Failed to add farm');
        } finally {
            setAddingFarm(false);
        }
    }

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Farmers</h1>
                    <p className="text-slate-500">Manage and onboard farm partners for the blockchain network.</p>
                </div>
                <button
                    onClick={() => { setEditingFarmer(null); setForm(emptyForm); setShowModal(true); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
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
                                <th className="px-8 py-5 text-sm font-semibold text-slate-500">Location</th>
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
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all overflow-hidden border border-slate-200 dark:border-slate-700">
                                                    {farmer.profile_photo_url ? (
                                                        <img src={farmer.profile_photo_url} alt={farmer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{farmer.name}</p>
                                                    <p className="text-xs text-slate-400">ID: {farmer.id.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-400">
                                            {farmer.village}, {farmer.district}
                                        </td>
                                        <td className="px-8 py-6">
                                            {farmer.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                                    <Shield className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-500 text-xs font-bold">
                                                    <ShieldAlert className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-sm">
                                            <button
                                                onClick={() => handleViewFarms(farmer)}
                                                className="text-primary hover:underline font-bold transition-all flex items-center gap-1"
                                            >
                                                View Farms <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(farmer)}
                                                    className="p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-xl transition-all text-slate-500 shadow-sm"
                                                    title="Edit Farmer"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-500 shadow-sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
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

            {/* ── Farmer Modal (Add/Edit) ───────────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-3xl p-8 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white font-outfit">
                                        {editingFarmer ? 'Edit Farmer' : 'Onboard Farmer'}
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {editingFarmer ? `Updating details for ${editingFarmer.name}` : 'Add a new farmer partner to the network'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Full Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Ramesh Kumar"
                                            className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-2xl py-3 pl-11 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Village + District */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Village *</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type="text"
                                                name="village"
                                                required
                                                value={form.village}
                                                onChange={handleChange}
                                                placeholder="e.g. Akola"
                                                className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-2xl py-3 pl-11 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">District *</label>
                                        <input
                                            type="text"
                                            name="district"
                                            required
                                            value={form.district}
                                            onChange={handleChange}
                                            placeholder="e.g. Nagpur"
                                            className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-2xl py-3 px-4 text-white outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Profile Photo URL */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">
                                        Profile Photo URL <span className="text-slate-600">(optional, Google Drive link)</span>
                                    </label>
                                    <div className="relative">
                                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="url"
                                            name="profile_photo_url"
                                            value={form.profile_photo_url}
                                            onChange={handleChange}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-2xl py-3 pl-11 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* About / Bio */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">About / Biography</label>
                                    <textarea
                                        name="about"
                                        rows={3}
                                        value={form.about}
                                        onChange={(e) => setForm(prev => ({ ...prev, about: e.target.value }))}
                                        placeholder="Tell consumers about this farmer..."
                                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-2xl py-3 px-4 text-white outline-none transition-all placeholder:text-slate-600 resize-none text-sm"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3.5 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {editingFarmer ? 'Saving...' : 'Adding...'}</>
                                        ) : (
                                            editingFarmer ? (
                                                <><Edit2 className="w-4 h-4" /> Save Changes</>
                                            ) : (
                                                <><Plus className="w-4 h-4" /> Add Farmer</>
                                            )
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Farms Management Modal ───────────────────────────────────────────── */}
            <AnimatePresence>
                {showFarmsModal && selectedFarmer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowFarmsModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[82vh] mt-[8vh]"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Warehouse className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-outfit">Farm Assets</h2>
                                        <p className="text-sm text-slate-400 mt-0.5">Managing farms for {selectedFarmer.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFarmsModal(false)}
                                    className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Add Farm Form */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-primary" /> Add New Farm
                                    </h3>
                                    <form onSubmit={handleAddFarm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Farm ID (e.g. F-001)"
                                            required
                                            value={farmForm.name}
                                            onChange={(e) => setFarmForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2.5 px-4 text-white outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Location Pin / Coordinates"
                                            value={farmForm.location_pin}
                                            onChange={(e) => setFarmForm(prev => ({ ...prev, location_pin: e.target.value }))}
                                            className="bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2.5 px-4 text-white outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Acreage (e.g. 5 Acres)"
                                            value={farmForm.acreage}
                                            onChange={(e) => setFarmForm(prev => ({ ...prev, acreage: e.target.value }))}
                                            className="bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2.5 px-4 text-white outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="NPK Ratio (e.g. 8:6:3)"
                                            value={farmForm.npk_ratio}
                                            onChange={(e) => setFarmForm(prev => ({ ...prev, npk_ratio: e.target.value }))}
                                            className="bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2.5 px-4 text-white outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Farming Tech (e.g. Broadcasting)"
                                            value={farmForm.farming_technology}
                                            onChange={(e) => setFarmForm(prev => ({ ...prev, farming_technology: e.target.value }))}
                                            className="bg-white/5 border border-white/10 focus:border-primary rounded-xl py-2.5 px-4 text-white outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={addingFarm}
                                            className="md:col-span-2 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {addingFarm ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Register Farm</>}
                                        </button>
                                    </form>
                                </div>

                                {/* Farms List */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 mb-4 px-1 uppercase tracking-wider">Registered Farms</h3>
                                    {loadingFarms ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        </div>
                                    ) : farms.length === 0 ? (
                                        <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                                            <Warehouse className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">No farms registered for this partner yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {farms.map((farm) => (
                                                <div
                                                    key={farm.id}
                                                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/50 transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white font-mono break-all text-sm">{farm.id}</p>
                                                            <p className="text-xs text-slate-500">Farm ID: {farm.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {farm.location_pin && (
                                                            <span className="text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
                                                                {farm.location_pin}
                                                            </span>
                                                        )}
                                                        <button className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
