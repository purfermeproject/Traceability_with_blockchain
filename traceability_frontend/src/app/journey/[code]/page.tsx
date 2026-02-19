'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Sprout,
    ShieldCheck,
    MapPin,
    Calendar,
    FileCheck,
    ExternalLink,
    ChevronRight,
    Database,
    Info,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ConsumerJourneyPage() {
    const { code } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJourney() {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/batch/${code}`);
                setData(res.data);
            } catch (err: any) {
                toast.error(err.response?.data?.detail || 'Journey not found');
            } finally {
                setLoading(false);
            }
        }
        if (code) fetchJourney();
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
                <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 font-medium">Verifying blockchain certificate...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Journey Not Found</h1>
                    <p className="text-slate-500">This batch might not be published to the public network yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans pb-20">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-end p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/50" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1500382017468-9049fee74a62?q=80&w=2664&auto=format&fit=crop')] bg-cover bg-center -z-10 opacity-40" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-2xl mx-auto text-center"
                >
                    <div className="inline-flex items-center gap-2 bg-primary px-4 py-1.5 rounded-full text-white text-xs font-bold mb-6 animate-pulse">
                        <ShieldCheck className="w-4 h-4" />
                        BLOCKCHAIN VERIFIED JOURNEY
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4 font-outfit tracking-tight">Verified Batch Journey</h1>
                    <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-400">
                        <span className="flex items-center gap-1.5"><Database className="w-4 h-4" /> ID: {data.batch_code}</span>
                        <span className="h-4 w-px bg-slate-800" />
                        <span className="flex items-center gap-1.5 text-primary"><ShieldCheck className="w-4 h-4" /> Secured on Ledger</span>
                    </div>
                </motion.div>
            </section>

            <div className="max-w-xl mx-auto px-6 -mt-10 relative z-20">
                {/* Blockchain Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-dark border-white/10 rounded-[2.5rem] p-8 mb-12 shadow-2xl backdrop-blur-3xl"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Authentication</p>
                            <h3 className="text-xl font-bold text-white font-outfit">Quality Verified</h3>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 font-mono text-[10px] break-all text-emerald-500/80 mb-6 group cursor-help">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 uppercase font-sans font-bold tracking-tighter">SHA-256 HASH</span>
                            <Info className="w-3 h-3 text-slate-600 group-hover:text-primary transition-colors" />
                        </div>
                        {data.blockchain_hash || '0x... (Processing)'}
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed">
                        Every event in this product's history is cryptographically logged. Scan results demonstrate 100% adherence to PurFerme quality standards.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="space-y-12 pl-6 relative">
                    <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />

                    {data.timeline.map((event: any, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            {/* Timeline Marker */}
                            <div className="absolute -left-[30px] top-1 w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10" />

                            <div className="glass-dark border-white/10 rounded-[2rem] p-8 hover:border-primary/30 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5 uppercase tracking-widest leading-none">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <h4 className="text-2xl font-bold text-white font-outfit">{event.stage_name}</h4>
                                    </div>
                                    {event.is_damage_event && (
                                        <div className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Quality Action
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    {event.description}
                                </p>

                                {event.photo_urls.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {event.photo_urls.map((url: string, pIdx: number) => (
                                            <div key={pIdx} className="aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
                                                <img src={url} alt="Proof" className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="text-xs font-medium text-slate-500">PurFerme Verified Farm</span>
                                    </div>
                                    <button className="text-primary hover:underline text-xs font-bold flex items-center gap-1 group">
                                        Details
                                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Ingredients Transparency */}
                <div className="mt-20 pt-10 border-t border-white/10">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <FileCheck className="w-6 h-6 text-primary" />
                        Ingredient Transparency
                    </h3>
                    <div className="space-y-4">
                        {data.ingredients.map((ing: any, idx: number) => (
                            <div key={idx} className="glass border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-white font-bold text-sm mb-1">{ing.ingredient_id}</p>
                                    <p className="text-xs text-slate-500">{ing.source_label}</p>
                                </div>
                                {ing.coa_available && (
                                    <a
                                        href={ing.coa_link}
                                        target="_blank"
                                        className="bg-primary/10 hover:bg-primary/20 text-primary p-3 rounded-xl transition-all"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 text-center pb-10">
                    <p className="text-slate-600 text-xs font-medium leading-loose max-w-xs mx-auto">
                        PurFerme Traceability Protocol v1.0.
                        Powered by Ethereum-compatible private ledger.
                    </p>
                </div>
            </div>
        </div>
    );
}
