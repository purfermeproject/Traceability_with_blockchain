'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Sprout, Calendar, Tag, ChevronRight, Activity, Beaker, X, Loader2, MapPin, Camera, Clock, CheckCircle2, ListFilter, Pencil } from 'lucide-react';
import Portal from '@/components/Portal';
import api from '@/lib/api';
import { CropCycle, CropEvent, Farmer, Farm, CropStage } from '@/types';
import toast from 'react-hot-toast';

const stageColors: Record<string, string> = {
    'Ploughing': 'bg-blue-500/10 text-blue-500',
    'Sowing': 'bg-emerald-500/10 text-emerald-500',
    'Irrigation': 'bg-cyan-500/10 text-cyan-500',
    'Harvest': 'bg-amber-500/10 text-amber-500',
    'Processing': 'bg-purple-500/10 text-purple-500',
    'Storage': 'bg-indigo-500/10 text-indigo-500',
    'Damage': 'bg-red-500/10 text-red-500',
    'Other': 'bg-slate-500/10 text-slate-500',
};

const stages: CropStage[] = ['Ploughing', 'Sowing', 'Irrigation', 'Harvest', 'Processing', 'Storage', 'Damage', 'Other'];

export default function CropCyclesPage() {
    const [cycles, setCycles] = useState<CropCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Form State
    const [showCycleModal, setShowCycleModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<CropCycle | null>(null);
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const [cycleForm, setCycleForm] = useState({
        farmer_id: '',
        farm_id: '',
        crop_name: '',
        lot_reference_code: ''
    });

    const [eventForm, setEventForm] = useState({
        stage_name: 'Ploughing' as CropStage,
        event_date: '',
        description: '',
        photo_urls: ''
    });

    useEffect(() => {
        setEventForm(prev => ({
            ...prev,
            event_date: new Date().toISOString().split('T')[0]
        }));
    }, []);

    useEffect(() => {
        fetchCycles();
        fetchFarmers();
    }, []);

    async function fetchCycles() {
        try {
            const res = await api.get('/crop-cycles');
            const cycleData = await Promise.all(res.data.items.map(async (cycle: CropCycle) => {
                const eventsRes = await api.get(`/crop-cycles/${cycle.id}/events`);
                const events = eventsRes.data;
                const latestEvent = events.length > 0 ? events[events.length - 1] : null;
                const earliestEvent = events.length > 0 ? events[0] : null;

                return {
                    ...cycle,
                    events,
                    status: latestEvent ? latestEvent.stage_name : 'PENDING',
                    start_date: earliestEvent ? earliestEvent.event_date : null
                };
            }));
            setCycles(cycleData);
        } catch (err) {
            toast.error('Failed to load crop cycles');
        } finally {
            setLoading(false);
        }
    }

    async function fetchFarmers() {
        try {
            const res = await api.get('/farmers');
            setFarmers(res.data.items);
        } catch (err) {
            console.error('Failed to load farmers');
        }
    }

    async function fetchFarms(farmerId: string) {
        try {
            const res = await api.get(`/farmers/${farmerId}/farms`);
            setFarms(res.data);
        } catch (err) {
            setFarms([]);
        }
    }

    async function handleCycleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/crop-cycles', cycleForm);
            toast.success('Crop cycle registered!');
            setShowCycleModal(false);
            setCycleForm({ farmer_id: '', farm_id: '', crop_name: '', lot_reference_code: '' });
            fetchCycles();
        } catch (err: any) {
            const errorDetail = err.response?.data?.detail;
            const message = typeof errorDetail === 'string'
                ? errorDetail
                : (Array.isArray(errorDetail) ? errorDetail[0]?.msg : 'Failed to register cycle');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleEventSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedCycle) return;
        setSubmitting(true);
        try {
            const payload = {
                ...eventForm,
                crop_cycle_id: selectedCycle.id,
                photo_urls: eventForm.photo_urls.trim()
            };

            if (editingEventId) {
                await api.patch(`/crop-cycles/${selectedCycle.id}/events/${editingEventId}`, payload);
                toast.success('Activity updated!');
            } else {
                await api.post(`/crop-cycles/${selectedCycle.id}/events`, payload);
                toast.success('Activity logged!');
            }

            resetEventForm();
            // Refresh logic
            const updatedEvents = await api.get(`/crop-cycles/${selectedCycle.id}/events`);
            setSelectedCycle(prev => prev ? { ...prev, events: updatedEvents.data } : null);
            fetchCycles();
        } catch (err: any) {
            const errorDetail = err.response?.data?.detail;
            const message = typeof errorDetail === 'string'
                ? errorDetail
                : (Array.isArray(errorDetail) ? errorDetail[0]?.msg : 'Failed to register activity');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleStartEdit(event: CropEvent) {
        setEditingEventId(event.id);
        setEventForm({
            stage_name: event.stage_name,
            event_date: new Date(event.event_date).toISOString().split('T')[0],
            description: event.description || '',
            photo_urls: event.photo_urls || ''
        });
    }

    function resetEventForm() {
        setEditingEventId(null);
        setEventForm({
            stage_name: 'Ploughing',
            event_date: new Date().toISOString().split('T')[0],
            description: '',
            photo_urls: ''
        });
    }

const STAGE_ORDER: Record<string, number> = {
    'Ploughing': 0, 'Sowing': 1, 'Irrigation': 2,
    'Harvest': 3, 'Processing': 4, 'Storage': 5,
    'Damage': 6, 'Other': 7
};

const filteredCycles = cycles.filter(c =>
    c.lot_reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.crop_name.toLowerCase().includes(searchTerm.toLowerCase())
);

    return (
        <div className="space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Crop Cycles</h1>
                    <p className="text-slate-500">Monitor harvesting schedules and seed-to-harvest timelines.</p>
                </div>
                <button
                    onClick={() => {
                        setShowCycleModal(true);
                    }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Log Initial Cycle
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by lot code or crop..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {filteredCycles.map((cycle, idx) => (
                        <motion.div
                            key={cycle.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-primary/30 transition-all cursor-pointer"
                        >
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Sprout className="w-8 h-8" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold dark:text-white font-outfit uppercase tracking-tight ">{cycle.lot_reference_code}</h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stageColors[cycle.status || 'PENDING'] || 'bg-slate-500/10 text-slate-500'}`}>
                                        {cycle.status || 'PENDING'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <Tag className="w-4 h-4 text-primary" />
                                        {cycle.crop_name}
                                    </span>
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        <Calendar className="w-4 h-4" />
                                        <span className="dark:text-slate-400">Started:</span> {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : 'Not set'}
                                    </span>
                                    {cycle.events && cycle.events.length > 0 && (
                                        <span className="flex items-center gap-1.5 text-emerald-500 font-semibold whitespace-nowrap">
                                            <Beaker className="w-4 h-4" />
                                            {cycle.events.length} Events Logged
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => { setSelectedCycle(cycle); setShowTimelineModal(true); }}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary px-6 py-3 rounded-xl font-bold transition-all group/btn"
                                >
                                    View Timeline
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />)}
                </div>
            )}

            {!loading && cycles.length === 0 && (
                <div className="py-20 text-center glass dark:glass-dark rounded-[2.5rem]">
                    <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold dark:text-white mb-1">No crop cycles logged</h3>
                    <p className="text-slate-500">Farmers can log their seed-to-harvest data here to start the chain.</p>
                </div>
            )}

            {/* ── Cycle Registration Modal ─────────────────────────────────────── */}
            <Portal>
                <AnimatePresence>
                    {showCycleModal && (
                        <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl my-12 relative"
                            >
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold dark:text-white font-outfit">Log Initial Cycle</h2>
                                    </div>
                                    <button onClick={() => setShowCycleModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleCycleSubmit} className="p-8 space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-500 px-1">Farmer</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 outline-none focus:ring-2 ring-primary/20 dark:text-white"
                                            value={cycleForm.farmer_id}
                                            onChange={(e) => {
                                                setCycleForm(prev => ({ ...prev, farmer_id: e.target.value, farm_id: '' }));
                                                fetchFarms(e.target.value);
                                            }}
                                        >
                                            <option value="">Select Farmer</option>
                                            {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>

                                    {cycleForm.farmer_id && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Farm (Optional)</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 outline-none focus:ring-2 ring-primary/20 dark:text-white"
                                                value={cycleForm.farm_id}
                                                onChange={(e) => setCycleForm(prev => ({ ...prev, farm_id: e.target.value }))}
                                            >
                                                <option value="">Select Farm</option>
                                                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Crop Name</label>
                                            <input
                                                required placeholder="e.g. Peanut"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 outline-none focus:ring-2 ring-primary/20 dark:text-white"
                                                value={cycleForm.crop_name}
                                                onChange={(e) => setCycleForm(prev => ({ ...prev, crop_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Lot code</label>
                                            <input
                                                required placeholder="e.g. LOT-2024-001"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3.5 px-4 outline-none focus:ring-2 ring-primary/20 dark:text-white uppercase"
                                                value={cycleForm.lot_reference_code}
                                                onChange={(e) => setCycleForm(prev => ({ ...prev, lot_reference_code: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={submitting}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Cycle Journey'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* ── Timeline Modal ─────────────────────────────────────────────── */}
            <Portal>
                <AnimatePresence>
                    {showTimelineModal && selectedCycle && (
                        <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl my-6 flex flex-col md:flex-row min-h-[85vh] relative"
                            >
                                {/* Left: Event Form */}
                                <div className="w-full md:w-[380px] p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingEventId ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                                            {editingEventId ? <Activity className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <h2 className="text-xl font-bold dark:text-white font-outfit">
                                            {editingEventId ? 'Edit Activity' : 'Log New Event'}
                                        </h2>
                                    </div>

                                    <form onSubmit={handleEventSubmit} className="space-y-5">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Farmer Stage</label>
                                            <select
                                                required
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 outline-none focus:ring-2 ring-primary/20 dark:text-white"
                                                value={eventForm.stage_name}
                                                onChange={(e) => setEventForm(prev => ({ ...prev, stage_name: e.target.value as CropStage }))}
                                            >
                                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Date</label>
                                            <input
                                                type="date" required
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 outline-none focus:ring-2 ring-primary/20 dark:text-white"
                                                value={eventForm.event_date}
                                                onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Notes</label>
                                            <textarea
                                                rows={3} placeholder="Describe the activity..."
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 outline-none focus:ring-2 ring-primary/20 dark:text-white resize-none"
                                                value={eventForm.description}
                                                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-slate-500 px-1">Media Links (Google Drive)</label>
                                            <input
                                                placeholder="Comma separated links"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 outline-none focus:ring-2 ring-primary/20 dark:text-white"
                                                value={eventForm.photo_urls}
                                                onChange={(e) => setEventForm(prev => ({ ...prev, photo_urls: e.target.value }))}
                                            />
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="flex-1 bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingEventId ? 'Update Activity' : 'Log Activity')}
                                            </button>

                                            {editingEventId && (
                                                <button
                                                    type="button"
                                                    onClick={resetEventForm}
                                                    className="px-6 py-4 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                {/* Right: Timeline View */}
                                <div className="flex-1 p-8 flex flex-col h-[70vh] md:h-auto">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Traceability Feed</p>
                                            <h2 className="text-2xl font-black dark:text-white font-outfit uppercase">{selectedCycle.lot_reference_code}</h2>
                                        </div>
                                        <button onClick={() => setShowTimelineModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                            <X className="w-6 h-6 text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-4 space-y-8 relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-slate-800" />

                                        {selectedCycle.events && selectedCycle.events.length > 0 ? (
                                            [...selectedCycle.events]
                                                .sort((a, b) => (STAGE_ORDER[a.stage_name] ?? 99) - (STAGE_ORDER[b.stage_name] ?? 99))
                                                .map((event, i) => (
                                                <div key={event.id} className="relative pl-14 group">
                                                    {/* Node */}
                                                    <div className="absolute left-0 top-1 w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stageColors[event.stage_name] || 'bg-slate-100'}`}>
                                                            {event.stage_name === 'Harvest' ? <Tag className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                        </div>
                                                    </div>

                                                    <div className="glass dark:glass-dark rounded-2xl p-5 hover:border-primary/50 transition-all">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">{event.stage_name}</h4>
                                                                <button
                                                                    onClick={() => handleStartEdit(event)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-lg transition-all"
                                                                    title="Edit activity"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <span
                                                                suppressHydrationWarning
                                                                className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter"
                                                            >
                                                                {new Date(event.event_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                                                            {event.description || 'No description provided for this stage.'}
                                                        </p>

                                                        {event.photo_url_list && event.photo_url_list.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {event.photo_url_list.map((url, i) => (
                                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-500 hover:text-primary transition-colors">
                                                                        <Camera className="w-3.5 h-3.5" />
                                                                        View Media {i + 1}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                                <Clock className="w-12 h-12 text-slate-200 mb-4" />
                                                <p className="text-slate-400 font-medium">No events logged yet.<br />Use the form to log the first activity.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}
