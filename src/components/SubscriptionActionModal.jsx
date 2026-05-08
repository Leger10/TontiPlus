import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const SubscriptionActionModal = ({ isOpen, onClose, onConfirm, actionType, subscriptionData }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isDisable = actionType === 'disable';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      onClose();
    }
  };

  if (!subscriptionData) return null;

  // Récupérer le nom de l'utilisateur depuis subscriptionData
  const getUserName = () => {
    if (subscriptionData.user?.full_name) {
      return subscriptionData.user.full_name;
    }
    if (subscriptionData.expand?.user_id?.name) {
      return subscriptionData.expand.user_id.name;
    }
    return 'Utilisateur inconnu';
  };

  const userName = getUserName();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDisable ? (
              <><AlertTriangle className="w-5 h-5 text-destructive" /> Désactiver l'abonnement</>
            ) : (
              <><CheckCircle className="w-5 h-5 text-green-500" /> Réactiver l'abonnement</>
            )}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isDisable 
              ? `Êtes-vous sûr de vouloir désactiver l'abonnement de ${userName} ? Cette action bloquera son accès aux fonctionnalités Premium.`
              : `Êtes-vous sûr de vouloir réactiver l'abonnement de ${userName} ? Il retrouvera immédiatement son accès Premium.`}
          </DialogDescription>
        </DialogHeader>

        {isDisable && (
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison de la désactivation (optionnel)</Label>
              <Textarea 
                id="reason" 
                placeholder="Ex: Non-respect des conditions d'utilisation..." 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none bg-background"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button 
            variant={isDisable ? "destructive" : "default"} 
            onClick={handleConfirm} 
            disabled={loading}
            className={!isDisable ? "bg-green-500 hover:bg-green-600 text-white" : ""}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDisable ? 'Désactiver' : 'Réactiver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionActionModal;