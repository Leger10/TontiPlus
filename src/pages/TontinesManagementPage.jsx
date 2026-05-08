import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const TontinesManagementPage = () => {
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTontines();
  }, []);

  const fetchTontines = async () => {
    try {
      const { data, error } = await supabase
        .from('tontines')
        .select(`
          *,
          organisateur:organisateur_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTontines(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des tontines");
    } finally {
      setLoading(false);
    }
  };

  const deleteTontine = async (id, name) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la tontine "${name}" ?`)) return;
    
    try {
      const { error } = await supabase
        .from('tontines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Tontine "${name}" supprimée avec succès`);
      fetchTontines();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('tontines')
        .update({ statut: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(`Statut mis à jour`);
      fetchTontines();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredTontines = tontines.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statut) => {
    const classes = {
      active: 'bg-green-500 text-white border-transparent',
      completed: 'bg-gray-500 text-white border-transparent',
      paused: 'bg-yellow-500 text-white border-transparent',
      full: 'bg-blue-500 text-white border-transparent'
    };
    return classes[statut] || 'bg-gray-500 text-white border-transparent';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      active: 'ACTIVE',
      completed: 'TERMINÉE',
      paused: 'EN PAUSE',
      full: 'COMPLÈTE'
    };
    return labels[statut] || statut?.toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Gestion des Tontines - Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Tontines</h1>
          <p className="text-muted-foreground mt-1">Gérez toutes les tontines de la plateforme.</p>
        </div>
        <Button asChild><Link to="/create-tontine"><Plus className="w-4 h-4 mr-2" /> Créer une Tontine</Link></Button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une tontine..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-background">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Terminée</SelectItem>
              <SelectItem value="paused">En pause</SelectItem>
              <SelectItem value="full">Complète</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Créateur</TableHead>
                <TableHead>Membres</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : filteredTontines.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune tontine trouvée.</TableCell></TableRow>
              ) : (
                filteredTontines.map((tontine) => (
                  <TableRow key={tontine.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{tontine.name}</TableCell>
                    <TableCell>{tontine.organisateur?.full_name || 'Inconnu'}</TableCell>
                    <TableCell>{tontine.nombre_membres || 0}</TableCell>
                    <TableCell>{tontine.montant_cotisation?.toLocaleString()} CFA</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(tontine.statut)}>
                        {getStatusLabel(tontine.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/tontines/${tontine.id}`}><Eye className="w-4 h-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/edit-tontine/${tontine.id}`}><Edit className="w-4 h-4" /></Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteTontine(tontine.id, tontine.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TontinesManagementPage;