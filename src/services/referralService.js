import { supabase } from '../lib/supabase';
import walletService from './walletService';

const referralService = {
  // Enregistrer un parrainage
  async registerReferral(parrainId, filleulId) {
    const { data, error } = await supabase
      .from('parrainages')
      .insert([{
        parrain_id: parrainId,
        filleul_id: filleulId,
        commission: 10
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Créditer la commission au parrain
    await walletService.creditWallet(parrainId, 10, 'commission', `Parrainage ${filleulId}`);
    
    return data;
  },

  // Récupérer les filleuls d'un parrain
  async getReferrals(parrainId) {
    const { data, error } = await supabase
      .from('parrainages')
      .select('*, filleul:filleul_id(full_name, email, phone, created_at)')
      .eq('parrain_id', parrainId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les commissions gagnées
  async getCommissions(parrainId) {
    const { data, error } = await supabase
      .from('parrainages')
      .select('commission, statut, created_at')
      .eq('parrain_id', parrainId)
      .eq('statut', 'active');
    
    if (error) throw error;
    
    const total = data.reduce((sum, p) => sum + p.commission, 0);
    return { total, details: data };
  },

  // Vérifier si un utilisateur a été parrainé
  async getParrain(userId) {
    const { data, error } = await supabase
      .from('parrainages')
      .select('parrain:parrain_id(full_name, email, phone)')
      .eq('filleul_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data?.parrain || null;
  }
};

export default referralService;