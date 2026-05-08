import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import BackButton from '@/components/BackButton.jsx';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error("Erreur de chargement des notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) {
        toast.info("Aucune notification non lue");
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      toast.success(`${unreadIds.length} notification(s) marquée(s) comme lue(s)`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteAll = async () => {
    if (!window.confirm("Supprimer toutes les notifications ?")) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success("Toutes les notifications ont été supprimées");
      setNotifications([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Notification supprimée");
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'payment_due': 'Paiement dû',
      'payment_reminder': 'Rappel de paiement',
      'payment_late': 'Paiement en retard',
      'payment_overdue': 'Paiement très en retard',
      'tour_notification': 'Tour de bénéficiaire',
      'tour_reminder': 'Rappel de tour',
      'tour_received': 'Fonds reçus',
      'adhesion_pending': 'Adhésion en attente',
      'adhesion_validated': 'Adhésion validée',
      'adhesion_rejected': 'Adhésion rejetée',
      'cycle_start': 'Début de cycle',
      'cycle_complete': 'Cycle terminé',
      'tontine_full': 'Tontine complète',
      'commission_earned': 'Commission reçue'
    };
    return labels[type] || type || 'Notification';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet><title>Notifications - BonPlan Tontine</title></Helmet>
      <div className="min-h-screen bg-muted/20 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="w-8 h-8 text-primary" /> Notifications
              </h1>
              <p className="text-muted-foreground mt-1">Gérez vos alertes et messages.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={loading || notifications.length === 0}>
                <Check className="w-4 h-4 mr-2" /> Tout lire
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteAll} disabled={loading || notifications.length === 0}>
                <Trash2 className="w-4 h-4 mr-2" /> Tout supprimer
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-premium-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center text-muted-foreground">
                <BellOff className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Vous n'avez aucune notification</p>
                <p className="text-sm mt-1">Les notifications apparaîtront ici</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-6 flex gap-4 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {getTypeLabel(n.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{n.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      {n.tontine_id && (
                        <button 
                          className="text-xs text-primary hover:underline mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/tontine/${n.tontine_id}`;
                          }}
                        >
                          Voir la tontine →
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!n.is_read && (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;