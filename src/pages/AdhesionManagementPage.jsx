import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';

const AdhesionManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [pendingAdhesions, setPendingAdhesions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      // Récupérer la tontine
      const { data: tData, error: tError } = await supabase
        .from('tontines')
        .select('*, organisateur:organisateur_id(full_name)')
        .eq('id', id)
        .single();
      
      if (tError) throw tError;
      
      // Vérifier si l'utilisateur est l'organisateur
      if (tData.organisateur_id !== user?.id) {
        toast.error('Accès refusé');
        return navigate('/');
      }
      setTontine(tData);
      
      // Récupérer les adhésions en attente
      const { data: aData, error: aError } = await supabase
        .from('adhesions')
        .select('*, user:user_id(full_name, email, phone)')
        .eq('tontine_id', id)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (aError) throw aError;
      setPendingAdhesions(aData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const handleAction = async (adhesionId, action) => {
    setProcessing(true);
    try {
      const newStatut = action === 'approve' ? 'validated' : 'rejected';
      
      const { error } = await supabase
        .from('adhesions')
        .update({ 
          statut: newStatut,
          date_validation: new Date().toISOString(),
          valide_par: user?.id
        })
        .eq('id', adhesionId);
      
      if (error) throw error;
      
      toast.success(`Adhésion ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);
      fetchData();
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <>
      <Helmet><title>Gestion des Adhésions - {tontine?.name || 'Tontine'}</title></Helmet>
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center">
          <BackButton className="mr-2" />
          <h1 className="text-xl font-bold text-foreground">Gestion Adhésions</h1>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Card className="shadow-premium-sm">
            <CardHeader>
              <CardTitle>Demandes en attente ({pendingAdhesions.length})</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAdhesions.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-bold">{a.nom_complet || a.user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{a.telephone || a.user?.phone}</p>
                        <p className="text-xs text-muted-foreground">{a.user?.email}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {a.identite_document_url && (
                            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                              <FileText className="w-3 h-3 mr-1"/> CNI
                            </Badge>
                          )}
                          {a.engagement_pdf_url && (
                            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                              <FileText className="w-3 h-3 mr-1"/> Engagement
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleAction(a.id, 'reject')}
                            disabled={processing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleAction(a.id, 'approve')}
                            disabled={processing}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingAdhesions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucune demande en attente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdhesionManagementPage;