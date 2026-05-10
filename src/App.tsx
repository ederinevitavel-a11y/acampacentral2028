import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, TreePine, Tent, Send, CheckCircle2, MapPin, Calendar, Heart } from 'lucide-react';
import { FormField, Input, Select, TextArea, cn } from './components/UI';
import axios from 'axios';

export default function App() {
  const [stats, setStats] = useState({ totalSim: 0, totalRegistrations: 0, publicPercentage: 0, interestPercentage: 0 }); // Iniciando zerado
  const [daysLeft, setDaysLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    interest: '',
    monthlyValue: '',
    paymentPreference: '',
    paymentPreferenceOther: '',
    suggestions: ''
  });

  const GOAL = 150;

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/stats');
        if (response.data && typeof response.data.totalSim === 'number') {
          const totalSim = response.data.totalSim;
          const totalReg = response.data.totalRegistrations || stats.totalRegistrations;
          setStats({
            totalSim: totalSim,
            totalRegistrations: totalReg,
            interestPercentage: Math.min(Math.round((totalSim / GOAL) * 100), 100),
            publicPercentage: Math.min(Math.round((totalReg / GOAL) * 100), 100)
          });
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    const calculateDays = () => {
      const targetDate = new Date('2026-05-17T23:59:59');
      const now = new Date();
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setDaysLeft(diffDays);
    };

    fetchStats();
    calculateDays();
    
    // Refresh stats every 30s, recalculate days every hour
    const statsInterval = setInterval(fetchStats, 30000);
    const daysInterval = setInterval(calculateDays, 3600000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(daysInterval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/submit', formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Update stats optimistically
      const isSim = formData.interest === 'Sim';
      setStats(prev => {
        const newTotalSim = isSim ? prev.totalSim + 1 : prev.totalSim;
        const newTotalReg = prev.totalRegistrations + 1;
        return {
          totalRegistrations: newTotalReg,
          totalSim: newTotalSim,
          interestPercentage: Math.min(Math.round((newTotalSim / GOAL) * 100), 100),
          publicPercentage: Math.min(Math.round((newTotalReg / GOAL) * 100), 100)
        };
      });
    } catch (error: any) {
      console.error(error);
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.details || error.message || 'Erro desconhecido';
      
      let finalMessage = `ERRO AO ENVIAR: ${errorMessage} (Status: ${statusCode})`;
      
      if (statusCode === 405 || statusCode === 404) {
        finalMessage += `\n\nMOTIVO: Erro de rota no servidor. O Vercel pode demorar alguns minutos para propagar as mudanças nas APIs.`;
      } else {
        finalMessage += `\n\nIMPORTANTE: Verifique se você configurou a APPS_SCRIPT_URL nas 'Environment Variables' do seu painel do Vercel.`;
      }
      
      alert(finalMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      whatsapp: '',
      interest: '',
      monthlyValue: '',
      paymentPreference: '',
      paymentPreferenceOther: '',
      suggestions: ''
    });
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F8FAFC] font-sans selection:bg-primary transition-colors duration-500 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary blur-[120px] rounded-full" />
      </div>

      <nav className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-6 sm:py-8 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4 sm:gap-8 md:gap-12">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-black dark:bg-[#0A0A0B] transform rotate-45 border border-white/20"></div>
            </div>
            <span className="font-black tracking-tighter text-sm sm:text-base md:text-xl uppercase">IBCIP</span>
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-4 sm:pl-8 h-10">
            <div className="flex flex-col gap-1.5 w-24 sm:w-48 md:w-72">
              <div className="flex justify-between items-end">
                <span className="text-[9px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-widest leading-none">Meta Interesse</span>
                <span className="text-[12px] sm:text-[15px] text-primary font-black leading-none">{stats.interestPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${stats.interestPercentage}%` }}
                   className="h-full bg-primary shadow-[0_0_12px_rgba(45,212,191,0.6)]"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row px-4 sm:px-6 md:px-12 gap-8 lg:gap-12 items-center py-8 md:py-12 relative z-10 max-w-7xl mx-auto w-full">
        {/* Left Content: Hero Typography */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left pt-4 lg:pt-0 lg:-translate-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[42px] sm:text-[64px] md:text-[94px] lg:text-[124px] leading-[1] md:leading-[0.95] font-black tracking-tighter mb-6 md:mb-10"
          >
            ACAMPA<br/>
            <span className="stroke-text uppercase">Central</span>
            2028
          </motion.h1>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center lg:justify-start gap-6 sm:gap-10 md:gap-16 mt-4 px-2 sm:px-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center lg:items-start">
              <p className="text-3xl sm:text-4xl md:text-5xl font-black">{stats.totalRegistrations}</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1 sm:mt-2 font-bold">Inscritos</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center lg:items-start">
              <p className="text-3xl sm:text-4xl md:text-5xl font-black">{daysLeft}</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1 sm:mt-2 font-bold whitespace-nowrap">Dias para o fim</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center lg:items-start col-span-2 sm:col-span-1 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 w-full sm:w-auto">
              <p className="text-5xl sm:text-6xl md:text-7xl font-black text-primary drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">{stats.publicPercentage}%</p>
              <p className="text-[10px] sm:text-[12px] text-slate-400 uppercase tracking-[0.2em] mt-1 sm:mt-2 font-bold">Meta de público</p>
            </motion.div>
          </div>
        </div>

        {/* Right Content: Modern Form Card */}
        <div className="w-full lg:w-1/2 relative pb-8">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="bg-white/[0.03] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8 md:mb-12">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Formulário de Interesse</h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-2">Respostas registradas em tempo real.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  <FormField label="👤 Nome completo" id="name">
                    <Input 
                      id="name" name="name" placeholder="Gustavo Santos Silva" 
                      required value={formData.name} onChange={handleChange} 
                    />
                  </FormField>

                  <FormField label="📱 Telefone/WhatsApp" id="whatsapp">
                    <Input 
                      id="whatsapp" name="whatsapp" placeholder="(00) 00000-0000" 
                      required value={formData.whatsapp} onChange={handleChange} 
                    />
                  </FormField>

                  <FormField label="🙋 Você tem interesse em participar do Acampa Central 2028?" id="interest">
                    <Select 
                      id="interest" name="interest" required 
                      value={formData.interest} onChange={handleChange}
                      options={[
                        { value: 'Sim', label: 'Sim' },
                        { value: 'Não', label: 'Não' },
                        { value: 'Talvez', label: 'Talvez' }
                      ]}
                    />
                  </FormField>

                  <FormField label="💳 Qual destes valores mensais você conseguiria se comprometer?" id="monthlyValue">
                    <Select 
                      id="monthlyValue" name="monthlyValue" required 
                      value={formData.monthlyValue} onChange={handleChange}
                      options={[
                        { value: 'R$ 50,00', label: 'R$ 50,00' },
                        { value: 'R$ 75,00', label: 'R$ 75,00' },
                        { value: 'R$ 100,00', label: 'R$ 100,00' }
                      ]}
                    />
                  </FormField>

                  <div className="space-y-4">
                    <FormField label="📆 Qual forma de pagamento você prefere?" id="paymentPreference">
                      <Select 
                        id="paymentPreference" name="paymentPreference" required 
                        value={formData.paymentPreference} onChange={handleChange}
                        options={[
                          { value: 'Parcelas mensais', label: 'Parcelas mensais' },
                          { value: 'Menos parcelas, valor maior', label: 'Menos parcelas, valor maior' },
                          { value: 'Outro', label: 'Outro (escrever abaixo)' }
                        ]}
                      />
                    </FormField>
                    {formData.paymentPreference === 'Outro' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <Input 
                          id="paymentPreferenceOther" name="paymentPreferenceOther" placeholder="Descreva sua preferência"
                          value={formData.paymentPreferenceOther} onChange={handleChange} 
                        />
                      </motion.div>
                    )}
                  </div>

                  <FormField label="✍️ Na sua opinião o que não pode faltar em um acampamento?" id="suggestions">
                    <TextArea 
                      id="suggestions" name="suggestions" placeholder="Escreva aqui sua opinião..." 
                      value={formData.suggestions} onChange={handleChange}
                    />
                  </FormField>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-[#26bba8] text-[#0A0A0B] font-black py-5 rounded-2xl transition-all uppercase tracking-[0.1em] text-[13px] shadow-[0_15px_35px_-10px_rgba(45,212,191,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        Finalizar Pesquisa
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-16 text-center backdrop-blur-xl shadow-2xl"
              >
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-10 border border-primary/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase">Enviado</h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-12 leading-relaxed max-w-xs mx-auto">
                  Sua resposta foi enviada diretamente para a planilha via macro.
                </p>
                <button
                  onClick={resetForm}
                  className="text-primary text-[11px] font-black uppercase tracking-[0.3em] hover:opacity-70 transition-opacity"
                >
                  Fazer novo registro
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="px-6 md:px-12 py-10 flex flex-col items-center justify-center text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold gap-6 relative z-10 border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] text-white font-black whitespace-nowrap">Sincronizado com Sheets</span>
        </div>
        <span>© 2026 Major. Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}
