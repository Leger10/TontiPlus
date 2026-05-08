import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext.jsx';
import StatCard from '@/components/dashboard/StatCard.jsx';
import { Users, Building, Shield, FileCheck, AlertTriangle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import AdhesionValidationModal from '@/components/dashboard/AdhesionValidationModal.jsx';
import PaymentManagementModal from '@/components/dashboard/PaymentManagementModal.jsx';
import PaymentReminderModal from '@/components/dashboard/PaymentReminderModal.jsx';
import DistributionConfirmationModal from '@/components/dashboard/DistributionConfirmationModal.jsx';
import BackButton from '@/components/BackButton.jsx';

const DGPaysDashboard = () => {
  const { user, profile } = useAuth();
  const [adhesions, setAdhesions] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [distributions, setDistributions] = useState([]);
  
  const [selectedAdhesion, setSelectedAdhesion] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  const paysId = profile?.pays_id;

  const fetchData = async () => {
    if (!paysId) return;
    try {
      // Récupérer les adhésions en attente du pays
      const { data: adhesionsData, error: adhesionsError } = await supabase
        .from('adhesions')
        .select(`
          *,
          user:user_id(full_name, email),
          tontine:tontine_id(name)
        `)
        .eq('pays_id', paysId)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (adhesionsError) throw adhesionsError;
      setAdhesions(adhesionsData || []);

      // Récupérer les paiements en retard ou en attente
      const { data: paiementsData, error: paiementsError } = await supabase
        .from('paiements')
        .select(`
          *,
          user:user_id(full_name, email),
          tontine:tontine_id(name)
        `)
        .eq('pays_id', paysId)
        .in('statut', ['pending', 'late', 'overdue'])
        .order('created_at', { ascending: false });
      
      if (paiementsError) throw paiementsError;
      setPaiements(paiementsData || []);

      // Récupérer les tours en attente
      const { data: distributionsData, error: distributionsError } = await supabase
        .from('tours')
        .select(`
          *,
          user:user_id(full_name, email),
          tontine:tontine_id(name)
        `)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (distributionsError) throw distributionsError;
      setDistributions(distributionsData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur de chargement des données");
    }
  };

  useEffect(() => {
    fetchData();
  }, [paysId]);

  const getStatusBadgeClass = (statut) => {
    const badges = {
      'pending': 'bg-yellow-500 text-white',
      'late': 'bg-orange-500 text-white',
      'overdue': 'bg-red-500 text-white'
    };
    return badges[statut] || 'bg-gray-500 text-white';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'pending': 'EN ATTENTE',
      'late': 'EN RETARD',
      'overdue': 'TRÈS EN RETARD'
    };
    return labels[statut] || statut?.toUpperCase();
  };

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Direction Générale Pays</h1>
        <p className="text-muted-foreground mb-8">Statistiques et gestion pour votre zone d'affectation.</p>

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
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="rounded-tl-lg">Candidat</TableHead>
                      <TableHead>Tontine</TableHead>
                      <TableHead className="text-right rounded-tr-lg">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adhesions.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.user?.full_name || 'Inconnu'}</TableCell>
                        <TableCell>{a.tontine?.name}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedAdhesion(a)}>Examiner</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {adhesions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Aucune adhésion en attente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paiements">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
              <h2 className="text-xl font-bold mb-4">Suivi des Paiements</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="rounded-tl-lg">Membre</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right rounded-tr-lg">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paiements.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.user?.full_name || 'Inconnu'}</TableCell>
                        <TableCell>{p.montant?.toLocaleString()} CFA</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(p.statut)}>{getStatusLabel(p.statut)}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedReminder(p)}>Rappel</Button>
                          <Button size="sm" onClick={() => setSelectedPayment(p)}>Valider</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paiements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Aucun paiement en retard
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distributions">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
              <h2 className="text-xl font-bold mb-4">Distributions à confirmer</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="rounded-tl-lg">Bénéficiaire</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead className="text-right rounded-tr-lg">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.user?.full_name || 'Inconnu'}</TableCell>
                        <TableCell>{d.montant_recu?.toLocaleString() || '-'} CFA</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedDistribution(d)}>Confirmer</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {distributions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Aucune distribution en attente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vue-globale" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

export default DGPaysDashboard;