import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import BackButton from '@/components/BackButton.jsx';
import { Wallet, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const MyContributionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContributions();
    }
  }, [user]);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('paiements')
        .select(`
          *,
          tontine:tontine_id(id, name, frequence, montant_cotisation),
          user:user_id(full_name, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transformer les données pour correspondre au format attendu
      const formattedData = (data || []).map(p => ({
        id: p.id,
        montant: p.montant,
        cycle_numero: p.cycle_number,
        statut: p.statut.toUpperCase(),
        date_paiement: p.date_paiement,
        created_at: p.created_at,
        expand: {
          tontine_id: {
            id: p.tontine?.id,
            nom: p.tontine?.name,
            frequence: p.tontine?.frequence,
            montant_cotisation: p.tontine?.montant_cotisation
          }
        }
      }));
      
      setContributions(formattedData);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast.error("Erreur lors du chargement des cotisations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut) => {
    const statusMap = {
      'PAID': { className: 'bg-green-500 text-white', label: 'Payé', icon: <CheckCircle2 className="w-3 h-3 mr-1"/> },
      'ADVANCE_PAID': { className: 'bg-blue-500 text-white', label: 'Payé en avance', icon: <CheckCircle2 className="w-3 h-3 mr-1"/> },
      'PENDING': { className: 'bg-yellow-500 text-white', label: 'À Payer', icon: <Clock className="w-3 h-3 mr-1"/> },
      'LATE': { className: 'bg-orange-500 text-white', label: 'En retard', icon: <AlertCircle className="w-3 h-3 mr-1"/> },
      'OVERDUE': { className: 'bg-red-500 text-white', label: 'Très en retard', icon: <AlertCircle className="w-3 h-3 mr-1"/> }
    };
    
    const status = statusMap[statut] || { className: 'bg-gray-500 text-white', label: statut, icon: null };
    return (
      <Badge className={status.className}>
        {status.icon} {status.label}
      </Badge>
    );
  };

  const renderTable = (filteredData) => (
    <Card className="shadow-premium-sm border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Tontine</TableHead>
              <TableHead className="text-center">Cycle</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map(c => {
              const isPayable = c.statut === 'PENDING' || c.statut === 'LATE';
              const tontine = c.expand?.tontine_id;
              return (
                <TableRow key={c.id} className={c.statut === 'LATE' || c.statut === 'OVERDUE' ? 'bg-red-500/5' : ''}>
                  <TableCell className="font-semibold">{tontine?.nom || 'Inconnue'}</TableCell>
                  <TableCell className="text-center">{c.cycle_numero}</TableCell>
                  <TableCell className="text-right font-bold">{c.montant?.toLocaleString()} CFA</TableCell>
                  <TableCell className="text-center">{getStatusBadge(c.statut)}</TableCell>
                  <TableCell className="text-right">
                    {isPayable ? (
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/contribution-payment/${c.id}`)}
                        className={c.statut === 'LATE' ? 'bg-destructive hover:bg-destructive/90 text-white' : ''}
                      >
                        {c.statut === 'LATE' ? 'Régulariser' : 'Payer'}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {c.date_paiement ? new Date(c.date_paiement).toLocaleDateString() : '-'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Aucune cotisation trouvée dans cette catégorie.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );

  // Filtrer les contributions par statut
  const pendingContributions = contributions.filter(c => c.statut === 'PENDING');
  const lateContributions = contributions.filter(c => c.statut === 'LATE' || c.statut === 'OVERDUE');
  const paidContributions = contributions.filter(c => c.statut === 'PAID' || c.statut === 'ADVANCE_PAID');

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 pb-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="w-full h-96 rounded-2xl shadow-premium-sm" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Mes Cotisations - BonPlan Tontine</title></Helmet>
      <div className="min-h-screen bg-muted/20 pb-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Mes Cotisations</h1>
              <p className="text-muted-foreground mt-1">Gérez vos paiements pour l'ensemble de vos tontines.</p>
            </div>
          </div>

          <Tabs defaultValue="to_pay" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6 bg-muted/50 rounded-xl p-1 h-auto">
              <TabsTrigger value="to_pay" className="py-2.5 rounded-lg">
                À Payer ({pendingContributions.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="py-2.5 rounded-lg text-destructive data-[state=active]:text-destructive">
                En Retard ({lateContributions.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="py-2.5 rounded-lg">
                Payées ({paidContributions.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="py-2.5 rounded-lg">
                Toutes ({contributions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="to_pay" className="m-0 focus-visible:outline-none">
              {renderTable(pendingContributions)}
            </TabsContent>
            <TabsContent value="overdue" className="m-0 focus-visible:outline-none">
              {renderTable(lateContributions)}
            </TabsContent>
            <TabsContent value="paid" className="m-0 focus-visible:outline-none">
              {renderTable(paidContributions)}
            </TabsContent>
            <TabsContent value="all" className="m-0 focus-visible:outline-none">
              {renderTable(contributions)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default MyContributionsPage;