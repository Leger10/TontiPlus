import { supabase } from '../lib/supabase';

const notificationService = {
  // Créer une notification
  async createNotification(notification) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, tontine:tontine_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return true;
  },

  // Compter les notifications non lues
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count;
  },

  // Notification de rappel de paiement
  async sendPaymentReminder(paiementId, userId, tontineName) {
    return this.createNotification({
      user_id: userId,
      title: 'Rappel de paiement',
      message: `Votre paiement pour la tontine "${tontineName}" est dû. Veuillez effectuer votre cotisation.`,
      type: 'payment_reminder',
      priority: 'high',
      send_sms: true,
      send_push: true,
      send_internal: true
    });
  },

  // Notification de tour
  async sendTourNotification(userId, tontineId, cycleNumber, position) {
    return this.createNotification({
      user_id: userId,
      tontine_id: tontineId,
      title: 'C\'est votre tour !',
      message: `Félicitations ! Vous êtes le bénéficiaire du cycle ${cycleNumber} (position ${position}). Vous allez recevoir la collecte.`,
      type: 'tour_notification',
      priority: 'high',
      send_sms: true,
      send_push: true,
      send_internal: true
    });
  }
};

export default notificationService;