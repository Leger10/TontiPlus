import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const assignDGPays = async (userId, paysId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'dg_pays',
        pays_id: paysId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log action
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        action: 'modified',
        entity_type: 'profile',
        entity_id: userId,
        details: { action: 'assign_dg_pays', pays_id: paysId },
        statut: 'success'
      });
    
    return { success: true };
  } catch (error) {
    console.error('[assignDGPays] Error:', error);
    return { success: false, error: error.message };
  }
};

export const assignSecretairePays = async (userId, paysId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'pays_secretaire',
        pays_id: paysId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[assignSecretairePays] Error:', error);
    return { success: false, error: error.message };
  }
};

export const validateAdhesion = async (adhesionId) => {
  try {
    console.log(`[validateAdhesion] Validating adhesion ID: ${adhesionId}`);
    
    // Récupérer l'adhésion d'abord
    const { data: adhesion, error: fetchError } = await supabase
      .from('adhesions')
      .select('*, user:user_id(*)')
      .eq('id', adhesionId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('adhesions')
      .update({
        statut: 'validated',
        date_validation: new Date().toISOString()
      })
      .eq('id', adhesionId);
    
    if (updateError) throw updateError;
    
    console.log('[validateAdhesion] Creating notification...');
    await supabase
      .from('notifications')
      .insert({
        user_id: adhesion.user_id,
        title: 'Adhésion validée',
        message: 'Votre adhésion a été validée avec succès.',
        type: 'adhesion_validated',
        action_type: 'adhesion',
        tontine_id: adhesion.tontine_id,
        send_internal: true
      });
    
    console.log('[validateAdhesion] Notification created');
    return { success: true };
  } catch (error) {
    console.error('[validateAdhesion] Error:', error);
    return { success: false, error: error.message };
  }
};

export const rejectAdhesion = async (adhesionId, reason) => {
  try {
    // Récupérer l'adhésion
    const { data: adhesion, error: fetchError } = await supabase
      .from('adhesions')
      .select('*')
      .eq('id', adhesionId)
      .single();
    
    if (fetchError) throw fetchError;
    
    console.log('[rejectAdhesion] Creating notification...');
    await supabase
      .from('notifications')
      .insert({
        user_id: adhesion.user_id,
        title: 'Adhésion rejetée',
        message: `Votre adhésion a été rejetée. Motif: ${reason}`,
        type: 'adhesion_rejected',
        action_type: 'adhesion',
        tontine_id: adhesion.tontine_id,
        send_internal: true
      });
    
    // Supprimer l'adhésion ou mettre à jour le statut
    const { error: updateError } = await supabase
      .from('adhesions')
      .update({
        statut: 'rejected',
        motif_rejet: reason,
        date_validation: new Date().toISOString()
      })
      .eq('id', adhesionId);
    
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error('[rejectAdhesion] Error:', error);
    return { success: false, error: error.message };
  }
};

export const sendPaymentReminder = async (paiementId) => {
  try {
    // Récupérer le paiement
    const { data: paiement, error: fetchError } = await supabase
      .from('paiements')
      .select('*, tontine:tontine_id(name)')
      .eq('id', paiementId)
      .single();
    
    if (fetchError) throw fetchError;
    
    await supabase
      .from('notifications')
      .insert({
        user_id: paiement.user_id,
        title: 'Rappel de paiement',
        message: `Rappel : Vous avez un paiement en retard pour la tontine "${paiement.tontine?.name || 'votre tontine'}".`,
        type: 'payment_reminder',
        priority: 'high',
        action_type: 'rappel',
        tontine_id: paiement.tontine_id,
        send_sms: true,
        send_internal: true
      });
    
    return { success: true };
  } catch (error) {
    console.error('[sendPaymentReminder] Error:', error);
    return { success: false, error: error.message };
  }
};

export const confirmDistribution = async (tourId) => {
  try {
    const { error } = await supabase
      .from('tours')
      .update({
        statut: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', tourId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[confirmDistribution] Error:', error);
    return { success: false, error: error.message };
  }
};

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    toast.error("Aucune donnée à exporter");
    return;
  }
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(','),
    ...data.map(row => keys.map(k => `"${row[k] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};