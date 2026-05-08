import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const MemberStatusManagementModal = ({ isOpen, onClose, member, tontineId, onStatusUpdated }) => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState(member?.statut || 'pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mapping des statuts PocketBase vers Supabase
  const statusMap = {
    'actif': 'validated',
    'en_retard': 'late',
    'a_pris': 'validated',
    'doit_prendre': 'pending',
    'en_attente': 'pending'
  };

  // Mapping inverse pour l'affichage
  const displayStatusMap = {
    'validated': 'Actif',
    'late': 'En retard',
    'pending': 'En attente',
    'rejected': 'Rejeté'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member) return;

    setIsSubmitting(true);
    try {
      // Convertir le statut sélectionné en statut Supabase
      const supabaseStatus = statusMap[status] || status;
      
      // Mettre à jour le statut de l'adhésion
      const { error: updateError } = await supabase
        .from('adhesions')
        .update({
          statut: supabaseStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);
      
      if (updateError) throw updateError;

      // Créer un log d'audit
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action: 'modified',
          entity_type: 'adhesion',
          entity_id: member.id,
          details: {
            member_name: member.nom_complet || member.user?.full_name,
            old_status: member.statut,
            new_status: supabaseStatus,
            notes: notes
          },
          statut: 'success'
        });
      
      if (auditError) console.error('Audit log error:', auditError);

      // Créer une notification pour le membre
      if (supabaseStatus === 'validated' && member.statut !== 'validated') {
        await supabase
          .from('notifications')
          .insert({
            user_id: member.user_id,
            title: 'Statut mis à jour',
            message: `Votre statut pour la tontine a été mis à jour : ${displayStatusMap[supabaseStatus] || supabaseStatus}`,
            type: 'adhesion_validated',
            send_internal: true
          });
      }

      toast.success('Statut mis à jour avec succès');
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberName = () => {
    return member?.nom_complet || member?.user?.full_name || 'ce membre';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Gérer le statut du membre</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modifiez le statut de {getMemberName()} pour cette tontine.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Nouveau Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">À JOUR (Actif)</SelectItem>
                <SelectItem value="en_retard">EN RETARD</SelectItem>
                <SelectItem value="a_pris">A PRIS</SelectItem>
                <SelectItem value="doit_prendre">DOIT PRENDRE</SelectItem>
                <SelectItem value="en_attente">EN ATTENTE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Notes / Commentaires</Label>
            <Textarea 
              placeholder="Raison du changement de statut..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] bg-background border-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MemberStatusManagementModal;