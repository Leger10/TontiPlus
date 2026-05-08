import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const DistributionConfirmationModal = ({ isOpen, onClose, distribution, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    montant: distribution?.montant_recu || '',
    date_distribution: new Date().toISOString().split('T')[0],
    methode_distribution: 'virement',
    reference_distribution: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!distribution) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mettre à jour le tour comme complété
      const { error } = await supabase
        .from('tours')
        .update({
          statut: 'completed',
          montant_recu: parseFloat(formData.montant),
          date_reception: new Date(formData.date_distribution).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', distribution.id);
      
      if (error) throw error;
      
      // Créer une notification pour le bénéficiaire
      await supabase.from('notifications').insert({
        user_id: distribution.user_id,
        title: 'Distribution confirmée',
        message: `Vous avez reçu ${parseFloat(formData.montant).toLocaleString()} FCFA pour le cycle ${distribution.cycle_number}.`,
        type: 'tour_received',
        send_internal: true,
        send_push: true
      });
      
      toast.success('Distribution confirmée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error confirming distribution:', error);
      toast.error('Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le nom du bénéficiaire
  const getBeneficiaryName = () => {
    return distribution.user?.full_name || distribution.expand?.user?.full_name || 'Inconnu';
  };

  // Récupérer le nom de la tontine
  const getTontineName = () => {
    return distribution.tontine?.name || distribution.expand?.tontine?.name || 'N/A';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmer la Distribution</DialogTitle>
        </DialogHeader>
        <div className="bg-muted/50 p-3 rounded-lg text-sm mb-4">
          <p><span className="font-semibold">Bénéficiaire:</span> {getBeneficiaryName()}</p>
          <p><span className="font-semibold">Tontine:</span> {getTontineName()}</p>
          <p><span className="font-semibold">Cycle:</span> {distribution.cycle_number}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input 
                type="number" 
                value={formData.montant} 
                onChange={(e) => setFormData({...formData, montant: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Date de distribution</Label>
              <Input 
                type="date" 
                value={formData.date_distribution} 
                onChange={(e) => setFormData({...formData, date_distribution: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Méthode</Label>
            <Select value={formData.methode_distribution} onValueChange={(v) => setFormData({...formData, methode_distribution: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement Bancaire</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Référence</Label>
            <Input 
              value={formData.reference_distribution} 
              onChange={(e) => setFormData({...formData, reference_distribution: e.target.value})} 
              placeholder="Référence du transfert (optionnel)"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={formData.notes} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})} 
              placeholder="Notes supplémentaires (optionnel)"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>Confirmer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DistributionConfirmationModal;