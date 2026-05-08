import React, { useState, useEffect } from 'react';
import { supabase, getFileUrl } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Check, X, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdhesionValidation({ tontineId, tontine, requireSubscription, onShowSubscriptionModal }) {
  const [adhesions, setAdhesions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchAdhesions = async () => {
    try {
      const { data, error } = await supabase
        .from('adhesions')
        .select(`
          *,
          user:user_id(full_name, email, phone)
        `)
        .eq('tontine_id', tontineId)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAdhesions(data || []);
    } catch (err) {
      console.error('Error fetching adhesions:', err);
      toast.error('Erreur lors du chargement des adhésions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdhesions();
  }, [tontineId]);

  // Obtenir l'URL du document
  const getDocumentUrl = (filePath) => {
    if (!filePath) return null;
    return getFileUrl('adhesion_documents', filePath);
  };

  const handleAction = async (adhesion, action) => {
    if (requireSubscription) {
      if (onShowSubscriptionModal) onShowSubscriptionModal();
      return;
    }

    setProcessing(true);
    try {
      if (action === 'reject') {
        const { error } = await supabase
          .from('adhesions')
          .update({ 
            statut: 'rejected',
            motif_rejet: 'Demande rejetée par l\'organisateur',
            date_validation: new Date().toISOString()
          })
          .eq('id', adhesion.id);
        
        if (error) throw error;
        
        // Créer une notification pour le membre
        await supabase.from('notifications').insert({
          user_id: adhesion.user_id,
          title: 'Adhésion rejetée',
          message: `Votre demande d'adhésion à la tontine "${tontine?.name}" a été rejetée.`,
          type: 'adhesion_rejected',
          send_internal: true
        });
        
        toast.success("Demande rejetée. L'utilisateur sera notifié.");
      } else {
        // Approuver l'adhésion
        const { error } = await supabase
          .from('adhesions')
          .update({ 
            statut: 'validated',
            date_validation: new Date().toISOString()
          })
          .eq('id', adhesion.id);
        
        if (error) throw error;
        
        // Compter le nombre de tours existants
        const { count: toursCount, error: countError } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('tontine_id', tontineId);
        
        if (countError) throw countError;
        
        // Créer un tour pour le nouveau membre
        const { error: tourError } = await supabase
          .from('tours')
          .insert({
            tontine_id: tontineId,
            user_id: adhesion.user_id,
            position: (toursCount || 0) + 1,
            cycle_number: tontine?.cycle_actuel || 1,
            statut: 'pending'
          });
        
        if (tourError) throw tourError;
        
        // Créer une notification pour le membre
        await supabase.from('notifications').insert({
          user_id: adhesion.user_id,
          title: 'Adhésion validée',
          message: `Félicitations ! Votre adhésion à la tontine "${tontine?.name}" a été validée.`,
          type: 'adhesion_validated',
          send_internal: true,
          send_push: true
        });
        
        toast.success("Membre approuvé ! Le tour a été généré.");
      }
      fetchAdhesions();
    } catch (error) {
      console.error('Error handling adhesion:', error);
      toast.error("Erreur lors de l'opération");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement des adhésions...</div>;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-premium-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adhesions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucune demande d'adhésion en attente.
                </TableCell>
              </TableRow>
            )}
            {adhesions.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-bold text-foreground">{a.nom_complet || a.user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.telephone || a.user?.phone}</p>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {a.identite_document_url && (
                      <a 
                        href={getDocumentUrl(a.identite_document_url)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-md transition-colors"
                      >
                        <FileText className="w-3 h-3 mr-1"/> ID <ExternalLink className="w-3 h-3 ml-1 opacity-50"/>
                      </a>
                    )}
                    {a.engagement_pdf_url && (
                      <a 
                        href={getDocumentUrl(a.engagement_pdf_url)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-md transition-colors"
                      >
                        <FileText className="w-3 h-3 mr-1"/> Engagement <ExternalLink className="w-3 h-3 ml-1 opacity-50"/>
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive border-destructive/30 hover:bg-destructive/10" 
                      onClick={() => handleAction(a, 'reject')}
                      disabled={processing}
                    >
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white shadow-sm" 
                      onClick={() => handleAction(a, 'approve')}
                      disabled={processing}
                    >
                      <Check className="w-4 h-4 mr-1" /> Valider
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}