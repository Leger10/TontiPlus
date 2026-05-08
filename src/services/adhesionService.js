import { supabase } from '../lib/supabase';

const adhesionService = {
  // Demander une adhésion
  async requestAdhesion(tontineId, data) {
    const { data: adhesion, error } = await supabase
      .from('adhesions')
      .insert([{
        tontine_id: tontineId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...data,
        statut: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return adhesion;
  },

  // Récupérer les adhésions en attente d'une tontine
  async getPendingAdhesions(tontineId) {
    const { data, error } = await supabase
      .from('adhesions')
      .select('*, user:user_id(full_name, email, phone)')
      .eq('tontine_id', tontineId)
      .eq('statut', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Valider une adhésion
  async validateAdhesion(adhesionId) {
    const { data, error } = await supabase
      .from('adhesions')
      .update({ 
        statut: 'validated',
        date_validation: new Date().toISOString(),
        valide_par: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', adhesionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Rejeter une adhésion
  async rejectAdhesion(adhesionId, motif) {
    const { data, error } = await supabase
      .from('adhesions')
      .update({ 
        statut: 'rejected',
        motif_rejet: motif,
        date_validation: new Date().toISOString(),
        valide_par: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', adhesionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Récupérer les adhésions d'un utilisateur
  async getUserAdhesions(userId) {
    const { data, error } = await supabase
      .from('adhesions')
      .select('*, tontine:tontine_id(name, type_tontine, montant_cotisation)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Upload document CNI
  async uploadCNIDocument(adhesionId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `adhesions/${adhesionId}/cni_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cni_documents')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data, error } = await supabase
      .from('adhesions')
      .update({ photo_cni_url: fileName })
      .eq('id', adhesionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export default adhesionService;