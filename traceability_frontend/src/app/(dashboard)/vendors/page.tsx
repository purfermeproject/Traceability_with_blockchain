'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Truck, MoreVertical, Shield, ShieldAlert, Globe, MapPin, X, Loader2, Edit2 } from 'lucide-react';
import api from '@/lib/api';
import { Vendor } from '@/types';
import toast from 'react-hot-toast';

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const emptyVendorForm = {
        company_name: '',
        city: '',
        state: '',
        gst_no: ''
    };
    const [vendorForm, setVendorForm] = useState(emptyVendorForm);

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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingVendor) {
                await api.patch(`/vendors/${editingVendor.id}`, vendorForm);
                toast.success('Vendor updated successfully!');
            } else {
                await api.post('/vendors', vendorForm);
                toast.success('Vendor registered successfully!');
            }
            handleCloseModal();
            fetchVendors();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : 'Failed to save vendor');
        } finally {
            setSubmitting(false);
        }
    }

    function handleEdit(vendor: Vendor) {
        setEditingVendor(vendor);
        setVendorForm({
            company_name: vendor.company_name,
            city: vendor.city || '',
            state: vendor.state || '',
            gst_no: vendor.gst_no || ''
        });
        setShowModal(true);
    }

    function handleCloseModal() {
        setShowModal(false);
        setEditingVendor(null);
        setVendorForm(emptyVendorForm);
    }

    async function toggleStatus(vendor: Vendor) {
        try {
            await api.patch(`/vendors/${vendor.id}`, { is_active: !vendor.is_active });
            toast.success(`Vendor ${vendor.is_active ? 'deactivated' : 'activated'}`);
            fetchVendors();
        } catch (err) {
            toast.error('Failed to update status');
        }
    }

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Vendors</h1>
                    <p className="text-slate-500">Manage third-party suppliers and manufacturing partners.</p>
                </div>
                <button
                    onClick={() => {
                        console.log('Register Vendor clicked');
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
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
                                <button
                                    onClick={() => handleEdit(vendor)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{vendor.company_name}</h3>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        {vendor.city}, {vendor.state}
                                    </div>
                                    {vendor.gst_no && (
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono tracking-wider">
                                            <Shield className="w-3 h-3" />
                                            GST: {vendor.gst_no}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(vendor)}
                                        className="flex items-center gap-1.5"
                                    >
                                        {vendor.is_active ? (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                                                <Shield className="w-4 h-4" />
                                                ACTIVE
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-400/10 px-2 py-1 rounded-md">
                                                <ShieldAlert className="w-4 h-4" />
                                                INACTIVE
                                            </span>
                                        )}
                                    </button>
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

            {/* ── Vendor Modal ────────────────────────────────────────────────── */}
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
                            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl mt-[10vh] mb-12 relative"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                                            {editingVendor ? 'Edit Vendor' : 'Register Vendor'}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {editingVendor ? 'Update your partner details' : 'Add a new manufacturing partner'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">Company Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter company name"
                                            required
                                            value={vendorForm.company_name}
                                            onChange={(e) => setVendorForm(prev => ({ ...prev, company_name: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:border-primary rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">City</label>
                                            <input
                                                type="text"
                                                placeholder="City"
                                                required
                                                value={vendorForm.city}
                                                onChange={(e) => setVendorForm(prev => ({ ...prev, city: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:border-primary rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">State</label>
                                            <input
                                                type="text"
                                                placeholder="State"
                                                required
                                                value={vendorForm.state}
                                                onChange={(e) => setVendorForm(prev => ({ ...prev, state: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:border-primary rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">GST Number (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter GSTIN"
                                            value={vendorForm.gst_no}
                                            onChange={(e) => setVendorForm(prev => ({ ...prev, gst_no: e.target.value }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 focus:border-primary rounded-xl py-3 px-4 text-slate-900 dark:text-white outline-none transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> {editingVendor ? 'Saving...' : 'Registering...'}</>
                                        ) : (
                                            editingVendor ? (
                                                <><Edit2 className="w-4 h-4" /> Save Changes</>
                                            ) : (
                                                <><Plus className="w-4 h-4" /> Register Vendor</>
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
