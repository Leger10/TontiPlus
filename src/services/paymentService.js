import { supabase, getFileUrl } from '../lib/supabase';

const paymentService = {
  // Enregistrer un paiement offline avec capture
  async recordOfflinePayment(data, screenshotFile) {
    let screenshotUrl = null;
    
    if (screenshotFile) {
      const fileName = `payments/${Date.now()}_${screenshotFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(fileName, screenshotFile);
      
      if (!uploadError) {
        screenshotUrl = fileName;
      }
    }
    
    const { data: payment, error } = await supabase
      .from('paiements')
      .insert([{
        ...data,
        capture_ecran_url: screenshotUrl,
        is_offline: true,
        statut: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return payment;
  },

  // Valider un paiement (par tontinier)
  async validatePayment(paymentId) {
    const { data, error } = await supabase
      .from('paiements')
      .update({ 
        statut: 'paid',
        valide_par_tontinier: true,
        date_validation_tontinier: new Date().toISOString(),
        date_paiement: new Date()
      })
      .eq('id', paymentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Récupérer les paiements d'une tontine
  async getTontinePayments(tontineId, cycleNumber = null) {
    let query = supabase
      .from('paiements')
      .select('*, user:user_id(full_name, phone), adhesion:adhesion_id(nom_complet)')
      .eq('tontine_id', tontineId);
    
    if (cycleNumber) query = query.eq('cycle_number', cycleNumber);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Ajouter les URLs des captures d'écran
    return data.map(p => ({
      ...p,
      capture_ecran_url: p.capture_ecran_url ? getFileUrl('payment_screenshots', p.capture_ecran_url) : null
    }));
  },

  // Récupérer les paiements en attente de validation
  async getPendingPayments(tontineId) {
    const { data, error } = await supabase
      .from('paiements')
      .select('*, user:user_id(full_name, phone)')
      .eq('tontine_id', tontineId)
      .eq('statut', 'pending')
      .eq('is_offline', true);
    
    if (error) throw error;
    return data;
  }
};

export default paymentService;