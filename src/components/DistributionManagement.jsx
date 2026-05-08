import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import DistributionCard from './DistributionCard.jsx';
import TourManagement from './TourManagement.jsx';

export default function DistributionManagement({ tontineId, tontine }) {
  const [currentTour, setCurrentTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNextTour = async () => {
    try {
      // Récupérer le prochain tour (statut pending avec la plus petite position)
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
        setCurrentTour(data[0]);
      } else {
        setCurrentTour(null);
      }
    } catch (err) {
      console.error('Error fetching next tour:', err);
      toast.error("Erreur lors du chargement du prochain tour");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextTour();
  }, [tontineId]);

  const handleConfirmDistribution = async () => {
    if (!currentTour) return;
    setIsProcessing(true);
    try {
      // Calculer le montant à distribuer
      const montantDistribue = tontine.montant_total_collecte || 
                               (tontine.montant_cotisation * (tontine.nombre_membres || 1)) || 
                               0;

      // Mettre à jour le tour comme complété
      const { error } = await supabase
        .from('tours')
        .update({
          statut: 'completed',
          date_reception: new Date().toISOString(),
          montant_recu: montantDistribue
        })
        .eq('id', currentTour.id);
      
      if (error) throw error;
      
      // Créer une notification pour le bénéficiaire
      await supabase
        .from('notifications')
        .insert({
          user_id: currentTour.user_id,
          title: 'Distribution confirmée',
          message: `Vous avez reçu ${montantDistribue.toLocaleString()} FCFA pour le cycle ${currentTour.cycle_number}.`,
          type: 'tour_received',
          priority: 'high',
          send_sms: true,
          send_push: true,
          send_internal: true
        });
      
      toast.success("Distribution confirmée et notifiée !");
      fetchNextTour();
    } catch (err) {
      console.error('Error confirming distribution:', err);
      toast.error("Erreur lors de la confirmation");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  const hasNextTour = currentTour !== null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DistributionCard currentTour={currentTour} tontine={tontine} />
        
        <Card className="shadow-premium-sm border-border bg-card flex flex-col justify-center">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Prêt pour la distribution ?</h3>
            <p className="text-sm text-muted-foreground">Vérifiez que tous les membres ont bien cotisé avant de confirmer la distribution au bénéficiaire actuel.</p>
            
            <Button 
              className="w-full mt-4 h-12 rounded-xl text-md font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!hasNextTour || isProcessing}
              onClick={handleConfirmDistribution}
            >
              {isProcessing ? 'Confirmation...' : 'Confirmer la Distribution'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-bold mb-4 text-foreground">Ordre de passage (Cycle actuel)</h3>
        <TourManagement tontineId={tontineId} />
      </div>
    </div>
  );
}