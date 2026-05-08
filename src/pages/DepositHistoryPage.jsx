import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Button } from '@/components/ui/button.jsx';
import { History, Search, FilterX } from 'lucide-react';
import BackButton from '@/components/BackButton.jsx';

const DepositHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      console.log('[DepositHistoryPage] Fetching history deposits...');
      setLoading(true);
      setError(null);
      try {
        // Fetch all deposits that are not pending
        const { data, error } = await supabase
          .from('deposits')
          .select(`
            *,
            user:user_id(full_name, email)
          `)
          .neq('statut', 'pending')
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        console.log(`[DepositHistoryPage] Found ${data?.length || 0} historical records.`);
        setHistory(data || []);
      } catch (err) {
        console.error('[DepositHistoryPage] Fetch Error:', err);
        setError("Erreur lors de la récupération de l'historique des dépôts.");
        toast.error("Données non disponibles");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(record => {
    const matchesSearch = 
      (record.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (record.amount?.toString().includes(searchTerm)) ||
      (record.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || record.statut === statusFilter;
    const matchesOperator = operatorFilter === 'all' || record.payment_method === operatorFilter;

    return matchesSearch && matchesStatus && matchesOperator;
  });

  const getStatusBadgeClass = (statut) => {
    return statut === 'validated' 
      ? 'bg-green-500 text-white border-transparent' 
      : 'bg-red-500 text-white border-transparent';
  };

  const getStatusLabel = (statut) => {
    return statut === 'validated' ? 'VALIDÉ' : 'REJETÉ';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('fr-FR');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Historique des Dépôts - Admin</title></Helmet>

      <div className="mb-6">
        <BackButton />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-primary" /> Historique des Dépôts
          </h1>
          <p className="text-muted-foreground mt-1">Consultez l'historique complet des dépôts validés et rejetés.</p>
        </div>
      </div>

      {error ? (
        <Card className="bg-destructive/10 border-destructive border-dashed p-12 text-center text-destructive">
          <p className="font-bold text-lg">{error}</p>
        </Card>
      ) : (
        <Card className="bg-card border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 bg-muted/20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher (Nom, Montant, ID)..." 
                className="pl-9 bg-background border-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-background border-input">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="validated">Validés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-background border-input">
                <SelectValue placeholder="Opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les opérateurs</SelectItem>
                <SelectItem value="Wave">Wave</SelectItem>
                <SelectItem value="Orange Money">Orange Money</SelectItem>
                <SelectItem value="Moov">Moov</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || statusFilter !== 'all' || operatorFilter !== 'all') && (
              <Button 
                variant="ghost" 
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setOperatorFilter('all'); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <FilterX className="w-4 h-4 mr-2" /> Effacer
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date de Soumission</th>
                  <th className="px-6 py-4 font-semibold">Date de Décision</th>
                  <th className="px-6 py-4 font-semibold">Utilisateur</th>
                  <th className="px-6 py-4 font-semibold">Opérateur & ID</th>
                  <th className="px-6 py-4 font-semibold">Montant</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <p className="text-lg font-medium text-foreground">Aucun enregistrement trouvé</p>
                      <p className="text-muted-foreground">Modifiez vos filtres de recherche ou l'historique est vide.</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(record => (
                    <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-foreground">{formatDate(record.created_at)}</span>
                        <div className="text-xs text-muted-foreground">{formatTime(record.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-foreground">{formatDate(record.updated_at)}</span>
                        <div className="text-xs text-muted-foreground">{formatTime(record.updated_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{record.user?.full_name || 'Inconnu'}</div>
                        <div className="text-xs text-muted-foreground">{record.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium mb-1">{record.payment_method}</div>
                        <div className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit border border-border">
                          {record.transaction_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold whitespace-nowrap text-foreground">
                        {record.amount?.toLocaleString()} FCFA
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadgeClass(record.statut)}>
                          {getStatusLabel(record.statut)}
                        </Badge>
                        {record.statut === 'rejected' && record.motif_rejet && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={record.motif_rejet}>
                            {record.motif_rejet}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DepositHistoryPage;