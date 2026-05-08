import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, DollarSign, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BeneficiaryStatus({ tontineId, tontine }) {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextBeneficiary = async () => {
      try {
        // Récupérer le prochain bénéficiaire (tour avec statut pending et position la plus basse)
        const { data, error } = await supabase
          .from('tours')
          .select(`
            *,
            user:user_id(full_name, email, phone)
          `)
          .eq('tontine_id', tontineId)
          .eq('statut', 'pending')
          .order('position', { ascending: true })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTour(data[0]);
        }
      } catch (err) {
        console.error('Error fetching next beneficiary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNextBeneficiary();
  }, [tontineId]);

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-2xl bg-[#2d2d2d]" />;
  }

  if (!tour) return null;

  const beneficiaryName = tour.user?.full_name || "Membre";

  // Calculer le montant à recevoir (basé sur la cotisation * nombre de membres)
  const amountToReceive = tontine?.montant_total_collecte || 
                          (tontine?.montant_cotisation * (tontine?.nombre_membres || 1)) || 
                          0;

  return (
    <Card className="bg-[#2d2d2d] border border-[hsl(var(--primary))]/30 shadow-premium-sm">
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center justify-center shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <Badge variant="outline" className="mb-1 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30 font-semibold uppercase tracking-wider text-[10px]">
              Prochain Bénéficiaire
            </Badge>
            <p className="text-xl font-bold text-white">{beneficiaryName}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0 gap-1">
          <div className="flex items-center text-sm font-medium text-[#b0b0b0]">
            <Clock className="w-4 h-4 mr-1.5 text-[hsl(var(--primary))]" /> 
            Cycle {tour.cycle_number}
          </div>
          <div className="flex items-center text-lg font-extrabold text-[hsl(var(--primary))]">
            <DollarSign className="w-5 h-5 mr-0.5" />
            {amountToReceive.toLocaleString()} CFA
          </div>
        </div>
      </CardContent>
    </Card>
  );
}