import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Edit2, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const OrganizerPaymentDashboard = ({ tontineId }) => {
  const [tontine, setTontine] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Deadline Dialog State
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [deadlines, setDeadlines] = useState({ deadline1: '', deadline2: '' });
  const [savingDeadlines, setSavingDeadlines] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la tontine
      const { data: t, error: tError } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', tontineId)
        .single();
      
      if (tError) throw tError;
      setTontine(t);
      
      setDeadlines({
        deadline1: t.delai_paiement_1 ? t.delai_paiement_1.split(' ')[0] : '',
        deadline2: t.delai_paiement_2 ? t.delai_paiement_2.split(' ')[0] : ''
      });

      // Récupérer les paiements
      const { data: paymentsData, error: pError } = await supabase
        .from('paiements')
        .select(`
          *,
          user:user_id(full_name, email, phone)
        `)
        .eq('tontine_id', tontineId)
        .eq('cycle_number', t.cycle_actuel || 1)
        .order('created_at', { ascending: false });
      
      if (pError) throw pError;
      setPayments(paymentsData || []);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tontineId) {
      fetchData();
    }
  }, [tontineId]);

  const handleSaveDeadlines = async () => {
    if (!deadlines.deadline1) return toast.error("Le délai 1 est requis.");
    if (deadlines.deadline2 && new Date(deadlines.deadline2) <= new Date(deadlines.deadline1)) {
      return toast.error("Le délai 2 doit être ultérieur au délai 1.");
    }

    try {
      setSavingDeadlines(true);
      const { error } = await supabase
        .from('tontines')
        .update({
          delai_paiement_1: `${deadlines.deadline1} 23:59:59.000Z`,
          delai_paiement_2: deadlines.deadline2 ? `${deadlines.deadline2} 23:59:59.000Z` : null
        })
        .eq('id', tontineId);
      
      if (error) throw error;
      
      toast.success("Délais mis à jour avec succès.");
      setIsDeadlineModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating deadlines:", error);
      toast.error("Erreur lors de la mise à jour des délais.");
    } finally {
      setSavingDeadlines(false);
    }
  };

  const handleExport = () => {
    if (payments.length === 0) return toast.info("Rien à exporter.");
    
    const headers = ["Membre", "Montant", "Statut", "Date de Paiement", "Délai 1", "Délai 2"];
    const rows = payments.map(p => [
      p.user?.full_name || 'Inconnu',
      p.montant,
      p.statut,
      p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '-',
      tontine.delai_paiement_1 ? new Date(tontine.delai_paiement_1).toLocaleDateString('fr-FR') : '-',
      tontine.delai_paiement_2 ? new Date(tontine.delai_paiement_2).toLocaleDateString('fr-FR') : '-'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Paiements_${tontine.name?.replace(/\s/g, '_') || 'tontine'}_Cycle_${tontine.cycle_actuel}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return <Skeleton className="w-full h-96 rounded-2xl shadow-premium-sm" />;
  if (!tontine) return null;

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.statut === 'paid' || p.statut === 'advance_paid').length,
    pending: payments.filter(p => p.statut === 'pending').length,
    overdue: payments.filter(p => p.statut === 'late' || p.statut === 'overdue').length
  };

  const filteredPayments = payments.filter(p => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'paid') return p.statut === 'paid' || p.statut === 'advance_paid';
    if (statusFilter === 'pending') return p.statut === 'pending';
    if (statusFilter === 'overdue') return p.statut === 'late' || p.statut === 'overdue';
    return true;
  });

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'paid':
      case 'advance_paid':
        return <Badge className="bg-green-500 text-white">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      case 'late':
        return <Badge className="bg-orange-500 text-white">En retard</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 text-white">Très en retard</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Paiements</h2>
          <p className="text-muted-foreground text-sm">Cycle Actuel: {tontine.cycle_actuel || 1}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDeadlineModalOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" /> Gérer les délais
          </Button>
          <Button onClick={handleExport} variant="secondary">
            <Download className="w-4 h-4 mr-2" /> Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border shadow-premium-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg"><Users className="w-5 h-5 text-muted-foreground"/></div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Attendu</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-premium-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-500"/></div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Payés</p>
              <p className="text-xl font-bold">{stats.paid}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-premium-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg"><Clock className="w-5 h-5 text-yellow-500"/></div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">En attente</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-premium-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500"/></div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">En retard</p>
              <p className="text-xl font-bold text-red-500">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les membres</SelectItem>
            <SelectItem value="paid">Payés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="overdue">En retard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-premium-sm overflow-hidden border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead>Délai 1</TableHead>
                <TableHead>Délai 2 (Rigueur)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map(payment => (
                <TableRow key={payment.id} className={payment.statut === 'late' || payment.statut === 'overdue' ? 'bg-red-500/5' : ''}>
                  <TableCell className="font-medium">{payment.user?.full_name || 'Inconnu'}</TableCell>
                  <TableCell className="text-right font-bold">{payment.montant?.toLocaleString()} CFA</TableCell>
                  <TableCell className="text-center">{getStatusBadge(payment.statut)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tontine.delai_paiement_1 ? new Date(tontine.delai_paiement_1).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tontine.delai_paiement_2 ? new Date(tontine.delai_paiement_2).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun paiement trouvé pour ce filtre.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDeadlineModalOpen} onOpenChange={setIsDeadlineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer les délais de paiement</DialogTitle>
            <DialogDescription>
              Définissez les dates limites pour le cycle actuel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Délai 1 (Normal)</Label>
              <Input 
                type="date" 
                value={deadlines.deadline1} 
                onChange={(e) => setDeadlines({...deadlines, deadline1: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Délai 2 (De rigueur)</Label>
              <Input 
                type="date" 
                value={deadlines.deadline2} 
                onChange={(e) => setDeadlines({...deadlines, deadline2: e.target.value})} 
              />
              <p className="text-xs text-muted-foreground">Doit être ultérieur au Délai 1.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeadlineModalOpen(false)} disabled={savingDeadlines}>Annuler</Button>
            <Button onClick={handleSaveDeadlines} disabled={savingDeadlines}>
              {savingDeadlines ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerPaymentDashboard;