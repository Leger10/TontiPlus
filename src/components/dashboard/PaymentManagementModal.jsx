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

const PaymentManagementModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    montant: payment?.montant || '',
    date_paiement: new Date().toISOString().split('T')[0],
    methode_paiement: 'virement',
    reference_paiement: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!payment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('paiements')
        .update({
          statut: 'paid',
          date_paiement: new Date(formData.date_paiement).toISOString(),
          operateur_nom: formData.methode_paiement,
          transaction_id: formData.reference_paiement || null,
          valide_par_tontinier: true,
          date_validation_tontinier: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
      
      if (error) throw error;
      
      // Créer une notification pour le membre
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        title: 'Paiement confirmé',
        message: `Votre paiement de ${formData.montant?.toLocaleString()} FCFA a été confirmé.`,
        type: 'payment_reminder',
        send_internal: true,
        send_push: true
      });
      
      toast.success('Paiement confirmé avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Erreur lors de la confirmation du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le nom du membre
  const getMemberName = () => {
    return payment.user?.full_name || payment.expand?.user?.full_name || 'Inconnu';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmer le Paiement</DialogTitle>
        </DialogHeader>
        <div className="bg-muted/50 p-3 rounded-lg text-sm mb-2">
          <p><span className="font-semibold">Membre:</span> {getMemberName()}</p>
          <p><span className="font-semibold">Montant initial:</span> {payment.montant?.toLocaleString()} FCFA</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              <Label>Date de paiement</Label>
              <Input 
                type="date" 
                value={formData.date_paiement} 
                onChange={(e) => setFormData({...formData, date_paiement: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Méthode de paiement</Label>
            <Select value={formData.methode_paiement} onValueChange={(v) => setFormData({...formData, methode_paiement: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement Bancaire</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="moov">Moov Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Référence (Optionnel)</Label>
            <Input 
              value={formData.reference_paiement} 
              onChange={(e) => setFormData({...formData, reference_paiement: e.target.value})} 
              placeholder="Ex: TXN-12345"
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
            <Button type="submit" disabled={loading}>Confirmer le paiement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentManagementModal;