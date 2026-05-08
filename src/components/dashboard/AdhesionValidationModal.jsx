import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase, getFileUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DocumentViewer from './DocumentViewer.jsx';
import { FileText, Check, X } from 'lucide-react';

const AdhesionValidationModal = ({ isOpen, onClose, adhesion, onSuccess }) => {
  const { user, profile } = useAuth();
  const [reason, setReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);

  if (!adhesion) return null;

  const handleValidate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('adhesions')
        .update({
          statut: 'validated',
          date_validation: new Date().toISOString(),
          valide_par: user?.id,
          pays_id: profile?.pays_id
        })
        .eq('id', adhesion.id);
      
      if (error) throw error;
      
      // Créer une notification pour le membre
      await supabase.from('notifications').insert({
        user_id: adhesion.user_id,
        title: 'Adhésion validée',
        message: `Votre adhésion à la tontine "${adhesion.tontine?.name}" a été validée avec succès.`,
        type: 'adhesion_validated',
        send_internal: true
      });
      
      toast.success('Adhésion validée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error validating adhesion:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('adhesions')
        .update({
          statut: 'rejected',
          motif_rejet: reason,
          date_validation: new Date().toISOString(),
          valide_par: user?.id
        })
        .eq('id', adhesion.id);
      
      if (error) throw error;
      
      // Créer une notification pour le membre
      await supabase.from('notifications').insert({
        user_id: adhesion.user_id,
        title: 'Adhésion refusée',
        message: `Votre adhésion à la tontine "${adhesion.tontine?.name}" a été refusée. Raison: ${reason}`,
        type: 'adhesion_rejected',
        send_internal: true
      });
      
      toast.success('Adhésion rejetée');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error rejecting adhesion:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setLoading(false);
      setReason('');
    }
  };

  const openDoc = (fieldName, fileUrl) => {
    if (fileUrl) {
      const fullUrl = getFileUrl('adhesion_documents', fileUrl);
      setCurrentDoc({
        url: fullUrl,
        title: fieldName === 'identite_document_url' || fieldName === 'photo_cni_url' ? 'Pièce d\'identité' : 'Engagement'
      });
      setDocViewerOpen(true);
    }
  };

  // Récupérer le nom du candidat
  const getCandidateName = () => {
    return adhesion.nom_complet || adhesion.user?.full_name || 'N/A';
  };

  // Récupérer l'email du candidat
  const getCandidateEmail = () => {
    return adhesion.email || adhesion.user?.email || 'N/A';
  };

  // Récupérer le nom de la tontine
  const getTontineName = () => {
    return adhesion.tontine?.name || 'N/A';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Validation d'Adhésion</DialogTitle>
            <DialogDescription>
              Examinez les informations du candidat avant de valider ou rejeter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground">Candidat:</span>
                <p>{getCandidateName()}</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Email:</span>
                <p>{getCandidateEmail()}</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Tontine:</span>
                <p>{getTontineName()}</p>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Date demande:</span>
                <p>{new Date(adhesion.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openDoc('identite_document_url', adhesion.identite_document_url || adhesion.photo_cni_url)} 
                disabled={!adhesion.identite_document_url && !adhesion.photo_cni_url}
              >
                <FileText className="w-4 h-4 mr-2" /> Pièce d'identité
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openDoc('engagement_pdf_url', adhesion.engagement_pdf_url)} 
                disabled={!adhesion.engagement_pdf_url}
              >
                <FileText className="w-4 h-4 mr-2" /> Engagement
              </Button>
            </div>

            {isRejecting && (
              <div className="space-y-2 mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <Label className="text-red-600">Raison du rejet (visible par le candidat) *</Label>
                <Textarea 
                  placeholder="Veuillez expliquer pourquoi l'adhésion est rejetée..." 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="border-red-500/50"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {isRejecting ? (
              <>
                <Button variant="ghost" onClick={() => setIsRejecting(false)} disabled={loading}>Annuler</Button>
                <Button variant="destructive" onClick={handleReject} disabled={loading}>Confirmer le rejet</Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => setIsRejecting(true)} disabled={loading}>
                  <X className="w-4 h-4 mr-2" /> Rejeter
                </Button>
                <Button onClick={handleValidate} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white">
                  <Check className="w-4 h-4 mr-2" /> Valider l'adhésion
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentViewer 
        isOpen={docViewerOpen} 
        onClose={() => setDocViewerOpen(false)} 
        documentUrl={currentDoc?.url} 
        title={currentDoc?.title} 
      />
    </>
  );
};

export default AdhesionValidationModal;