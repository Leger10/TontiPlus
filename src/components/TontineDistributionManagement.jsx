import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';
import { Gift, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

const TontineDistributionManagement = ({ tontineId, cycleNumero, onDistributionComplete, requireSubscription, onShowSubscriptionModal }) => {
  const { user } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [nextTour, setNextTour] = useState(null);
  const [allPaid, setAllPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
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
      } else {
        setNextTour(null);
      }

      // Vérifier si tous les paiements du cycle sont effectués
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('paiements')
        .select('statut')
        .eq('tontine_id', tontineId)
        .eq('cycle_number', cycleNumero);
      
      if (paymentsError) throw paymentsError;
      
      const hasPending = paymentsData?.some(p => p.statut === 'pending' || p.statut === 'late' || p.statut === 'overdue');
      const hasPayments = paymentsData?.length > 0;
      setAllPaid(hasPayments && !hasPending);

    } catch (error) {
      console.error("Error fetching distribution data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tontineId && cycleNumero) {
      fetchData();
    }
  }, [tontineId, cycleNumero]);

  const handleConfirmDistribution = async () => {
    if (requireSubscription) {
      if (onShowSubscriptionModal) onShowSubscriptionModal();
      return;
    }

    if (!nextTour || !tontine) return;
    if (!window.confirm(`Confirmer la distribution à ${nextTour.user?.full_name || 'ce membre'} ?`)) return;

    try {
      setProcessing(true);
      const amount = tontine.montant_cotisation * (tontine.nombre_membres || 1);

      // Mettre à jour le tour comme complété
      const { error: updateError } = await supabase
        .from('tours')
        .update({
          statut: 'completed',
          montant_recu: amount,
          date_reception: new Date().toISOString()
        })
        .eq('id', nextTour.id);
      
      if (updateError) throw updateError;

      // Mettre à jour le cycle actuel de la tontine si nécessaire
      const { error: tontineError } = await supabase
        .from('tontines')
        .update({ cycle_actuel: tontine.cycle_actuel + 1 })
        .eq('id', tontineId);
      
      if (tontineError) throw tontineError;

      toast.success("Distribution confirmée ! Le cycle va être mis à jour.");
      if (onDistributionComplete) onDistributionComplete();
      setTimeout(() => fetchData(), 1500);
    } catch (error) {
      console.error("Error confirming distribution:", error);
      toast.error("Erreur lors de la confirmation de la distribution.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Skeleton className="w-full h-48 rounded-2xl shadow-premium-sm" />;

  if (!nextTour || !tontine) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          Aucun bénéficiaire en attente ou tontine terminée. 
          <br/>Les paiements du cycle doivent être complétés pour déclencher le prochain bénéficiaire.
        </CardContent>
      </Card>
    );
  }

  const amountToDistribute = tontine.montant_cotisation * (tontine.nombre_membres || 1);

  return (
    <Card className="shadow-premium-sm border-primary/20 overflow-hidden">
      <div className="h-2 w-full bg-primary"></div>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Bénéficiaire Cycle {cycleNumero}
              </p>
              <h3 className="text-2xl font-extrabold text-foreground">
                {nextTour.user?.full_name || 'Utilisateur inconnu'}
              </h3>
              <p className="text-xl font-bold text-primary mt-1">
                {amountToDistribute.toLocaleString()} CFA
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3">
            {!allPaid ? (
              <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>En attente de la totalité des paiements.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Tous les paiements ont été reçus.</span>
              </div>
            )}
            
            <Button 
              onClick={handleConfirmDistribution} 
              disabled={processing || !allPaid}
              className="w-full h-12 text-base font-bold shadow-md"
            >
              {processing ? 'Traitement...' : requireSubscription ? 'Abonnement requis' : 'Confirmer la distribution'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TontineDistributionManagement;