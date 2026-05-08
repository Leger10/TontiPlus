import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const ModerationAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Note: Si la table 'admin_alerts' n'existe pas, vous pouvez utiliser 'audit_logs' ou une table similaire
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('statut', 'pending')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au format attendu
        const formattedAlerts = (data || []).map(log => ({
          id: log.id,
          alert_type: log.entity_type === 'paiement' ? 'overdue_member' : 'inactive_tontine',
          resolved: log.statut === 'success',
          days_overdue: log.details?.days_overdue || 0,
          created_at: log.created_at,
          expand: {
            user_id: { name: log.details?.user_name || 'Utilisateur' },
            tontine_id: { nom: log.details?.tontine_name || 'Tontine' }
          }
        }));
        
        setAlerts(formattedAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const resolveAlert = async (id) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .update({ statut: 'resolved' })
        .eq('id', id);
      
      if (error) throw error;
      
      setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
      toast.success("Alerte marquée comme résolue");
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error("Erreur lors de la résolution");
    }
  };

  const suspendMember = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success("Membre suspendu avec succès");
    } catch (error) {
      console.error('Error suspending member:', error);
      toast.error("Erreur lors de la suspension");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Modération & Alertes - Admin</title></Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-destructive" /> Modération & Alertes
        </h1>
        <p className="text-muted-foreground mt-1">Gérez les comportements suspects et les retards critiques.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center">Chargement des alertes...</div>
        ) : alerts.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-primary mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Aucune alerte</h3>
              <p className="text-muted-foreground">Tout fonctionne normalement sur la plateforme.</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`bg-card border-border ${alert.resolved ? 'opacity-60' : 'border-l-4 border-l-destructive'}`}>
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${alert.resolved ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">
                        {alert.alert_type === 'overdue_member' ? 'Membre en retard critique' : 
                         alert.alert_type === 'inactive_tontine' ? 'Tontine inactive' : 'Comportement suspect'}
                      </h3>
                      {alert.resolved && <Badge variant="outline">Résolue</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Membre: <span className="font-medium text-foreground">{alert.expand?.user_id?.name || 'Inconnu'}</span> | 
                      Tontine: <span className="font-medium text-foreground">{alert.expand?.tontine_id?.nom || 'N/A'}</span>
                    </p>
                    {alert.days_overdue > 0 && (
                      <p className="text-destructive text-sm font-medium mt-1">En retard de {alert.days_overdue} jours</p>
                    )}
                  </div>
                </div>
                
                {!alert.resolved && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => resolveAlert(alert.id)}>Marquer Résolu</Button>
                    <Button variant="destructive" onClick={() => suspendMember(alert.expand?.user_id?.id)}>Suspendre Membre</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ModerationAlertsPage;