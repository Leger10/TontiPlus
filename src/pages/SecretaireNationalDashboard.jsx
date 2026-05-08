import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileCheck, AlertTriangle, Wallet, Eye, CheckCircle, Bell } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import AdhesionValidationModal from '@/components/dashboard/AdhesionValidationModal.jsx';
import PaymentManagementModal from '@/components/dashboard/PaymentManagementModal.jsx';
import PaymentReminderModal from '@/components/dashboard/PaymentReminderModal.jsx';
import DistributionConfirmationModal from '@/components/dashboard/DistributionConfirmationModal.jsx';
import BackButton from '@/components/BackButton.jsx';

const SecretaireNationalDashboard = () => {
  const [adhesions, setAdhesions] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [distributions, setDistributions] = useState([]);
  
  const [selectedAdhesion, setSelectedAdhesion] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les adhésions en attente
      const { data: adhesionsData, error: adhesionsError } = await supabase
        .from('adhesions')
        .select(`
          *,
          user:user_id(full_name, email, phone),
          tontine:tontine_id(name)
        `)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (adhesionsError) throw adhesionsError;

      // Récupérer les paiements en retard ou en attente
      const { data: paiementsData, error: paiementsError } = await supabase
        .from('paiements')
        .select(`
          *,
          user:user_id(full_name, email, phone),
          tontine:tontine_id(name)
        `)
        .in('statut', ['pending', 'late', 'overdue'])
        .order('created_at', { ascending: false });
      
      if (paiementsError) throw paiementsError;

      // Récupérer les tours en attente (distributions)
      const { data: distributionsData, error: distributionsError } = await supabase
        .from('tours')
        .select(`
          *,
          user:user_id(full_name, email, phone),
          tontine:tontine_id(name)
        `)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (distributionsError) throw distributionsError;
      
      setAdhesions(adhesionsData || []);
      setPaiements(paiementsData || []);
      setDistributions(distributionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadgeClass = (statut) => {
    if (statut === 'late' || statut === 'overdue') {
      return 'bg-red-500 text-white';
    }
    return 'bg-yellow-500 text-white';
  };

  const getStatusLabel = (statut) => {
    if (statut === 'late') return 'EN RETARD';
    if (statut === 'overdue') return 'TRÈS EN RETARD';
    return 'EN ATTENTE';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-8">Tableau de Bord - Secrétaire National</h1>

        <Tabs defaultValue="adhesions" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8 bg-muted/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="adhesions" className="py-2">Adhésions en Attente</TabsTrigger>
            <TabsTrigger value="paiements" className="py-2">Paiements en Retard</TabsTrigger>
            <TabsTrigger value="distributions" className="py-2">Distributions en Attente</TabsTrigger>
            <TabsTrigger value="vue-globale" className="py-2">Vue Globale</TabsTrigger>
          </TabsList>

          <TabsContent value="adhesions">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
              <h2 className="text-xl font-bold mb-4">Adhésions à valider</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Candidat</th>
                      <th className="px-4 py-3">Tontine</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adhesions.map(a => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{a.user?.full_name || a.nom_complet || 'Inconnu'}</td>
                        <td className="px-4 py-3">{a.tontine?.name}</td>
                        <td className="px-4 py-3">{formatDate(a.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" onClick={() => setSelectedAdhesion(a)}>Examiner</Button>
                        </td>
                      </tr>
                    ))}
                    {adhesions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-muted-foreground">
                          Aucune adhésion en attente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paiements">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
              <h2 className="text-xl font-bold mb-4">Suivi des Paiements</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Membre</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{p.user?.full_name || 'Inconnu'}</td>
                        <td className="px-4 py-3">{p.montant?.toLocaleString()} CFA</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusBadgeClass(p.statut)}>
                            {getStatusLabel(p.statut)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedReminder(p)}>
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => setSelectedPayment(p)}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Payer
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paiements.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-muted-foreground">
                          Aucun paiement en retard
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distributions">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
              <h2 className="text-xl font-bold mb-4">Distributions à confirmer</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Bénéficiaire</th>
                      <th className="px-4 py-3">Tontine</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map(d => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{d.user?.full_name || 'Inconnu'}</td>
                        <td className="px-4 py-3">{d.tontine?.name}</td>
                        <td className="px-4 py-3">{d.montant_recu?.toLocaleString() || '-'} CFA</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" onClick={() => setSelectedDistribution(d)}>Confirmer</Button>
                        </td>
                      </tr>
                    ))}
                    {distributions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-muted-foreground">
                          Aucune distribution en attente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vue-globale">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Adhésions en attente" value={adhesions.length} icon={FileCheck} />
              <StatCard title="Paiements en retard" value={paiements.length} icon={AlertTriangle} />
              <StatCard title="Distributions en attente" value={distributions.length} icon={Wallet} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AdhesionValidationModal isOpen={!!selectedAdhesion} onClose={() => setSelectedAdhesion(null)} adhesion={selectedAdhesion} onSuccess={fetchData} />
      <PaymentManagementModal isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} payment={selectedPayment} onSuccess={fetchData} />
      <PaymentReminderModal isOpen={!!selectedReminder} onClose={() => setSelectedReminder(null)} payment={selectedReminder} onSuccess={fetchData} />
      <DistributionConfirmationModal isOpen={!!selectedDistribution} onClose={() => setSelectedDistribution(null)} distribution={selectedDistribution} onSuccess={fetchData} />
    </div>
  );
};

export default SecretaireNationalDashboard;