import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BottomNavigation from '@/components/BottomNavigation.jsx';
import TontineCard from '@/components/TontineCard.jsx';
import { Plus, ArrowRight, Search, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

const HomePage = () => {
  const { user, profile, initialLoading, isAuthenticated } = useAuth();
  const [featuredTontines, setFeaturedTontines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTontines = async () => {
      try {
        const { data, error } = await supabase
          .from('tontines')
          .select(`
            *,
            organisateur:organisateur_id(full_name, email),
            pays:pays(name, code)
          `)
          .eq('statut', 'active')
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (error) throw error;
        setFeaturedTontines(data || []);
      } catch (error) {
        console.error('Error fetching tontines:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTontines();
  }, []);

  const getUserName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Ami';
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Accueil - BonPlan Tontine</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
        {/* Header Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 pt-10 pb-16 rounded-b-[2.5rem] border-b border-white/10 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-white drop-shadow-md">
              Bonjour, {getUserName()} 👋
            </h1>
            <p className="text-slate-300 font-medium text-lg mb-8">
              Trouvez la tontine idéale pour vos projets.
            </p>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 flex items-center border border-white/10 shadow-inner max-w-lg">
              <div className="flex-1 flex items-center px-3 border-r border-white/10">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <Input 
                  placeholder="Rechercher une tontine..." 
                  className="border-none shadow-none focus-visible:ring-0 px-0 text-white bg-transparent h-10 placeholder:text-slate-500"
                />
              </div>
              <div className="flex-1 flex items-center px-3 hidden sm:flex">
                <MapPin className="w-5 h-5 text-slate-400 mr-2" />
                <Input 
                  placeholder="Ville ou région" 
                  className="border-none shadow-none focus-visible:ring-0 px-0 text-white bg-transparent h-10 placeholder:text-slate-500"
                />
              </div>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white rounded-lg ml-2 hidden sm:flex shadow-lg shadow-emerald-500/25" asChild>
                <Link to="/tontines">Rechercher</Link>
              </Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white rounded-lg ml-2 sm:hidden p-0 w-10 h-10" size="icon" asChild>
                <Link to="/tontines"><Search className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Tontines à la une</h2>
            <Link to="/tontines" className="text-sm text-emerald-400 font-bold flex items-center hover:text-emerald-300 transition-colors">
              Voir tout <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-80 w-full rounded-xl bg-slate-800/50 border border-white/10" />
              ))}
            </div>
          ) : featuredTontines.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-white/10 backdrop-blur-sm">
              <p className="text-slate-400 font-medium">Aucune tontine disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featuredTontines.map((tontine, i) => (
                <motion.div 
                  key={tontine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <TontineCard tontine={tontine} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* FAB - Bouton flottant visible */}
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          className="fixed bottom-24 right-4 md:right-8 z-50"
        >
          <Link to="/create-tontine">
            <div className="relative">
              {/* Anneau de pulsation */}
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse opacity-50"></div>
              {/* Bouton principal */}
              <Button 
                className="relative w-14 h-14 rounded-full p-0 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300"
              >
                <Plus className="w-7 h-7 text-white" />
              </Button>
            </div>
          </Link>
        </motion.div>

        <BottomNavigation />
      </div>
    </>
  );
};

export default HomePage;