import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useContributionStatus = () => {
  const [loading, setLoading] = useState(false);

  const getContributionsByUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('paiements')
        .select(`
          *,
          tontine:tontine_id(id, name, montant_cotisation, cycle_actuel)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast.error('Erreur lors de la récupération des cotisations.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getOverdueCount = useCallback(async (userId) => {
    try {
      const { count, error } = await supabase
        .from('paiements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('statut', ['late', 'overdue']);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching overdue count:', error);
      return 0;
    }
  }, []);

  const payContribution = useCallback(async (paymentId, amount, walletId, tontineName) => {
    try {
      setLoading(true);
      
      // 1. Vérifier le solde du wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', walletId)
        .single();
      
      if (walletError) throw walletError;
      
      if (wallet.balance < amount) {
        throw new Error('Solde insuffisant');
      }
      
      // 2. Débiter le wallet
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('user_id', walletId);
      
      if (updateError) throw updateError;

      // 3. Enregistrer la transaction
      const { error: transError } = await supabase
        .from('transactions_wallet')
        .insert({
          user_id: walletId,
          montant: amount,
          type: 'paiement_cotisation',
          methode: 'virement',
          statut: 'completed',
          description: `Paiement cotisation pour ${tontineName}`
        });
      
      if (transError) console.error('Transaction error:', transError);

      // 4. Mettre à jour le statut du paiement
      const { error: paymentError } = await supabase
        .from('paiements')
        .update({
          statut: 'paid',
          date_paiement: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (paymentError) throw paymentError;

      // 5. Créer une notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: walletId,
          title: 'Paiement validé',
          message: `Votre paiement de ${amount.toLocaleString()} FCFA pour ${tontineName} a été validé.`,
          type: 'payment_reminder',
          send_internal: true
        });
      
      if (notifError) console.error('Notification error:', notifError);

      toast.success('Paiement effectué avec succès !');
      return true;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message === 'Solde insuffisant' 
        ? 'Solde insuffisant pour effectuer ce paiement.' 
        : 'Erreur lors du traitement du paiement.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getContributionHistory = useCallback(async (userId, filters = {}) => {
    try {
      setLoading(true);
      let query = supabase
        .from('paiements')
        .select(`
          *,
          tontine:tontine_id(id, name, montant_cotisation)
        `)
        .eq('user_id', userId);
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('statut', filters.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contribution history:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getContributionsByUser,
    getOverdueCount,
    payContribution,
    getContributionHistory
  };
};