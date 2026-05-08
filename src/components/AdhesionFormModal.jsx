import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

const AdhesionFormModal = ({ isOpen, onClose, tontineId, onSuccess }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nom_complet: profile?.full_name || '',
    telephone: profile?.phone || '',
    email: user?.email || '',
    note: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom_complet.trim() || !formData.telephone.trim() || !formData.email.trim()) {
      return toast.error('Veuillez remplir tous les champs obligatoires.');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('adhesions')
        .insert({
          tontine_id: tontineId,
          user_id: user.id,
          nom_complet: formData.nom_complet,
          telephone: formData.telephone,
          email: formData.email,
          adresse: formData.note || null,
          statut: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Créer une notification pour l'organisateur
      await supabase
        .from('notifications')
        .insert({
          user_id: tontineId, // Ceci sera l'organisateur, à adapter
          title: 'Nouvelle demande d\'adhésion',
          message: `${formData.nom_complet} souhaite adhérer à votre tontine.`,
          type: 'adhesion_pending',
          send_internal: true
        });

      toast.success('Demande d\'adhésion envoyée avec succès.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur d\'adhésion:', error);
      toast.error('Erreur lors de l\'envoi de la demande d\'adhésion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Demande d'adhésion</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire pour soumettre votre demande à l'organisateur.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="nom_complet">Nom complet <span className="text-destructive">*</span></Label>
            <Input 
              id="nom_complet"
              name="nom_complet"
              placeholder="Ex: Maya Chen"
              value={formData.nom_complet}
              onChange={handleChange}
              className="bg-background border-input text-foreground"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone <span className="text-destructive">*</span></Label>
            <Input 
              id="telephone"
              name="telephone"
              type="tel"
              placeholder="Ex: +226 70 00 00 00"
              value={formData.telephone}
              onChange={handleChange}
              className="bg-background border-input text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input 
              id="email"
              name="email"
              type="email"
              placeholder="Ex: maya@example.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-background border-input text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Message pour l'organisateur (Optionnel)</Label>
            <Textarea 
              id="note"
              name="note"
              placeholder="Précisez ici toute information utile..."
              value={formData.note}
              onChange={handleChange}
              className="bg-background border-input text-foreground resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Envoi...' : <><Send className="w-4 h-4 mr-2" /> Soumettre</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdhesionFormModal;