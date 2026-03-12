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
      <div className="min-h-screen bg-[#020617] text-slate-300 antialiased font-sans flex justify-center">
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
      <div className="min-h-screen bg-[#020617] text-slate-300 antialiased font-sans flex justify-center">
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
    <div className="min-h-screen bg-[#020617] text-slate-200 antialiased font-sans flex justify-center selection:bg-pink-500/30 selection:text-pink-200">
      <div className="w-full max-w-[480px] bg-gradient-to-b from-[#1a1c2c] to-[#020617] min-h-screen shadow-[0_0_100px_rgba(79,70,229,0.1)] relative overflow-hidden">
        
        {/* Ambient Glow Orbs */}
        <div className="absolute top-[10%] -left-[20%] w-[80%] aspect-square bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[80%] aspect-square bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] -left-[10%] w-[60%] aspect-square bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 text-center relative z-10">
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">Blockchain Secured</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[44px] leading-[0.9] font-black font-outfit mb-4 uppercase tracking-tighter"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              {data.batch_code.includes("BATCH") ? "Seed to Fork" : "Identity"}
            </span>
            <br />
            <span className="text-white">Traceability</span>
          </motion.h1>
          <p className="text-slate-400 text-xs font-medium px-10 leading-relaxed font-outfit">
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
            <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(147,51,234,0.5)]">
              <User className="w-4 h-4" /> Know More
            </button>
            <button className="bg-white/5 backdrop-blur-xl border border-white/10 text-white text-[11px] font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest">
              <Zap className="w-4 h-4 text-pink-400" /> Share
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] inline-flex items-center gap-4 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Verified Blockchain Twin</p>
            <p className="text-[10px] text-slate-400 font-mono italic">{data.blockchain_hash.substring(0, 16)}...</p>
          </div>
        </div>
      </section>

      {/* Ingredients & Composition Grid */}
      <section className="px-5 py-20 relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-[36px] leading-none font-black text-white mb-2 font-outfit uppercase tracking-tight">Ingredients</h2>
          <div className="h-1.5 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-black bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent font-outfit tracking-wider uppercase">{data.product_name}</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.ingredients.map((ing, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 p-6 rounded-[2rem] backdrop-blur-xl border border-white/10 group hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-white text-lg leading-tight font-outfit">
                  {ing.name} <span className="ml-1 text-purple-400">{ing.actual_percentage.toFixed(1)}%</span>
                </h4>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
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
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 group/coa"
                  >
                    <span className="text-[10px] font-black uppercase text-purple-200">View COA</span>
                    <ExternalLink className="w-3 h-3 text-purple-300 group-hover/coa:translate-x-0.5 group-hover/coa:-translate-y-0.5 transition-transform" />
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
          className={`w-full mt-12 bg-white/5 border border-white/10 backdrop-blur-md font-black uppercase tracking-[0.3em] text-[11px] py-6 rounded-3xl flex items-center justify-center gap-4 group transition-all shadow-xl ${data.forensic_report_url ? 'text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed opacity-50'}`}
        >
          <Database className="w-5 h-5 text-purple-400" />
          {data.forensic_report_url ? 'Full Compliance Ledger' : 'Ledger Verifying...'}
          <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform text-pink-400" />
        </button>
      </section>

      {/* Meet Your Farmer Section */}
      <section className="px-5 py-24 relative z-20">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-white/20 relative overflow-hidden shadow-2xl shadow-indigo-500/10">
          <div className="absolute top-8 right-8 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-600 shadow-lg shadow-purple-900/40 flex items-center justify-center"><ChevronUp className="w-4 h-4 text-white" /></div>
            <div className="w-9 h-9 rounded-full bg-pink-600 shadow-lg shadow-pink-900/40 flex items-center justify-center text-white"><Zap className="w-5 h-5" /></div>
          </div>

          <h3 className="text-3xl font-black text-white mb-12 font-outfit uppercase tracking-tighter">Meet The Maker</h3>

          <div className="flex items-center gap-8 mb-16">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-indigo-900/40 rotate-3 group hover:rotate-0 transition-transform duration-500">
              <img src={data.farmer?.profile_photo_url} alt="Farmer" className="w-full h-full object-cover filter brightness-90" />
            </div>
            <div className="-ml-3">
              <h4 className="text-[44px] leading-none font-black text-white font-outfit tracking-tighter">{data.farmer?.name}</h4>
              <div className="w-20 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-12">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 flex items-center gap-6 border border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400"><MapPin className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Source Farm</p>
                <p className="text-lg font-black text-white font-outfit leading-none">{data.farmer?.location}</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 flex items-center gap-6 border border-white/10">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400"><Calendar className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Partner Since</p>
                <p className="text-lg font-black text-white font-outfit leading-none">{data.farmer?.joined_date}</p>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h5 className="text-xs font-black text-indigo-300 uppercase tracking-widest">Our Shared Vision</h5>
            </div>
            <p className="text-[15px] text-slate-300 leading-relaxed font-bold font-outfit italic">
              "{data.farmer?.about}"
            </p>
          </div>
        </div>
      </section>

      {/* Accordions */}
      <section className="px-5 pb-32 space-y-6 relative z-20 font-outfit">
        {[
          { id: 'farm', label: 'Soil Health', icon: Tractor, subtitle: 'Micro-Nutrient Data' },
          { id: 'seed', label: 'Genetic Record', icon: Leaf, subtitle: 'Seed Heritage' },
          { id: 'journey', label: 'Event History', icon: Calendar, subtitle: 'Cryptographic Logs' },
          { id: 'logistics', label: 'Safe Transit', icon: Truck, subtitle: 'Cold-Chain Protocol' }
        ].map((sec) => (
          <div key={sec.id} className={`bg-white/5 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border transition-all duration-700 ${openSection === sec.id ? 'border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.15)]' : 'border-white/10 hover:border-white/20'}`}>
            <button
              onClick={() => setOpenSection(openSection === sec.id ? null : sec.id)}
              className="w-full px-8 py-9 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${openSection === sec.id ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 group-hover:bg-white/10'}`}>
                  <sec.icon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-white text-xl tracking-wide">{sec.label}</span>
                  <span className="block text-[10px] font-black text-indigo-400/60 uppercase tracking-widest mt-1.5">{sec.subtitle}</span>
                </div>
              </div>
              <ChevronDown className={`w-6 h-6 text-slate-600 transition-transform duration-700 ${openSection === sec.id ? 'rotate-180 text-purple-400' : ''}`} />
            </button>
            <AnimatePresence>
              {openSection === sec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-black/20 border-t border-white/5"
                >
                  <div className="p-8 space-y-10">
                    {sec.id === 'farm' && (
                      <div className="space-y-8">
                        <div>
                          <h6 className="text-[10px] font-black text-indigo-400/50 uppercase tracking-[0.3em] mb-5 text-center">Soil Mineral Analysis (NPK)</h6>
                          <div className="flex gap-4">
                            {data.farm?.npk_ratio.split(':').map((val, i) => (
                              <div key={i} className="flex-1 bg-white/5 p-5 rounded-3xl text-center border border-white/10 relative overflow-hidden group">
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="block text-2xl font-black text-white font-outfit">{val}</span>
                                <span className="block text-[9px] font-black text-indigo-300 uppercase mt-1 opacity-60 tracking-widest">{['Nitrogen', 'Phosphorus', 'Potassium'][i]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                            <Tractor className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                            <span className="block text-sm font-black text-white leading-tight mb-1">{data.farm?.farming_technology}</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tech Model</span>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center hover:bg-white/10 transition-colors">
                            <Globe className="w-6 h-6 text-pink-400 mx-auto mb-3" />
                            <span className="block text-sm font-black text-white leading-tight mb-1">{data.farm?.acreage}</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Acreage</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {sec.id === 'seed' && (
                      <div className="space-y-6">
                        <div className="p-8 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-[2.5rem] border border-white/10">
                          <div className="flex items-center gap-4 mb-5">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Leaf className="w-6 h-6" /></div>
                            <h6 className="font-outfit font-black text-xl text-white">SiA 3088 Heritage</h6>
                          </div>
                          <p className="text-[13px] font-bold text-slate-400 leading-relaxed italic border-l-2 border-purple-500/50 pl-5">
                            Verified short-duration botanical variety, genetically optimized for arid seedling vigor and nutrient density.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {['Individually Certified', 'Nutrihub Provenance', 'Climate-Resilient Bloom'].map((label, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                              <span className="text-xs font-black text-white uppercase tracking-widest leading-none">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sec.id === 'journey' && (
                      <div className="space-y-10 relative pl-8">
                        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/50 via-indigo-500/50 to-transparent" />
                        {data.timeline.map((evt, eIdx) => (
                          <div key={eIdx} className="relative group">
                            <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-[#1a1c2c] ring-2 ring-purple-500 shadow-[0_0_10px_#a855f7]" />
                            <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.3em] block mb-2">{new Date(evt.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <h5 className="font-black text-white text-lg tracking-tight mb-2 uppercase">{evt.stage_name}</h5>
                            <p className="text-sm font-bold text-slate-400 leading-relaxed mb-6">{evt.description}</p>
                            {evt.photo_urls.map((url, pIdx) => (
                              <div key={pIdx} className="relative group/img overflow-hidden rounded-3xl border border-white/10 shadow-xl">
                                <img src={url} alt="Proof" className="w-full h-48 object-cover group-hover/img:scale-110 transition-transform duration-700 brightness-90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                                  <span className="text-[10px] text-white/50 font-black uppercase tracking-widest italic">Encrypted IoT Proof Capture</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    {sec.id === 'logistics' && (
                      <div className="space-y-8">
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-center">
                          <div className="flex items-center justify-between mb-10 relative">
                             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10" />
                             <div className="z-10 bg-[#1a1c2c] p-3 rounded-full border border-purple-500/50 shadow-lg shadow-purple-500/20">
                               <MapPin className="w-6 h-6 text-purple-400" />
                             </div>
                             <div className="z-10 bg-[#1a1c2c] p-3 rounded-full border border-indigo-500/50 shadow-lg shadow-indigo-500/20">
                               <Globe className="w-6 h-6 text-indigo-400" />
                             </div>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-2">
                            <span>Srikakulam Origin</span>
                            <span>Final Destination</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                           <div className="flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-transparent p-5 rounded-2xl border border-purple-500/20">
                             <ShieldCheck className="w-6 h-6 text-purple-400" />
                             <div className="text-left">
                               <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Cold Chain Secured</p>
                               <p className="text-[9px] text-slate-500 font-bold italic">Temperature Monitored via Blockchain Hub</p>
                             </div>
                           </div>
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
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent italic">Efficacy</span>
          </h2>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.6em] mb-16">Verified Batch Standards</p>

          <div className="grid grid-cols-1 gap-24 font-outfit">
            {/* Products grid content remains similar but with transparent theme... */}
             <div className="relative group">
                <div className="absolute -inset-10 bg-purple-500/10 blur-[80px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                <img
                  src="https://traceability-hlwr.vercel.app/images/CookieBox.png"
                  alt="Cookies"
                  className="w-full max-w-[280px] mx-auto drop-shadow-[0_40px_40px_rgba(0,0,0,0.8)] relative z-10 hover:scale-105 transition-transform duration-500"
                  onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400")}
                />
                <div className="flex justify-center gap-4 mt-12 relative z-20">
                   <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[11px] font-black text-white px-8 py-4 rounded-2xl uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(147,51,234,0.4)] transition-all hover:scale-105 active:scale-95">Ledger</button>
                   <button className="bg-white/5 border border-pink-500/30 backdrop-blur-md text-[11px] font-black text-pink-300 px-8 py-4 rounded-2xl uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105 active:scale-95">Verify</button>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="pt-24 pb-20 border-t border-white/5 bg-gradient-to-b from-transparent to-purple-900/10">
          <div className="flex justify-center gap-12 text-slate-400 mb-16">
            <Globe className="w-6 h-6 hover:text-purple-400 transition-colors cursor-pointer" />
            <Database className="w-6 h-6 hover:text-indigo-400 transition-colors cursor-pointer" />
            <Zap className="w-6 h-6 hover:text-pink-400 transition-colors cursor-pointer" />
          </div>
          <p className="text-[12px] font-black text-purple-300/40 uppercase tracking-[0.8em] mb-8">
            PurFerme Identity
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 mx-auto mb-10 opacity-50" />
          <div className="space-y-2 opacity-40">
            <p className="text-[10px] text-indigo-300 uppercase font-black tracking-widest">Protocol Ledger: {data.batch_code}</p>
            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-[0.2em]">© 2026 PURFERME ORGANICS LIMITED</p>
          </div>
        </footer>
      </section>
    </div>
    </div>
  );
}
