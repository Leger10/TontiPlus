import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import BackButton from '@/components/BackButton.jsx';

const TontinePaymentsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer la tontine
        const { data: t, error: tError } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tError) throw tError;
        setTontine(t);

        // Récupérer les paiements du cycle actuel
        const { data: p, error: pError } = await supabase
          .from('paiements')
          .select(`
            *,
            user:user_id(full_name, email, phone)
          `)
          .eq('tontine_id', id)
          .eq('cycle_number', t.cycle_actuel || 1)
          .order('created_at', { ascending: false });
        
        if (pError) throw pError;
        setPayments(p || []);
        
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const getBadge = (statut) => {
    const badges = {
      'paid': { className: 'bg-green-500 text-white border-transparent', label: 'Payé' },
      'advance_paid': { className: 'bg-blue-500 text-white border-transparent', label: 'Payé en avance' },
      'pending': { className: 'bg-yellow-500 text-white border-transparent', label: 'En attente' },
      'late': { className: 'bg-orange-500 text-white border-transparent', label: 'En retard' },
      'overdue': { className: 'bg-red-500 text-white border-transparent', label: 'Très en retard' }
    };
    const badge = badges[statut] || { className: 'bg-gray-500 text-white border-transparent', label: statut?.toUpperCase() || 'INCONNU' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const filteredPayments = payments.filter(p => statusFilter === 'all' || p.statut === statusFilter);

  if (loading) {
    return <div className="p-8 max-w-5xl mx-auto"><Skeleton className="w-full h-64 rounded-2xl shadow-premium-sm" /></div>;
  }

  if (!tontine) return null;

  return (
    <>
      <Helmet><title>Paiements - {tontine.name}</title></Helmet>
      <div className="min-h-screen bg-muted/20 pb-24">
        <div className="bg-card border-b border-border px-4 py-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <BackButton className="-ml-2" />
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Paiements du Cycle {tontine.cycle_actuel || 1}</h1>
              <p className="text-sm text-muted-foreground">{tontine.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="late">En retard</SelectItem>
                <SelectItem value="overdue">Très en retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-2xl border shadow-premium-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead>Date de paiement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const isMe = payment.user_id === user?.id;
                    return (
                      <TableRow key={payment.id} className={`${isMe ? 'bg-primary/5' : ''} ${payment.statut === 'late' || payment.statut === 'overdue' ? 'bg-red-500/5' : ''}`}>
                        <TableCell className="font-medium">
                          {payment.user?.full_name || 'Inconnu'}
                          {isMe && <span className="ml-2 text-xs text-primary font-bold">(Vous)</span>}
                        </TableCell>
                        <TableCell className="text-right font-bold">{payment.montant?.toLocaleString()} CFA</TableCell>
                        <TableCell className="text-center">{getBadge(payment.statut)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucun paiement trouvé pour ce cycle.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TontinePaymentsPage;