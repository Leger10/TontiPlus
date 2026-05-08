import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Crown, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';
import SubscriptionActionModal from '@/components/SubscriptionActionModal.jsx';

const AdminSubscriptionManagementPage = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'disable',
    subscription: null
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Récupérer les abonnements depuis la table subscriptions
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, user:user_id(full_name, email, phone)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubscriptions(data || []);
      
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Erreur lors du chargement des abonnements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchStatus = statusFilter === 'all' || sub.statut === statusFilter;
      const userName = (sub.user?.full_name || '').toLowerCase();
      const userEmail = (sub.user?.email || '').toLowerCase();
      
      const matchName = userName.includes(searchName.toLowerCase());
      const matchEmail = userEmail.includes(searchEmail.toLowerCase());
      
      return matchStatus && matchName && matchEmail;
    });
  }, [subscriptions, statusFilter, searchName, searchEmail]);

  const handleActionConfirm = async (reason) => {
    const { type, subscription } = modalState;
    if (!subscription) return;

    const isDisable = type === 'disable';
    const newStatus = isDisable ? 'désactivé' : 'actif';
    const actionText = isDisable ? 'Désactivé' : 'Réactivé';
    
    setProcessing(true);
    
    try {
      // 1. Mettre à jour l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          statut: newStatus,
          notes_admin: `${actionText} par l'admin le ${new Date().toLocaleString('fr-FR')}. ${reason ? `Raison: ${reason}` : ''}`,
          desactivation_raison: isDisable ? reason : null,
          last_admin_action_by: user?.id,
          last_admin_action_date: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      if (subError) throw subError;
      
      // 2. Mettre à jour le profil de l'utilisateur (is_pro)
      if (isDisable) {
        await supabase
          .from('profiles')
          .update({ is_pro: false })
          .eq('id', subscription.user_id);
      } else if (!isDisable && subscription.statut === 'désactivé') {
        // Réactivation: prolonger d'un mois
        const newExpireDate = new Date();
        const duration = subscription.type_pack === 'annuel' ? 12 : 1;
        newExpireDate.setMonth(newExpireDate.getMonth() + duration);
        
        await supabase
          .from('profiles')
          .update({ 
            is_pro: true,
            abonnement_expire_at: newExpireDate.toISOString()
          })
          .eq('id', subscription.user_id);
      }
      
      // 3. Créer une notification
      await supabase
        .from('notifications')
        .insert({
          user_id: subscription.user_id,
          title: isDisable ? 'Abonnement désactivé' : 'Abonnement réactivé',
          message: isDisable 
            ? "Votre abonnement Premium a été désactivé par l'administrateur." 
            : "Votre abonnement Premium a été réactivé.",
          type: isDisable ? 'adhesion_rejected' : 'adhesion_validated',
          send_internal: true
        });
      
      // 4. Créer un log d'audit
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action: isDisable ? 'disabled' : 'reactivated',
          entity_type: 'subscription',
          entity_id: subscription.id,
          details: {
            subscription_id: subscription.id,
            old_status: subscription.statut,
            new_status: newStatus,
            reason: reason
          },
          statut: 'success'
        });
      
      toast.success(`Abonnement ${isDisable ? 'désactivé' : 'réactivé'} avec succès.`);
      setModalState({ isOpen: false, type: 'disable', subscription: null });
      fetchSubscriptions();
      
    } catch (error) {
      console.error(`Error during subscription ${type}:`, error);
      toast.error(`Erreur lors de la ${isDisable ? 'désactivation' : 'réactivation'} de l'abonnement.`);
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (type, subscription) => {
    setModalState({ isOpen: true, type, subscription });
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'actif': return <Badge className="bg-green-500">Actif</Badge>;
      case 'expiré': return <Badge variant="destructive">Expiré</Badge>;
      case 'désactivé': return <Badge variant="outline" className="border-red-500 text-red-500">Désactivé</Badge>;
      case 'annulé': return <Badge variant="outline" className="text-gray-500">Annulé</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <>
      <Helmet><title>Gestion des Abonnements - Administration</title></Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6"><BackButton /></div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-500/10 rounded-xl">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Abonnements</h1>
            <p className="text-muted-foreground mt-1">Supervisez et gérez les abonnements Premium des utilisateurs.</p>
          </div>
        </div>

        <Card className="mb-8 border-border shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rechercher par nom</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Nom de l'utilisateur..." 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rechercher par email</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Email de l'utilisateur..." 
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrer par statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="expiré">Expiré</SelectItem>
                    <SelectItem value="désactivé">Désactivé</SelectItem>
                    <SelectItem value="annulé">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Tontinier</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Aucun abonnement trouvé correspondant à vos critères.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-bold">{sub.user?.full_name || 'Inconnu'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{sub.user?.email || 'N/A'}</TableCell>
                      <TableCell className="capitalize font-medium">{sub.type_pack}</TableCell>
                      <TableCell>{sub.prix?.toLocaleString()} CFA</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(sub.date_debut)} - {formatDate(sub.date_fin)}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.statut)}</TableCell>
                      <TableCell className="text-right">
                        {sub.statut === 'actif' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500 border-red-300 hover:bg-red-50"
                            onClick={() => openModal('disable', sub)}
                            disabled={processing}
                          >
                            <Ban className="w-4 h-4 mr-2" /> Désactiver
                          </Button>
                        )}
                        {(sub.statut === 'désactivé' || sub.statut === 'expiré') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-500 border-green-300 hover:bg-green-50"
                            onClick={() => openModal('reactivate', sub)}
                            disabled={processing}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Réactiver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <SubscriptionActionModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={handleActionConfirm}
        actionType={modalState.type}
        subscriptionData={modalState.subscription}
      />
    </>
  );
};

export default AdminSubscriptionManagementPage;