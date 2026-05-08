import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const TontinePaymentsManagement = ({ tontineId, cycleNumero, requireSubscription, onShowSubscriptionModal }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('paiements')
        .select(`
          *,
          user:user_id(full_name, email, phone)
        `)
        .eq('tontine_id', tontineId)
        .eq('cycle_number', cycleNumero)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erreur lors du chargement des paiements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tontineId && cycleNumero) {
      fetchPayments();
    }
  }, [tontineId, cycleNumero]);

  const handleMarkAsPaid = async (paymentId) => {
    if (requireSubscription) {
      if (onShowSubscriptionModal) onShowSubscriptionModal();
      return;
    }

    try {
      setProcessingId(paymentId);
      
      const { error } = await supabase
        .from('paiements')
        .update({
          statut: 'paid',
          date_paiement: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      toast.success("Paiement validé avec succès.");
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Erreur lors de la validation du paiement.");
    } finally {
      setProcessingId(null);
    }
  };

  const getBadge = (statut) => {
    const badges = {
      'paid': { className: 'bg-green-500 text-white border-transparent', label: 'Payé' },
      'advance_paid': { className: 'bg-blue-500 text-white border-transparent', label: 'Payé en avance' },
      'pending': { className: 'bg-yellow-500 text-white border-transparent', label: 'En attente' },
      'late': { className: 'bg-orange-500 text-white border-transparent', label: 'En retard' },
      'overdue': { className: 'bg-red-500 text-white border-transparent', label: 'Très en retard' }
    };
    const badge = badges[statut] || { className: 'bg-gray-500 text-white border-transparent', label: statut };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const filteredPayments = payments.filter(p => statusFilter === 'all' || p.statut === statusFilter);

  if (loading) return <Skeleton className="w-full h-64 rounded-2xl shadow-premium-sm" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Paiements - Cycle {cycleNumero}</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="late">En retard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead>Date de paiement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun paiement trouvé.
                  </TableCell>
                </TableRow>
              )}
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className={payment.statut === 'late' || payment.statut === 'overdue' ? 'bg-red-500/5' : ''}>
                  <TableCell className="font-medium">{payment.user?.full_name || 'Inconnu'}</TableCell>
                  <TableCell className="text-right font-bold">{payment.montant?.toLocaleString()} CFA</TableCell>
                  <TableCell className="text-center">{getBadge(payment.statut)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {(payment.statut === 'pending' || payment.statut === 'late' || payment.statut === 'overdue') && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkAsPaid(payment.id)}
                        disabled={processingId === payment.id}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Marquer payé
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TontinePaymentsManagement;