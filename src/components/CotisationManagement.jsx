import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, PlusCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CotisationManagement({ tontineId, tontine }) {
  const [adhesions, setAdhesions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('adhesions')
        .select(`
          *,
          user:user_id(full_name, email, phone)
        `)
        .eq('tontine_id', tontineId)
        .eq('statut', 'validated')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setAdhesions(data || []);
    } catch (err) {
      console.error('Error fetching adhesions:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tontineId]);

  const handleMarkOfflinePayment = async (adhesion) => {
    setProcessing(true);
    try {
      const montant = tontine.montant_cotisation || 0;
      
      // 1. Créer le paiement
      const { error: paymentError } = await supabase
        .from('paiements')
        .insert({
          user_id: adhesion.user_id,
          tontine_id: tontineId,
          montant: montant,
          cycle_number: tontine.cycle_actuel || 1,
          statut: 'paid',
          is_offline: true,
          date_paiement: new Date().toISOString(),
          valide_par_tontinier: true,
          date_validation_tontinier: new Date().toISOString()
        });
      
      if (paymentError) throw paymentError;
      
      // 2. Mettre à jour le montant cotisé dans l'adhésion
      const newMontantCotise = (adhesion.montant_cotise || 0) + montant;
      
      const { error: updateError } = await supabase
        .from('adhesions')
        .update({ montant_cotise: newMontantCotise })
        .eq('id', adhesion.id);
      
      if (updateError) throw updateError;
      
      toast.success("Paiement hors-ligne enregistré");
      fetchData();
    } catch (error) {
      console.error('Error recording offline payment:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReminder = async (adhesion) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: adhesion.user_id,
          title: 'Rappel de paiement',
          message: `Votre cotisation pour la tontine "${tontine?.name}" est due. Merci de régulariser votre situation.`,
          type: 'payment_reminder',
          priority: 'high',
          send_sms: true,
          send_push: true,
          send_internal: true,
          recipient_phone: adhesion.user?.phone,
          recipient_email: adhesion.user?.email
        });
      
      toast.success(`Rappel envoyé à ${adhesion.nom_complet || adhesion.user?.full_name}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error("Erreur lors de l'envoi du rappel");
    }
  };

  const expectedAmount = tontine.montant_cotisation || 0;
  const delaiRigueur = tontine.delai_rigueur ? new Date(tontine.delai_rigueur) : null;

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-premium-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead className="text-right">Montant Payé</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adhesions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucun membre actif.
                </TableCell>
              </TableRow>
            )}
            {adhesions.map((a) => {
              const paid = a.montant_cotise || 0;
              const isPaid = paid >= expectedAmount;
              const isLate = !isPaid && delaiRigueur && new Date() > delaiRigueur;

              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nom_complet || a.user?.full_name}</TableCell>
                  <TableCell className="text-right font-bold text-foreground">{paid.toLocaleString()} CFA</TableCell>
                  <TableCell className="text-center">
                    {isPaid ? (
                      <Badge className="bg-green-500 text-white">À jour</Badge>
                    ) : isLate ? (
                      <Badge className="bg-red-500 text-white">En retard</Badge>
                    ) : (
                      <Badge className="bg-yellow-500 text-white">En attente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!isPaid && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSendReminder(a)} 
                            className="text-yellow-500 border-yellow-500 hover:bg-yellow-500/10"
                            disabled={processing}
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleMarkOfflinePayment(a)} 
                            className="text-primary border-primary hover:bg-primary/10"
                            disabled={processing}
                          >
                            <PlusCircle className="w-4 h-4 mr-1" /> Hors-ligne
                          </Button>
                        </>
                      )}
                      {isPaid && (
                        <span className="text-green-600 flex items-center text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Réglé
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}