'use client';
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Database,
  Info,
  User,
  Tractor,
  Leaf,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ChevronUp,
  Globe,
  Truck,
  Zap,
  CheckCircle2,
  PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// --- Types ---
interface Ingredient {
  ingredient_id: string;
  name: string;
  actual_percentage: number;
  source_type: string;
  source_label: string;
  coa_available: boolean;
  coa_link: string | null;
  procurement_details?: string;
  key_benefits?: { title: string; desc: string }[];
}

interface TimelineEvent {
  stage_name: string;
  event_date: string;
  description: string;
  photo_urls: string[];
  is_damage_event: boolean;
}

interface BatchData {
  batch_code: string;
  product_name: string;
  blockchain_hash: string;
  locked_at: string;
  ingredients: Ingredient[];
  timeline: TimelineEvent[];
  farmer?: {
    name: string;
    location: string;
    about: string;
    profile_photo_url?: string;
    joined_date?: string;
  };
  farm?: {
    id: string;
    name: string;
    acreage: string;
    npk_ratio: string;
    farming_technology: string;
    location_pin: string;
  };
  forensic_report_url?: string;
}

export default function ConsumerJourneyPage() {
  const { code } = useParams();
  const [data, setData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const batchCode = code as string;
    if (!batchCode) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await axios.get(`${API_ROOT}/public/batch/${batchCode}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Product certificate not found on the PurFerme ledger.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0b2e] text-slate-300 antialiased font-sans flex justify-center">
        <div className="w-full max-w-[480px] bg-[#2D0E3D] min-h-screen flex items-center justify-center p-6 text-center shadow-2xl">
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[#FFA500] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/50 font-medium font-outfit">Verifying Smart Contract...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#1a0b2e] text-slate-300 antialiased font-sans flex justify-center">
        <div className="w-full max-w-[480px] bg-[#2D0E3D] min-h-screen flex items-center justify-center p-6 text-center shadow-2xl">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] max-w-sm backdrop-blur-xl">
            <Info className="w-12 h-12 text-[#FFD700] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2 font-outfit tracking-tight">Entry Not Found</h1>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">{error || "This batch code is not registered on the PurFerme ledger yet."}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#FFA500] text-[#2D0E3D] font-black text-xs py-4 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              Retry Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a0b2e] text-slate-200 antialiased font-sans flex justify-center selection:bg-[#FFA500]/30 selection:text-white">
      <div className="w-full max-w-[480px] bg-gradient-to-b from-[#3a1250] to-[#2D0E3D] min-h-screen shadow-[0_0_100px_rgba(45,14,61,0.5)] relative overflow-hidden">
        
        {/* Ambient Glow Orbs - Shifted to Deep Purple/Yellow hues */}
        <div className="absolute top-[10%] -left-[20%] w-[80%] aspect-square bg-[#FFA500]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[80%] aspect-square bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] -left-[10%] w-[60%] aspect-square bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-6 text-center relative z-10 bg-[#2D0E3D]">
          <div className="mb-12">
            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
          >
            <ShieldCheck className="w-4 h-4 text-[#FFA500]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFA500]/80">Blockchain Secured</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[44px] leading-[0.9] font-black font-outfit mb-4 uppercase tracking-tighter"
          >
            <span className="bg-gradient-to-r from-[#FFA500] via-yellow-200 to-[#FFA500] bg-clip-text text-transparent">
              {data.batch_code.includes("BATCH") ? "Seed to Fork" : "Identity"}
            </span>
            <br />
            <span className="text-white">Traceability</span>
          </motion.h1>
          <p className="text-white/40 text-xs font-medium px-10 leading-relaxed font-outfit">
            Witness the transparent journey of your product, verified by the PurFerme ledger.
          </p>
          </div>

          {/* Video Placeholder */}
          <div className="relative mx-auto w-full aspect-square mb-12 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2D0E3D] via-transparent to-transparent z-10 rounded-[3rem]" />
            <div className="w-full h-full rounded-[3.5rem] border border-white/10 overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] group-hover:scale-[1.02] transition-transform duration-500">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover filter brightness-75 contrast-110"
                poster="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=800"
              >
                <source src="https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-with-a-basket-of-vegetables-in-a-field-34151-large.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <PlayCircle className="w-16 h-16 text-white/50" />
              </div>
            </div>

            {/* Overlay Buttons */}
          <div className="absolute inset-x-0 -bottom-6 flex justify-center gap-4 z-30">
            <button className="bg-gradient-to-r from-[#2D0E3D] to-[#4c1d95] hover:from-[#1e0b2a] hover:to-[#2D0E3D] text-white text-[11px] font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] border border-white/5">
              <User className="w-4 h-4 text-[#FFA500]" /> Know More
            </button>
            <button className="bg-white/5 backdrop-blur-xl border border-white/10 text-white text-[11px] font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest">
              <Zap className="w-4 h-4 text-[#FFA500]" /> Share
            </button>
          </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] inline-flex items-center gap-4 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#FFA500] flex items-center justify-center shadow-lg shadow-[#FFA500]/20">
            <ShieldCheck className="w-7 h-7 text-[#2D0E3D]" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Verified Blockchain Twin</p>
            <p className="text-[10px] text-white/40 font-mono italic">{data.blockchain_hash.substring(0, 16)}...</p>
          </div>
        </div>
        </section>

        {/* Ingredients & Composition Grid */}
        <section className="px-5 py-20 relative z-20 bg-[#2D0E3D] rounded-t-[4rem] -mt-10 shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full" />

          <div className="text-center mb-16">
          <h2 className="text-[36px] leading-[1.1] font-black text-white mb-2 font-outfit uppercase tracking-tight">Ingredients & Composition</h2>
          <div className="h-1.5 w-20 bg-[#FFA500] rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-black text-[#FFA500]/80 font-outfit tracking-tighter uppercase">{data.product_name}</h3>
        </div>

          <div className="grid grid-cols-1 gap-4">
            {data.ingredients.map((ing, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-sm group hover:shadow-md transition-shadow backdrop-blur-md"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-white text-[18px] leading-tight font-outfit">
                    {ing.name} <span className="ml-1 text-[#FFA500]">{ing.actual_percentage.toFixed(1)}%</span>
                  </h4>
                </div>

                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${ing.actual_percentage}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className="h-full bg-[#FFA500] rounded-full"
                  />
                </div>

                <div className="flex justify-between items-center">
                  {ing.coa_available && ing.coa_link ? (
                  <button
                    onClick={() => window.open(ing.coa_link!, '_blank')}
                    className="flex items-center gap-2 bg-[#FFA500]/10 border border-[#FFA500]/30 px-4 py-2 rounded-xl transition-all hover:bg-[#FFA500]/20 group/coa"
                  >
                    <span className="text-[10px] font-black uppercase text-[#FFA500]">View COA</span>
                    <ExternalLink className="w-3 h-3 text-[#FFA500]/70 group-hover/coa:translate-x-0.5 group-hover/coa:-translate-y-0.5 transition-transform" />
                  </button>
                ) : (
                    <div className="flex items-center gap-2 opacity-30">
                      <span className="text-[10px] font-black uppercase text-slate-400">COA Pending</span>
                    </div>
                  )}

                  <span className="text-[12px] font-medium text-slate-500 italic">{ing.source_label}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button
          onClick={() => data.forensic_report_url && window.open(data.forensic_report_url, '_blank')}
          className={`w-full mt-12 bg-white/5 border border-white/10 backdrop-blur-md font-black uppercase tracking-[0.3em] text-[11px] py-6 rounded-3xl flex items-center justify-center gap-4 group transition-all shadow-xl ${data.forensic_report_url ? 'text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed opacity-50'}`}
        >
          <Database className="w-5 h-5 text-[#FFA500]" />
          {data.forensic_report_url ? 'Full Compliance Ledger' : 'Ledger Verifying...'}
          <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform text-[#FFA500]/50" />
        </button>
        </section>

        {/* Meet Your Farmer Section */}
        <section className="px-5 py-24 relative z-20 bg-[#2D0E3D]">
          <div className="bg-white/5 rounded-[3.5rem] p-10 border border-white/10 relative overflow-hidden shadow-xl shadow-black/5 backdrop-blur-md">
            <div className="absolute top-8 right-8 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFA500] shadow-lg flex items-center justify-center text-[#2D0E3D]"><ChevronUp className="w-4 h-4" /></div>
              <div className="w-9 h-9 rounded-full bg-white/10 shadow-lg flex items-center justify-center text-[#FFA500] border border-white/5"><Zap className="w-5 h-5" /></div>
            </div>

            <h3 className="3xl font-black text-white mb-12 font-outfit uppercase tracking-tighter">Meet Your Farmer</h3>

            <div className="flex items-center gap-8 mb-16">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-slate-100 rotate-3 group hover:rotate-0 transition-transform duration-500">
                <img src={data.farmer?.profile_photo_url} alt="Farmer" className="w-full h-full object-cover" />
              </div>
              <div className="-ml-3">
                <h4 className="text-[44px] leading-none font-black text-white font-outfit tracking-tighter">{data.farmer?.name}</h4>
                <div className="w-20 h-2 bg-[#FFA500] rounded-full mt-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-12">
              <div className="bg-white/5 rounded-3xl p-6 flex items-center gap-6 border border-white/10 shadow-sm backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400"><MapPin className="w-7 h-7" /></div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Source Village</p>
                  <p className="text-lg font-black text-white font-outfit leading-none">{data.farmer?.location}</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-3xl p-6 flex items-center gap-6 border border-white/10 shadow-sm backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400"><Calendar className="w-7 h-7" /></div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Farmer Since</p>
                  <p className="text-lg font-black text-white font-outfit leading-none">{data.farmer?.joined_date}</p>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-[#FFA500]" />
              <h5 className="text-xs font-black text-white uppercase tracking-widest">Our Shared Vision</h5>
            </div>
            <p className="text-[15px] text-white/70 leading-relaxed font-bold font-outfit italic">
              "{data.farmer?.about}"
            </p>
          </div>
          </div>
        </section>

        {/* Accordions */}
        <section className="px-5 pb-32 space-y-6 relative z-20 bg-[#2D0E3D] font-outfit">
          {[
            { id: 'farm', label: 'Farm Information', icon: Tractor, subtitle: 'Soil Analysis & Tech' },
            { id: 'seed', label: 'Seed Documentation', icon: Leaf, subtitle: 'Botanical Heritage' },
            { id: 'journey', label: 'Crop Journey', icon: Calendar, subtitle: 'Seed to Harvest' },
            { id: 'logistics', label: 'Logistics Protocol', icon: Truck, subtitle: 'Real-time Tracking' }
          ].map((sec) => (
            <div key={sec.id} className={`bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 transition-all duration-700 backdrop-blur-md ${openSection === sec.id ? 'ring-2 ring-[#FFA500] shadow-xl' : 'shadow-md shadow-black/5 hover:shadow-lg'}`}>
              <button
                onClick={() => setOpenSection(openSection === sec.id ? null : sec.id)}
                className="w-full px-8 py-9 flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${openSection === sec.id ? 'bg-[#FFA500] text-[#2D0E3D]' : 'bg-white/10 text-white/30'}`}>
                    <sec.icon className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-white text-xl tracking-wide">{sec.label}</span>
                    <span className="block text-[10px] font-black text-white/40 uppercase tracking-widest mt-1.5">{sec.subtitle}</span>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-white/30 transition-transform duration-700 ${openSection === sec.id ? 'rotate-180 text-[#FFA500]' : ''}`} />
              </button>
              <AnimatePresence>
                {openSection === sec.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/5 border-t border-white/10"
                  >
                    <div className="p-8 space-y-10">
                      {sec.id === 'farm' && (
                        <div className="space-y-8">
                          <div>
                            <h6 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-5 text-center">Soil Analysis (NPK)</h6>
                            <div className="flex gap-4">
                              {data.farm?.npk_ratio.split(':').map((val, i) => (
                                <div key={i} className="flex-1 bg-white/5 p-5 rounded-3xl text-center border border-white/10 shadow-sm relative overflow-hidden group backdrop-blur-md">
                                  <div className="absolute inset-x-0 bottom-0 h-1 bg-[#FFA500] opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <span className="block text-2xl font-black text-white font-outfit">{val}</span>
                                  <span className="block text-[9px] font-black text-white/40 uppercase mt-1 tracking-widest">{['Nitrogen', 'Phosphorus', 'Potassium'][i]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center shadow-sm backdrop-blur-md">
                              <Tractor className="w-6 h-6 text-[#FFA500] mx-auto mb-3" />
                              <span className="block text-sm font-black text-white leading-tight mb-1">{data.farm?.farming_technology}</span>
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Technology</span>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center shadow-sm backdrop-blur-md">
                              <Globe className="w-6 h-6 text-green-500 mx-auto mb-3" />
                              <span className="block text-sm font-black text-white leading-tight mb-1">{data.farm?.acreage}</span>
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Land Area</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {sec.id === 'seed' && (
                        <div className="space-y-6">
                          <div className="p-8 bg-[#2D0E3D] rounded-[2.5rem] border border-white/5 text-white">
                            <div className="flex items-center gap-4 mb-5">
                              <div className="w-10 h-10 rounded-full bg-[#FFA500]/20 flex items-center justify-center text-[#FFA500]"><Leaf className="w-6 h-6" /></div>
                              <h6 className="font-outfit font-black text-xl">SiA 3088 Variety</h6>
                            </div>
                            <p className="text-[13px] font-medium text-white/60 leading-relaxed italic border-l-2 border-[#FFA500]/30 pl-5">
                              Distinguished short-duration variety, specifically bred for superior drought tolerance and seedling vigor.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {['Certified Non-GMO', 'Nutrihub Standardized', 'High Vigor Germination'].map((label, i) => (
                              <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-xs font-black text-white uppercase tracking-widest leading-none">{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {sec.id === 'journey' && (
                        <div className="space-y-10 relative pl-8">
                          <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />
                          {data.timeline.map((evt, eIdx) => (
                            <div key={eIdx} className="relative group">
                              <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-white ring-2 ring-[#FFA500] shadow-sm transform group-hover:scale-125 transition-transform" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">{new Date(evt.event_date).toLocaleDateString()}</span>
                              <h5 className="font-black text-white text-lg tracking-tight mb-2 uppercase">{evt.stage_name}</h5>
                              <p className="text-sm font-bold text-white/70 leading-relaxed mb-6">{evt.description}</p>
                              {evt.photo_urls.map((url, pIdx) => (
                                <div key={pIdx} className="rounded-3xl overflow-hidden border border-white/10 shadow-md">
                                  <img src={url} alt="Proof" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-700" />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {sec.id === 'logistics' && (
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-sm text-center backdrop-blur-md">
                          <div className="flex items-center justify-between mb-10 relative">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10 border-dashed" />
                            <div className="z-10 bg-white p-3 rounded-full border border-white/10 shadow-sm">
                              <MapPin className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="z-10 bg-white p-3 rounded-full border border-white/10 shadow-sm">
                              <Globe className="w-6 h-6 text-[#FFA500]" />
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] text-white/40 px-2">
                            <span>Srikakulam Origin</span>
                            <span>PurFerme Hub</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </section>

        {/* Final Section */}
      <section className="px-5 py-32 text-center bg-gradient-to-b from-white/5 to-transparent relative z-20">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           className="mb-24"
        >
          <h2 className="text-[44px] leading-[0.85] font-black font-outfit mb-6 uppercase tracking-tighter">
            <span className="text-white">Forensic</span><br />
            <span className="bg-gradient-to-r from-[#FFA500] to-yellow-200 bg-clip-text text-transparent italic">Transparency</span>
          </h2>
          <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.6em] mb-16">Verified Batch Standards</p>

            <div className="grid grid-cols-1 gap-24 font-outfit">
              <div className="relative">
                <div className="absolute inset-0 bg-white/5 blur-[50px] rounded-full" />
                <img
                  src="https://traceability-hlwr.vercel.app/images/CookieBox.png"
                  alt="Cookies"
                  className="w-full max-w-[280px] mx-auto drop-shadow-2xl relative z-10"
                  onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400")}
                />
                <div className="flex justify-center gap-4 mt-12 relative z-20">
                  <button className="bg-[#2D0E3D] text-[11px] font-black text-white px-8 py-4 rounded-2xl uppercase tracking-widest shadow-xl hover:bg-[#1a0b2e]">View Source</button>
                  <button className="bg-white border-2 border-slate-100 text-[11px] font-black text-[#2D0E3D] px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-50">Lab Report</button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <footer className="pt-24 pb-20 border-t border-slate-100">
            <div className="flex justify-center gap-12 text-slate-300 mb-16">
              <Globe className="w-6 h-6 hover:text-[#FFA500] transition-colors cursor-pointer" />
              <Database className="w-6 h-6 hover:text-[#2D0E3D] transition-colors cursor-pointer" />
              <Zap className="w-6 h-6 hover:text-[#FFA500] transition-colors cursor-pointer" />
            </div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em] mb-8">
              PurFerme Protocol
            </p>
            <div className="w-12 h-0.5 bg-slate-100 mx-auto mb-10" />
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Verified Digital Twin: {data.batch_code}</p>
              <p className="text-[8px] text-slate-300 uppercase font-bold tracking-widest italic">© 2026 PURFERME ORGANICS LIMITED</p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
