import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Users, Wallet, RefreshCw, CheckCircle, ShieldAlert, Crown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import StatCard from '@/components/dashboard/StatCard.jsx';
import BackButton from '@/components/BackButton.jsx';
import TontinePaymentsManagement from '@/components/TontinePaymentsManagement.jsx';
import TontineDistributionManagement from '@/components/TontineDistributionManagement.jsx';
import AdhesionValidation from '@/components/AdhesionValidation.jsx';
import SubscriptionModal from '@/components/SubscriptionModal.jsx';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck.js';
import { useFirstCycleCompletion } from '@/hooks/useFirstCycleCompletion.js';

const TontinierDashboardPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [tontine, setTontine] = useState(null);
  const [membersInfo, setMembersInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSubModal, setShowSubModal] = useState(false);

  // Subscription Management
  const { hasActiveSubscription, subscription, isExpiringSoon, loading: subLoading } = useSubscriptionCheck();
  const { isFirstCycleComplete, loading: cycleLoading } = useFirstCycleCompletion(id);

  // Auto-show modal if first cycle is complete and no subscription
  useEffect(() => {
    if (!subLoading && !cycleLoading && isFirstCycleComplete && !hasActiveSubscription && tontine?.organisateur_id === user?.id) {
      setShowSubModal(true);
    }
  }, [subLoading, cycleLoading, isFirstCycleComplete, hasActiveSubscription, tontine, user]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      
      try {
        // Récupérer la tontine
        const { data: t, error: tError } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tError) throw tError;
        
        if (t.organisateur_id !== user.id) {
          toast.error("Accès refusé.");
          return navigate('/');
        }
        setTontine(t);

        // Récupérer les adhésions actives
        const { data: adherents, error: aError } = await supabase
          .from('adhesions')
          .select(`
            id,
            nom_complet,
            telephone,
            user:user_id(full_name, email, phone)
          `)
          .eq('tontine_id', id)
          .eq('statut', 'validated');
        
        if (aError) throw aError;

        // Récupérer les tours
        const { data: tours, error: tError2 } = await supabase
          .from('tours')
          .select('*')
          .eq('tontine_id', id);
        
        if (tError2) throw tError2;

        const combined = adherents.map(adh => {
          const userTour = tours?.find(tr => tr.user_id === adh.user_id);
          return {
            id: adh.id,
            name: adh.nom_complet || adh.user?.full_name,
            phone: adh.telephone,
            tourStatut: userTour?.statut || 'N/A'
          };
        });

        setMembersInfo(combined);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Données introuvables.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id, user, navigate, refreshKey]);

  if (loading || subLoading || cycleLoading) return <div className="p-8 max-w-6xl mx-auto"><Skeleton className="h-40 w-full rounded-2xl mb-8" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!tontine) return null;

  const requiresSubscription = !hasActiveSubscription && isFirstCycleComplete;

  const getTourBadge = (statut) => {
    if (statut === 'pending') return <Badge className="bg-yellow-500 text-white border-transparent">Doit Prendre</Badge>;
    if (statut === 'completed') return <Badge className="bg-green-500 text-white border-transparent">A Pris</Badge>;
    return <Badge variant="outline">En Attente</Badge>;
  };

  return (
    <>
      <Helmet><title>Dashboard Tontinier - {tontine.name}</title></Helmet>
      <div className="min-h-screen bg-muted/20 pb-24">
        
        {/* Warning Banners */}
        {requiresSubscription && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex justify-between items-center text-red-600 z-40 relative">
            <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">Abonnement requis : Le premier cycle est terminé. Renouvelez votre abonnement pour continuer la gestion.</p>
              <Button size="sm" onClick={() => setShowSubModal(true)} className="ml-auto bg-red-600 text-white hover:bg-red-700">
                S'abonner
              </Button>
            </div>
          </div>
        )}

        {hasActiveSubscription && isExpiringSoon && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 flex justify-between items-center text-yellow-600 z-40 relative">
            <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
              <Crown className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">Votre abonnement expire bientôt (le {new Date(subscription?.expire_at).toLocaleDateString('fr-FR')}).</p>
              <Button size="sm" onClick={() => navigate('/subscription-management')} variant="outline" className="ml-auto border-yellow-500 text-yellow-600 hover:bg-yellow-500/10">
                Renouveler
              </Button>
            </div>
          </div>
        )}

        {hasActiveSubscription && !isExpiringSoon && (
           <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex justify-center text-green-600 text-xs font-bold uppercase tracking-wider">
             <span>Premium Actif</span>
           </div>
        )}

        <div className="bg-card border-b border-border px-4 py-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <BackButton className="-ml-2" />
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Gestion: {tontine.name}</h1>
              <p className="text-sm text-muted-foreground">Cycle actuel: {tontine.cycle_actuel} | Membres: {membersInfo.length}/{tontine.nombre_membres}</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Membres Inscrits" value={`${membersInfo.length} / ${tontine.nombre_membres}`} icon={Users} />
            <StatCard title="Cotisation" value={`${tontine.montant_cotisation?.toLocaleString()} CFA`} icon={Wallet} />
            <StatCard title="Cycle Actuel" value={tontine.cycle_actuel || 1} icon={RefreshCw} />
            <StatCard title="Statut" value={tontine.statut?.toUpperCase() || 'ACTIVE'} icon={CheckCircle} />
          </div>

          <Tabs defaultValue="membres" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8 bg-muted/50 rounded-xl p-1 h-auto overflow-x-auto">
              <TabsTrigger value="membres" className="py-2.5 rounded-lg">Membres</TabsTrigger>
              <TabsTrigger value="adhesions" className="py-2.5 rounded-lg">Nouvelles Adhésions</TabsTrigger>
              <TabsTrigger value="paiements" className="py-2.5 rounded-lg">Paiements (Cycle {tontine.cycle_actuel})</TabsTrigger>
              <TabsTrigger value="distributions" className="py-2.5 rounded-lg">Distribution</TabsTrigger>
            </TabsList>

            <TabsContent value="membres" className="bg-card rounded-2xl border shadow-premium-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut Tour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersInfo.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell>{getTourBadge(m.tourStatut)}</TableCell>
                    </TableRow>
                  ))}
                  {membersInfo.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucun membre actif</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="adhesions">
              <AdhesionValidation 
                tontineId={id} 
                tontine={tontine} 
                requireSubscription={requiresSubscription} 
                onShowSubscriptionModal={() => setShowSubModal(true)} 
              />
            </TabsContent>

            <TabsContent value="paiements">
              <TontinePaymentsManagement 
                tontineId={id} 
                cycleNumero={tontine.cycle_actuel} 
                requireSubscription={requiresSubscription} 
                onShowSubscriptionModal={() => setShowSubModal(true)} 
              />
            </TabsContent>

            <TabsContent value="distributions">
              <TontineDistributionManagement 
                tontineId={id} 
                cycleNumero={tontine.cycle_actuel} 
                onDistributionComplete={() => setRefreshKey(k=>k+1)} 
                requireSubscription={requiresSubscription} 
                onShowSubscriptionModal={() => setShowSubModal(true)} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)} 
        userId={user?.id}
        onSuccess={() => {
          setShowSubModal(false);
          window.location.reload();
        }}
      />
    </>
  );
};

export default TontinierDashboardPage;