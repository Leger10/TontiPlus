import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`
            *,
            user:user_id(full_name, email)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error("Erreur lors du chargement des logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionLabel = (action) => {
    const labels = {
      'created': 'Création',
      'modified': 'Modification',
      'deleted': 'Suppression',
      'validated': 'Validation',
      'rejected': 'Rejet',
      'disabled': 'Désactivation',
      'reactivated': 'Réactivation'
    };
    return labels[action] || action;
  };

  const getStatusBadgeClass = (statut) => {
    return statut === 'success' 
      ? 'bg-green-500 text-white border-transparent' 
      : 'bg-red-500 text-white border-transparent';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Logs d'Audit - Admin</title></Helmet>
      
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" /> Logs d'Audit
        </h1>
        <p className="text-muted-foreground mt-1">Traçabilité complète des actions administrateur.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun log trouvé.</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                    <TableCell className="font-medium">{log.user?.full_name || log.user?.email || 'Système'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details ? JSON.stringify(log.details).substring(0, 100) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(log.statut)}>
                        {log.statut === 'success' ? 'Succès' : 'Échec'}
                      </Badge>
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

export default AuditLogPage;