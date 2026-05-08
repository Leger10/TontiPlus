import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { ArrowLeft, Edit, Users, Settings, UserPlus, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MemberStatusManagementModal from '@/components/MemberStatusManagementModal.jsx';
import AdhesionFormModal from '@/components/AdhesionFormModal.jsx';
import SubscriptionModal from '@/components/SubscriptionModal.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useFirstCycleCompletion } from '@/hooks/useFirstCycleCompletion';

const TontineDetailPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  
  const [tontine, setTontine] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAdhered, setHasAdhered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAdhesionModalOpen, setIsAdhesionModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Subscription verification
  const { hasActiveSubscription, loading: subLoading } = useSubscriptionCheck();
  const { isFirstCycleComplete, loading: cycleLoading } = useFirstCycleCompletion(id);

  const checkAdhesionStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('adhesions')
        .select('id')
        .eq('tontine_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setHasAdhered(!!data);
    } catch (error) {
      console.error('Error checking adhesion status:', error);
      setHasAdhered(false);
    }
  }, [id, user]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch tontine
      const { data: tData, error: tError } = await supabase
        .from('tontines')
        .select('*, organisateur:organisateur_id(full_name, email)')
        .eq('id', id)
        .single();
      
      if (tError) throw tError;
      setTontine(tData);
      
      // Check if current user is organizer
      if (user && tData.organisateur_id === user.id) {
        setIsOrganizer(true);
      }
      
      // Fetch members (adhesions validated)
      const { data: mData, error: mError } = await supabase
        .from('adhesions')
        .select('*, user:user_id(full_name, email, phone)')
        .eq('tontine_id', id)
        .eq('statut', 'validated');
      
      if (mError) throw mError;
      setMembers(mData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
    checkAdhesionStatus();
  }, [fetchData, checkAdhesionStatus]);

  const getStatusBadge = (status) => {
    const map = {
      'validated': 'bg-green-500 text-white',
      'pending': 'bg-yellow-500 text-white',
      'rejected': 'bg-red-500 text-white',
      'active': 'bg-green-500 text-white'
    };
    return <Badge className={map[status] || 'bg-gray-500 text-white'}>{status?.toUpperCase() || 'INCONNU'}</Badge>;
  };

  const handleAdhesionSuccess = () => {
    setIsAdhesionModalOpen(false);
    checkAdhesionStatus();
    fetchData();
  };

  const handleOrganizerAction = (actionCallback) => {
    if (!subLoading && !cycleLoading && !hasActiveSubscription && isFirstCycleComplete) {
      setPendingAction(() => actionCallback);
      setIsSubscriptionModalOpen(true);
    } else {
      actionCallback();
    }
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  if (loading) return <div className="p-12 text-center">Chargement...</div>;
  if (!tontine) return <div className="p-12 text-center">Tontine introuvable.</div>;

  const canAdhere = 
    user && 
    tontine.organisateur_id !== user.id && 
    tontine.statut !== 'full' && 
    tontine.statut !== 'completed' && 
    !hasAdhered;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>{`Détails: ${tontine.name} - BonPlan`}</title></Helmet>
      
      <div className="mb-6">
        <Button variant="ghost" asChild className="-ml-4 text-muted-foreground hover:text-foreground">
          <Link to="/tontines"><ArrowLeft className="w-4 h-4 mr-2" /> Retour aux tontines</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tontine.name}</h1>
          <p className="text-muted-foreground mt-1">Créée par {tontine.organisateur?.full_name}</p>
        </div>
        <div className="flex gap-3">
          {canAdhere && (
            <Button 
              onClick={() => setIsAdhesionModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Adhérer
            </Button>
          )}
          {isOrganizer && (
            <>
              {!hasActiveSubscription && isFirstCycleComplete && (
                <Button 
                  variant="default"
                  className="bg-gradient-to-r from-purple-500 to-purple-700"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                >
                  <Crown className="w-4 h-4 mr-2" /> Passer PRO
                </Button>
              )}
              <Button variant="outline" onClick={() => handleOrganizerAction(() => console.log('Modifier click'))}>
                <Edit className="w-4 h-4 mr-2" /> Modifier
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Montant Cotisation</p>
            <p className="text-2xl font-black">{tontine.montant_cotisation?.toLocaleString()} CFA</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Fréquence</p>
            <p className="text-2xl font-black capitalize">{tontine.frequence || 'Mensuelle'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Membres</p>
            <p className="text-2xl font-black">{members.length} / {tontine.nombre_membres}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription warning banner for organizer */}
      {isOrganizer && !hasActiveSubscription && isFirstCycleComplete && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-purple-800 font-medium">⚠️ Premier cycle complété !</p>
            <p className="text-purple-600 text-sm">Pour continuer à gérer votre tontine et valider les prises, veuillez souscrire à un abonnement PRO.</p>
          </div>
          <Button 
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Crown className="w-4 h-4 mr-2" /> S'abonner
          </Button>
        </div>
      )}

      <Card className="bg-card border-border mb-8 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Membres de la Tontine</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Nombre de mains</TableHead>
                <TableHead>Statut</TableHead>
                {isOrganizer && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow><TableCell colSpan={isOrganizer ? 5 : 4} className="text-center py-8 text-muted-foreground">Aucun membre.</TableCell></TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-foreground">{m.nom_complet || m.user?.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.telephone || m.user?.phone || m.user?.email}</TableCell>
                    <TableCell>{m.nombre_mains || 1}</TableCell>
                    <TableCell>{getStatusBadge(m.statut)}</TableCell>
                    {isOrganizer && (
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOrganizerAction(() => {
                            setSelectedMember(m);
                            setIsStatusModalOpen(true);
                          })}
                          className="bg-background hover:bg-muted"
                          disabled={!hasActiveSubscription && isFirstCycleComplete}
                        >
                          <Settings className="w-4 h-4 mr-2 text-muted-foreground" /> Gérer
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MemberStatusManagementModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        member={selectedMember}
        tontineId={id}
        onStatusUpdated={fetchData}
      />

      <AdhesionFormModal 
        isOpen={isAdhesionModalOpen}
        onClose={() => setIsAdhesionModalOpen(false)}
        tontineId={id}
        onSuccess={handleAdhesionSuccess}
      />

      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen} 
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={handleSubscriptionSuccess}
        userId={user?.id}
      />
    </div>
  );
};

export default TontineDetailPage;