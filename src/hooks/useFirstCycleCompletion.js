import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useFirstCycleCompletion(tontineId) {
  const [isFirstCycleComplete, setIsFirstCycleComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFirstCycleCompletion = useCallback(async () => {
    if (!tontineId) return;
    
    try {
      setLoading(true);
      
      // Vérifier si tous les paiements du premier cycle sont effectués
      // ET si le premier bénéficiaire a été validé
      const { data: firstCyclePayments, error } = await supabase
        .from('paiements')
        .select('statut')
        .eq('tontine_id', tontineId)
        .eq('cycle_number', 1);
      
      if (error) throw error;
      
      // Vérifier si tous les paiements du cycle 1 sont 'paid'
      const allPaid = firstCyclePayments?.every(p => p.statut === 'paid') && firstCyclePayments?.length > 0;
      
      // Vérifier si le premier tour a déjà été complété
      const { data: firstTour } = await supabase
        .from('tours')
        .select('statut')
        .eq('tontine_id', tontineId)
        .eq('cycle_number', 1)
        .eq('position', 1)
        .maybeSingle();
      
      // Le premier cycle est complet si tous ont payé ET le premier tour n'est pas encore complété
      setIsFirstCycleComplete(allPaid && (!firstTour || firstTour?.statut !== 'completed'));
      
    } catch (error) {
      console.error('Error checking first cycle:', error);
      setIsFirstCycleComplete(false);
    } finally {
      setLoading(false);
    }
  }, [tontineId]);

  useEffect(() => {
    checkFirstCycleCompletion();
  }, [checkFirstCycleCompletion]);

  return { isFirstCycleComplete, loading, refresh: checkFirstCycleCompletion };
}