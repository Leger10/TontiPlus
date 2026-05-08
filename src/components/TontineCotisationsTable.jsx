import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TontineCotisationsTable = ({ tontineId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tontine, setTontine] = useState(null);

  useEffect(() => {
    const fetchMembersData = async () => {
      try {
        // Récupérer la tontine
        const { data: tontineData, error: tontineError } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', tontineId)
          .single();
        
        if (tontineError) throw tontineError;
        setTontine(tontineData);

        // Récupérer les tours avec ordre
        const { data: toursData, error: toursError } = await supabase
          .from('tours')
          .select(`
            *,
            user:user_id(full_name, email, phone)
          `)
          .eq('tontine_id', tontineId)
          .order('position', { ascending: true });
        
        if (toursError) throw toursError;

        // Récupérer les paiements pour le cycle actuel
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('paiements')
          .select('*')
          .eq('tontine_id', tontineId)
          .eq('cycle_number', tontineData.cycle_actuel || 1);
        
        if (paymentsError) throw paymentsError;

        const membersData = (toursData || []).map(tour => {
          const userPayments = (paymentsData || []).filter(p => p.user_id === tour.user_id);
          const totalPaid = userPayments.reduce((sum, p) => sum + (p.statut === 'paid' || p.statut === 'advance_paid' ? p.montant : 0), 0);
          
          // Déterminer le statut de paiement pour le cycle actuel
          let paymentStatus = 'pending';
          const hasLatePayment = userPayments.some(p => p.statut === 'late' || p.statut === 'overdue');
          if (hasLatePayment) paymentStatus = 'late';
          else if (totalPaid >= tontineData.montant_cotisation) paymentStatus = 'paid';

          return {
            id: tour.id,
            userId: tour.user_id,
            name: tour.user?.full_name || 'Inconnu',
            position: tour.position,
            tourStatut: tour.statut,
            montantCotise: totalPaid,
            paymentStatus: paymentStatus
          };
        });

        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching cotisations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tontineId) {
      fetchMembersData();
    }
  }, [tontineId]);

  const getTourBadge = (statut) => {
    const badges = {
      'pending': { className: 'bg-yellow-500 text-white', label: 'En attente' },
      'completed': { className: 'bg-green-500 text-white', label: 'Reçu' }
    };
    // Pour le "prochain à prendre", on utilise la plus petite position non complétée
    const badge = badges[statut] || { className: 'bg-yellow-500 text-white', label: 'En attente' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getPaymentBadge = (statut) => {
    const badges = {
      'paid': { className: 'bg-green-500 text-white', label: 'À jour' },
      'late': { className: 'bg-orange-500 text-white', label: 'En retard' },
      'pending': { className: 'bg-yellow-500 text-white', label: 'En attente' },
      'overdue': { className: 'bg-red-500 text-white', label: 'Très en retard' }
    };
    const badge = badges[statut] || { className: 'bg-gray-500 text-white', label: statut };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.tourStatut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <Skeleton className="w-full h-64 rounded-2xl shadow-premium-sm" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="completed">Reçu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16 text-center">Position</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Montant Cotisé</TableHead>
                <TableHead className="text-center">Statut Paiement</TableHead>
                <TableHead className="text-center">Statut Tour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-center font-bold text-muted-foreground">{member.position}</TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-right font-bold">{member.montantCotise.toLocaleString()} CFA</TableCell>
                  <TableCell className="text-center">{getPaymentBadge(member.paymentStatus)}</TableCell>
                  <TableCell className="text-center">{getTourBadge(member.tourStatut)}</TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun membre trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TontineCotisationsTable;