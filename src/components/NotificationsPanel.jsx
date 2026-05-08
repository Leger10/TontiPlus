import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NotificationsPanel = ({ onClose, onRead }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (onRead) onRead();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationTitle = (notification) => {
    return notification.title || notification.type || 'Notification';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="shadow-premium border-border">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          Notifications
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={onClose}>
            Fermer
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map(n => (
              <div key={n.id} className={`p-4 border-b last:border-0 flex gap-3 items-start ${!n.is_read ? 'bg-primary/5' : ''}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{getNotificationTitle(n)}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0" 
                    onClick={() => markAsRead(n.id)}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 border-t bg-muted/30">
        <Button variant="ghost" size="sm" className="w-full text-xs" asChild onClick={onClose}>
          <Link to="/notifications">Voir toutes les notifications</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationsPanel;