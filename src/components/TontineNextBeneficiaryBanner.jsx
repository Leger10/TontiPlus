import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Calendar } from 'lucide-react';

const TontineNextBeneficiaryBanner = ({ tontineId }) => {
  const [nextTour, setNextTour] = useState(null);
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextBeneficiary = async () => {
      try {
        // Récupérer la tontine
        const { data: t, error: tError } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', tontineId)
          .single();
        
        if (tError) throw tError;
        setTontine(t);

        // Récupérer le prochain tour (pending)
        const { data: toursData, error: toursError } = await supabase
          .from('tours')
          .select(`
            *,
            user:user_id(full_name, email, phone)
          `)
          .eq('tontine_id', tontineId)
          .eq('statut', 'pending')
          .order('position', { ascending: true })
          .limit(1);
        
        if (toursError) throw toursError;
        
        if (toursData && toursData.length > 0) {
          setNextTour(toursData[0]);
        }
      } catch (error) {
        console.error("Error fetching next beneficiary:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tontineId) {
      fetchNextBeneficiary();
    }
  }, [tontineId]);

  if (loading) {
    return <Skeleton className="w-full h-32 rounded-xl" />;
  }

  if (!nextTour || !tontine) {
    return null;
  }

  const amountToDistribute = tontine.montant_cotisation * (tontine.nombre_membres || 1);

  return (
    <Card className="bg-gradient-to-r from-purple-600 to-purple-800 border-transparent shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shrink-0">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-white/20 border-white/30 text-white uppercase tracking-wider text-[10px] px-3 py-1 shadow-md">
                Prochain à prendre
              </Badge>
              <span className="text-xs font-bold text-white/90 flex items-center bg-black/20 px-2 py-1 rounded-md">
                <Calendar className="w-3 h-3 mr-2" /> Cycle {tontine.cycle_actuel || 1}
              </span>
            </div>
            <h3 className="text-3xl font-black text-white drop-shadow-md">
              {nextTour.user?.full_name || 'Utilisateur inconnu'}
            </h3>
            <p className="text-sm font-medium text-white/80 mt-1">
              En attente de la collecte complète des cotisations.
            </p>
          </div>
        </div>
        
        <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-white/20 pt-4 sm:pt-0 sm:pl-8">
          <p className="text-xs font-black text-white/80 uppercase tracking-widest mb-1 drop-shadow-sm">Montant à recevoir</p>
          <p className="text-4xl font-black text-white flex items-baseline gap-2 sm:justify-end drop-shadow-lg">
            {amountToDistribute.toLocaleString()} <span className="text-xl font-bold text-white/90">CFA</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TontineNextBeneficiaryBanner;