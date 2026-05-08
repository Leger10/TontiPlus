import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Crown, ArrowRight, History, ShieldAlert, Calendar, Clock } from 'lucide-react';
import SubscriptionModal from '@/components/SubscriptionModal.jsx';
import BackButton from '@/components/BackButton.jsx';
import { toast } from 'sonner';  // ← AJOUTER CETTE LIGNE

const SubscriptionManagementPage = () => {
  const { user, profile } = useAuth();
  const { hasActiveSubscription, subscription, isExpiringSoon, refreshSubscription, loading: subLoading } = useSubscriptionCheck();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoadingHistory(false);
        return;
      }
      
      try {
        // Récupérer l'historique depuis la table subscriptions
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data && data.length > 0) {
          setHistory(data);
        } else if (profile?.abonnement_started_at) {
          // Si pas d'historique mais profil a un abonnement
          setHistory([{
            id: 'current',
            type_pack: profile.abonnement_type === 'yearly' ? 'annuel' : 'mensuel',
            prix: profile.abonnement_type === 'yearly' ? 50000 : 5000,
            date_debut: profile.abonnement_started_at,
            date_fin: profile.abonnement_expire_at,
            statut: profile.is_pro && new Date(profile.abonnement_expire_at) > new Date() ? 'actif' : 'expiré',
            reference_paiement: 'ACTUEL'
          }]);
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Error fetching subscription history:", error);
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchHistory();
  }, [user, profile]);

  const handleCancelSubscription = async () => {
    if (!subscription || !window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement actuel ? Vous perdrez vos avantages Premium.")) return;
    
    setCancelling(true);
    
    try {
      // Mettre à jour le profil pour désactiver l'abonnement PRO
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_pro: false,
          abonnement_expire_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Ajouter une entrée dans l'historique des subscriptions
      if (subscription) {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            type_pack: subscription.type === 'yearly' ? 'annuel' : 'mensuel',
            prix: subscription.type === 'yearly' ? 50000 : 5000,
            date_debut: new Date().toISOString(),
            date_fin: subscription.expire_at,
            statut: 'annulé',
            reference_paiement: 'ANNULATION_MANUELLE'
          });
      }
      
      await refreshSubscription();
      
      // Mettre à jour l'historique local
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        type_pack: subscription.type === 'yearly' ? 'annuel' : 'mensuel',
        prix: subscription.type === 'yearly' ? 50000 : 5000,
        date_debut: new Date().toISOString(),
        date_fin: subscription.expire_at,
        statut: 'annulé',
        reference_paiement: 'ANNULATION'
      }]);
      
      toast.success('Abonnement annulé avec succès');
      
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Erreur lors de l'annulation. Veuillez réessayer.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'actif': return <Badge className="bg-green-500 text-white">Actif</Badge>;
      case 'expire':
      case 'expiré': return <Badge variant="destructive">Expiré</Badge>;
      case 'annulé':
      case 'annule': return <Badge variant="outline" className="text-gray-500">Annulé</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!subscription?.expire_at) return 0;
    const end = new Date(subscription.expire_at);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connectez-vous pour voir vos abonnements</h2>
          <Button asChild>
            <Link to="/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (subLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl mb-12" />
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Gestion de l'abonnement - BonPlan</title></Helmet>
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6"><BackButton /></div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon Abonnement</h1>
            <p className="text-gray-500 mt-1">Gérez votre statut Premium et consultez votre historique.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="lg:col-span-2 shadow-lg border-gray-200 overflow-hidden">
            <div className={`h-2 w-full ${hasActiveSubscription ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wider mb-2">Statut Actuel</h2>
                  {hasActiveSubscription ? (
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-4">
                        <span className="text-4xl font-black text-gray-900 capitalize">
                          {subscription?.type === 'yearly' ? 'Annuel' : 'Mensuel'}
                        </span>
                        {getStatusBadge('actif')}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Valide jusqu'au : <span className="font-semibold text-gray-900">{formatDate(subscription?.expire_at)}</span>
                        </p>
                        <p className="text-gray-600">
                          <Clock className="w-4 h-4 inline mr-2" />
                          Jours restants : <span className="font-semibold text-gray-900">{getDaysRemaining()} jours</span>
                        </p>
                      </div>
                      
                      {isExpiringSoon && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-yellow-700">
                            Votre abonnement expire dans moins de 7 jours. Pensez à le renouveler.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl font-black text-gray-900">Aucun abonnement actif</span>
                      </div>
                      <p className="text-gray-600">
                        Vos fonctionnalités de gestion de tontines sont limitées. Passez Premium pour débloquer toutes les options.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 min-w-[200px]">
                  {hasActiveSubscription ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300"
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Annulation...' : "Annuler l'abonnement"}
                      </Button>
                      {isExpiringSoon && (
                        <Button 
                          className="w-full bg-purple-600 text-white hover:bg-purple-700"
                          onClick={() => setIsModalOpen(true)}
                        >
                          Renouveler maintenant <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button 
                      className="w-full h-12 text-base font-bold bg-purple-600 text-white shadow-md hover:bg-purple-700"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Souscrire au Premium <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-purple-900">Avantages Premium</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-medium text-purple-800">
              <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Gestion illimitée de tontines</div>
              <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Pas de limite de membres</div>
              <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Rapports financiers complets</div>
              <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Support prioritaire 24/7</div>
              <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-purple-600" /> Export de données</div>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" /> Historique des abonnements
        </h3>
        
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHistory ? (
                  Array(3).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun historique d'abonnement trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold capitalize">{item.type_pack}</TableCell>
                      <TableCell>{item.prix?.toLocaleString()} CFA</TableCell>
                      <TableCell className="text-gray-600 text-sm">{formatDate(item.date_debut)}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{formatDate(item.date_fin)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {item.reference_paiement || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{getStatusBadge(item.statut)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <SubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refreshSubscription();
          setIsModalOpen(false);
        }}
        userId={user?.id}
      />
    </>
  );
};

export default SubscriptionManagementPage;