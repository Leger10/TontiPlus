import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Bell } from 'lucide-react';

const PaymentReminderModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!payment) return null;

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      // Mettre à jour le statut du paiement
      const { error } = await supabase
        .from('paiements')
        .update({
          statut: 'late',
          date_rappel: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
      
      if (error) throw error;
      
      // Créer une notification pour le membre
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        title: 'Rappel de paiement',
        message: `Votre paiement de ${payment.montant?.toLocaleString()} FCFA est en retard. Veuillez effectuer le paiement dès que possible.`,
        type: 'payment_reminder',
        priority: 'high',
        send_sms: true,
        send_push: true,
        send_internal: true
      });
      
      toast.success('Rappel envoyé avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Erreur lors de l\'envoi du rappel');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le nom du membre
  const getMemberName = () => {
    return payment.user?.full_name || payment.expand?.user?.full_name || 'ce membre';
  };

  // Récupérer le montant
  const getAmount = () => {
    return payment.montant?.toLocaleString() || '??';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" /> Envoyer un rappel
          </DialogTitle>
          <DialogDescription>
            Voulez-vous envoyer un rappel de paiement à {getMemberName()} pour un montant de {getAmount()} FCFA ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={handleSendReminder} disabled={loading} className="bg-yellow-500 text-white hover:bg-yellow-600">
            Envoyer le rappel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReminderModal;