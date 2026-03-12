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
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 antialiased font-sans flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl relative selection:bg-[#FFA500] selection:text-[#2D0E3D]">

        {/* Hero Section with Video */}
      <section className="pt-12 pb-16 px-6 text-center relative overflow-hidden bg-[#2D0E3D]">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

        <div className="relative z-20 mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[42px] leading-tight font-black text-white font-outfit mb-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] uppercase tracking-tighter"
          >
            {data.batch_code.includes("BATCH") ? "Seed to Fork Traceability" : "Identity Verified"}
          </motion.h1>
          <p className="text-white/50 text-[11px] font-medium tracking-wide uppercase px-8">
            Discover the complete journey of your product from seed to fork!
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
            <button className="bg-[#5D2A7A] hover:bg-[#4E2366] text-white text-[11px] font-black px-8 py-3 rounded-2xl flex items-center gap-2 transition-all uppercase tracking-widest shadow-xl">
              <User className="w-4 h-4" /> Know More
            </button>
            <button className="bg-[#5D2A7A] hover:bg-[#4E2366] text-white text-[11px] font-black px-8 py-3 rounded-2xl flex items-center gap-2 transition-all uppercase tracking-widest shadow-xl">
              <Zap className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2rem] inline-flex items-center gap-4 border border-white/10 shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-[#FFA500] flex items-center justify-center shadow-lg shadow-[#FFA500]/20">
            <ShieldCheck className="w-6 h-6 text-[#2D0E3D]" />
          </div>
          <div className="text-left">
            <p className="text-[12px] font-black text-white uppercase tracking-[0.2em]">Verified Blockchain ID</p>
            <p className="text-[10px] text-white/40 font-mono">{data.blockchain_hash.substring(0, 16)}...</p>
          </div>
        </div>
      </section>

      {/* Ingredients & Composition Grid */}
      <section className="px-5 py-16 bg-white rounded-t-[4rem] shadow-[0_-30px_60px_rgba(0,0,0,0.4)] relative -mt-8">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full" />

        <div className="text-center mb-12">
          <h2 className="text-[32px] font-black text-[#2D0E3D] mb-1 font-outfit uppercase tracking-tight">Ingredients & Composition</h2>
          <h3 className="text-[18px] font-black text-[#5D2A7A] mb-8 font-outfit tracking-tight">{data.product_name}</h3>
          
          <p className="text-[11px] text-slate-400 max-w-[85%] mx-auto leading-relaxed font-medium italic mb-10">
            COA (Certificate of Analysis) documents prove the quality and purity of our ingredients.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.ingredients.map((ing, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 group"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[#2D0E3D] text-[16px] leading-tight font-outfit">
                  {ing.name} <span className="ml-1 text-[16px] font-black">{ing.actual_percentage.toFixed(1)}%</span>
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
                    className="flex items-center gap-1.5 bg-[#FFF9EA] border border-[#FFA500]/20 px-3 py-1 rounded-lg transition-all group/coa"
                  >
                    <span className="text-[10px] font-black uppercase text-[#2D0E3D]">COA</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover/coa:text-[#FFA500]" />
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
          className={`w-full mt-12 border border-slate-200 font-black uppercase tracking-[0.2em] text-[12px] py-6 rounded-[2.5rem] flex items-center justify-center gap-4 group transition-all shadow-sm ${data.forensic_report_url ? 'bg-white text-[#2D0E3D] hover:bg-[#FFA500] hover:text-[#2D0E3D]' : 'bg-white text-slate-300 cursor-not-allowed opacity-50'}`}
        >
          <Database className="w-5 h-5 text-slate-400" />
          {data.forensic_report_url ? 'Full Compliance Report' : 'Compliance Report Pending'}
          <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* Meet Your Farmer Section */}
      <section className="px-5 py-20 bg-white">
        <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <div className="absolute top-8 right-8 flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFA500] shadow-lg flex items-center justify-center"><ChevronUp className="w-4 h-4 text-[#2D0E3D]" /></div>
            <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#FFA500]"><Zap className="w-5 h-5" /></div>
          </div>

          <h3 className="text-2xl font-black text-[#2D0E3D] mb-12 font-outfit uppercase tracking-tighter">Meet Your Farmer</h3>

          <div className="flex items-center gap-8 mb-12">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-200 rotate-3 group hover:rotate-0 transition-transform duration-500">
              <img src={data.farmer?.profile_photo_url} alt="Farmer" className="w-full h-full object-cover" />
            </div>
            <div className="-ml-4">
              <h4 className="text-[40px] leading-none font-black text-[#2D0E3D] font-outfit tracking-tighter">{data.farmer?.name}</h4>
              <div className="w-16 h-2 bg-[#FFA500] rounded-full mt-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 flex items-center gap-5 shadow-lg shadow-black/5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shadow-inner"><MapPin className="w-6 h-6 text-red-400" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source Village</p>
                <p className="text-[15px] font-black text-[#2D0E3D] font-outfit">{data.farmer?.location}</p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 flex items-center gap-5 shadow-lg shadow-black/5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-inner"><Calendar className="w-6 h-6 text-blue-400" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Farmer Since</p>
                <p className="text-[15px] font-black text-[#2D0E3D] font-outfit">{data.farmer?.joined_date}</p>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-[#2D0E3D]/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#FFA500]" />
              <h5 className="text-[12px] font-black text-[#2D0E3D] uppercase tracking-widest">The Partnership</h5>
            </div>
            <p className="text-sm text-[#2D0E3D]/70 leading-relaxed font-bold font-outfit">
              {data.farmer?.about}
            </p>
          </div>
        </div>
      </section>

      {/* Detail Accordions */}
      <section className="px-5 pb-20 space-y-6">
        {[
          { id: 'farm', label: 'Farm Information', icon: Tractor, subtitle: 'Soil Analysis & Tech' },
          { id: 'seed', label: 'Seed Documentation', icon: Leaf, subtitle: 'SiA 3088 Variety' },
          { id: 'journey', label: 'Crop Journey', icon: Calendar, subtitle: 'Seed to Harvest' },
          { id: 'logistics', label: 'Logistics Protocol', icon: Truck, subtitle: 'Real-time Tracking' }
        ].map((sec) => (
          <div key={sec.id} className={`bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-slate-100 transition-all duration-500 ${openSection === sec.id ? 'ring-2 ring-orange-400' : ''}`}>
            <button
              onClick={() => setOpenSection(openSection === sec.id ? null : sec.id)}
              className="w-full px-8 py-7 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${openSection === sec.id ? 'bg-[#FFA500] text-[#2D0E3D]' : 'bg-slate-50 text-slate-200 group-hover:bg-slate-100 group-hover:text-slate-400'}`}>
                  <sec.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[#2D0E3D] text-[18px] font-outfit leading-tight">{sec.label}</span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{sec.subtitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 transition-opacity duration-500 ${openSection === sec.id ? 'opacity-100 text-[#FFA500]' : 'opacity-20 text-slate-300'}`} />
                <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-500 ${openSection === sec.id ? 'rotate-180 text-[#FFA500]' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {openSection === sec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                  className="bg-slate-50/70 border-t border-slate-100"
                >
                  <div className="p-8 space-y-8">
                    {sec.id === 'farm' && (
                      <>
                        <div>
                          <h6 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Soil Analysis (NPK)</h6>
                          <div className="flex gap-3">
                            {data.farm?.npk_ratio.split(':').map((val, i) => (
                              <div key={i} className="flex-1 bg-white p-3 rounded-2xl text-center shadow-sm border border-slate-100">
                                <span className="block text-[14px] font-black text-[#2D0E3D] font-outfit">{val}</span>
                                <span className="block text-[8px] font-black text-slate-400 uppercase mt-0.5">{['N', 'P', 'K'][i]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
                            <Tractor className="w-5 h-5 text-[#FFA500] mx-auto mb-2" />
                            <span className="block text-[12px] font-black text-[#2D0E3D] font-outfit leading-tight">{data.farm?.farming_technology}</span>
                            <span className="block text-[8px] font-black text-slate-400 uppercase mt-1">Technology</span>
                          </div>
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
                            <Globe className="w-5 h-5 text-green-500 mx-auto mb-2" />
                            <span className="block text-[12px] font-black text-[#2D0E3D] font-outfit leading-tight">{data.farm?.acreage}</span>
                            <span className="block text-[8px] font-black text-slate-400 uppercase mt-1">Land Area</span>
                          </div>
                        </div>
                      </>
                    )}
                    {sec.id === 'seed' && (
                      <div className="space-y-6">
                        <div className="p-5 bg-[#2D0E3D] rounded-3xl text-white">
                          <div className="flex items-center gap-3 mb-3">
                            <Leaf className="w-5 h-5 text-[#FFA500]" />
                            <h6 className="font-outfit font-black text-[16px]">SiA 3088 Variety</h6>
                          </div>
                          <p className="text-[12px] font-medium text-white/60 leading-relaxed italic">
                            Distinguished short-duration variety, specifically bred for superior drought tolerance and exceptional seedling vigor.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {['Certified Non-GMO', 'Nutrihub Seed Center', 'High Stress Vigor'].map((label, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-[11px] font-black text-[#2D0E3D] uppercase tracking-wide">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sec.id === 'journey' && (
                      <div className="space-y-8 relative pl-6">
                        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-dashed bg-slate-200" style={{ backgroundImage: 'linear-gradient(to bottom, #cbd5e1 50%, rgba(255,255,255,0) 0%)', backgroundSize: '1px 8px' }} />
                        {data.timeline.map((evt, eIdx) => (
                          <div key={eIdx} className="relative">
                            <div className="absolute -left-[20px] top-1.5 w-3 h-3 rounded-full bg-[#FFA500] ring-4 ring-white shadow-sm" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{new Date(evt.event_date).toLocaleDateString()}</span>
                            <h5 className="font-black text-[#2D0E3D] text-[16px] font-outfit tracking-tight">{evt.stage_name}</h5>
                            <p className="text-[12px] font-bold text-slate-500 mt-2 leading-relaxed">{evt.description}</p>
                            {evt.photo_urls.map((url, pIdx) => (
                              <img key={pIdx} src={url} alt="Proof" className="w-full h-32 object-cover rounded-2xl mt-4 border border-slate-100" />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    {sec.id === 'logistics' && (
                      <div className="p-6 bg-[#FFF9EA] rounded-3xl border border-[#FFA500]/10">
                        <div className="flex items-center justify-between mb-8">
                          <div className="text-center flex-1">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center mx-auto mb-2 text-[#FFA500]"><Tractor className="w-5 h-5" /></div>
                            <span className="text-[9px] font-black uppercase text-slate-400">Originated</span>
                          </div>
                          <div className="flex-[2] px-4">
                            <motion.div
                              animate={{ x: [0, 100, 0] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="w-full h-0.5 bg-slate-200 relative"
                            >
                              <Truck className="w-4 h-4 text-[#FFA500] absolute -top-1.5" />
                            </motion.div>
                          </div>
                          <div className="text-center flex-1">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center mx-auto mb-2 text-blue-500"><Truck className="w-5 h-5" /></div>
                            <span className="text-[9px] font-black uppercase text-slate-400">Arrived</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                          <ShieldCheck className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] font-black text-[#2D0E3D] uppercase tracking-widest">Signed & Secure Transit</span>
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

      {/* Experience Transparency Products */}
      <section className="px-5 py-24 text-center bg-slate-50 rounded-t-[5rem]">
        <motion.h2
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          className="text-[42px] leading-tight font-black text-[#5D2A7A] mb-3 font-outfit uppercase tracking-tighter drop-shadow-sm"
        >
          Forensic <br /> Transparency
        </motion.h2>
        <p className="text-slate-400 text-[11px] uppercase font-black tracking-[0.4em] mb-20">Verified Ingredient Efficacy</p>

        <div className="grid grid-cols-1 gap-24">
          {/* Product 1: Cookie Box */}
          <motion.div
            whileHover={{ y: -10 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-150" />
            <img
              src="https://traceability-hlwr.vercel.app/images/CookieBox.png"
              alt="Cookies"
              className="w-full max-w-[320px] mx-auto drop-shadow-[0_50px_50px_rgba(0,0,0,0.8)] relative z-10"
              onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400")}
            />
            <div className="flex justify-center gap-4 mt-12 relative z-20">
              <button className="bg-white text-[11px] font-black text-[#2D0E3D] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2 uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                <ExternalLink className="w-4 h-4 text-[#FFA500]" /> View Source
              </button>
              <button className="bg-[#2D0E3D] border-2 border-white/10 text-[11px] font-black text-[#FFA500] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2 uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                <Database className="w-4 h-4" /> Lab Report
              </button>
            </div>
          </motion.div>

          {/* Product 2: Millet Bar */}
          <motion.div
            whileHover={{ y: -10 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#FFA500]/5 blur-[100px] rounded-full scale-110" />
            <img
              src="https://traceability-hlwr.vercel.app/images/MilletBar.png"
              alt="Millet Bar"
              className="w-full max-w-[320px] mx-auto drop-shadow-[0_50px_50px_rgba(0,0,0,0.8)] relative z-10"
              onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1622484210631-f7039a7b97a2?w=400")}
            />
            <div className="flex justify-center gap-4 mt-12 relative z-20">
              <button className="bg-white text-[11px] font-black text-[#2D0E3D] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2 uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                <ExternalLink className="w-4 h-4 text-[#FFA500]" /> View Source
              </button>
              <button className="bg-[#2D0E3D] border-2 border-white/10 text-[11px] font-black text-[#FFA500] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2 uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                <Database className="w-4 h-4" /> Lab Report
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-16 text-center border-t border-slate-100 bg-[#020617]">
        <div className="flex justify-center gap-12 text-slate-500 mb-12">
          <Globe className="w-7 h-7 hover:text-[#FFA500] transition-colors cursor-help" />
          <Database className="w-7 h-7 hover:text-[#FFA500] transition-colors cursor-help" />
          <Zap className="w-7 h-7 hover:text-[#FFA500] transition-colors cursor-help" />
        </div>
        <div className="space-y-6">
          <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.6em]">
            PurFerme Identity Protocol
          </p>
          <div className="w-16 h-[2px] bg-white/10 mx-auto" />
          <div className="space-y-1">
            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Verified Digital Twin: {data.batch_code}</p>
            <p className="text-[9px] text-white/10 uppercase font-bold tracking-widest">© 2026 PURFERME ORGANICS LIMITED</p>
          </div>
        </div>
      </footer>
    </div>
    </div>
  );
}
