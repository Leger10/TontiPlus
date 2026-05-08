import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Crown, CheckCircle2, ShieldCheck, Zap, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const SubscriptionModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Liens MoneyFusion
  const paymentLinks = {
    monthly: 'https://my.moneyfusion.net/694df44f98fe6dbde0fbfaa8',
    yearly: 'https://my.moneyfusion.net/694df57e98fe6dbde0fbfc78'
  };

  // Stocker la demande d'abonnement en attente
  const storePendingSubscription = (planType) => {
    const pendingData = {
      userId: userId,
      planType: planType,
      timestamp: Date.now(),
      price: planType === 'yearly' ? 50000 : 5000,
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
    };
    localStorage.setItem('pending_subscription', JSON.stringify(pendingData));
  };

  // Vérifier si un paiement a été effectué (à appeler au retour sur la page)
  const checkPendingPayment = async () => {
    const pending = localStorage.getItem('pending_subscription');
    if (!pending) return false;
    
    const pendingData = JSON.parse(pending);
    
    // Vérifier si le délai est expiré (30 min)
    if (Date.now() > pendingData.expiresAt) {
      localStorage.removeItem('pending_subscription');
      return false;
    }
    
    // Vérifier si l'utilisateur est devenu PRO
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', pendingData.userId)
      .single();
    
    if (profile?.is_pro) {
      localStorage.removeItem('pending_subscription');
      toast.success('✅ Abonnement activé avec succès !');
      if (onSuccess) onSuccess();
      return true;
    }
    
    return false;
  };

  const handleSubscribe = (planType) => {
    setSelectedPlan(planType);
    setLoading(true);
    
    // Stocker la demande en attente
    storePendingSubscription(planType);
    
    // Ouvrir le lien MoneyFusion dans un nouvel onglet
    const paymentWindow = window.open(paymentLinks[planType], '_blank');
    
    // Rediriger vers une page d'attente après l'ouverture du lien
    setTimeout(() => {
      window.location.href = '/subscription-pending';
    }, 500);
    
    setLoading(false);
    onClose();
  };

  // Activation manuelle (pour test ou admin)
  const handleManualActivation = async () => {
    if (!userId) {
      toast.error('Utilisateur non identifié');
      return;
    }
    
    setLoading(true);
    try {
      // Activer l'abonnement pour 1 mois (test)
      const expireDate = new Date();
      expireDate.setMonth(expireDate.getMonth() + 1);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          abonnement_type: 'monthly',
          abonnement_started_at: new Date().toISOString(),
          abonnement_expire_at: expireDate.toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('✅ Abonnement activé manuellement (mode développement)');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-extrabold text-white">
              Passez à la version PRO
            </DialogTitle>
            <DialogDescription className="text-base mt-2 text-purple-100 max-w-lg mx-auto">
              Le premier cycle est gratuit. Pour continuer à gérer vos tontines, souscrivez à un abonnement.
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Mensuel */}
          <div className="border rounded-2xl p-6 bg-gray-50 flex flex-col hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900">Mensuel</h3>
            <div className="mt-2 mb-4">
              <span className="text-4xl font-black text-gray-900">5 000</span>
              <span className="text-sm font-medium text-gray-600"> FCFA / mois</span>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>Gestion illimitée des tontines</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>Membres illimités</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>Rappels de paiement automatisés</span>
              </li>
            </ul>

            <Button 
              variant="outline"
              className="w-full h-12 text-base font-bold border-purple-300 hover:bg-purple-50"
              onClick={() => handleSubscribe('monthly')}
              disabled={loading && selectedPlan === 'monthly'}
            >
              {loading && selectedPlan === 'monthly' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Payer 5 000 FCFA
            </Button>
          </div>

          {/* Plan Annuel */}
          <div className="border-2 border-purple-500 rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-white flex flex-col relative shadow-lg">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-purple-600 text-white text-xs font-extrabold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> Économisez 10 000 FCFA
            </div>
            <h3 className="text-xl font-bold text-purple-700">Annuel</h3>
            <div className="mt-2 mb-4">
              <span className="text-4xl font-black text-purple-700">50 000</span>
              <span className="text-sm font-medium text-gray-600"> FCFA / an</span>
              <div className="text-xs text-green-600 font-medium mt-1">+2 mois offerts</div>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <span className="font-medium">2 mois offerts</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>Tous les avantages du plan Mensuel</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>Support prioritaire</span>
              </li>
            </ul>

            <Button 
              className="w-full h-12 text-base font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-md"
              onClick={() => handleSubscribe('yearly')}
              disabled={loading && selectedPlan === 'yearly'}
            >
              {loading && selectedPlan === 'yearly' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Payer 50 000 FCFA
            </Button>
          </div>
        </div>

        <div className="bg-gray-100 px-6 py-4 border-t text-center">
          <p className="text-xs text-gray-600">
            🔒 Paiement sécurisé via MoneyFusion. Après paiement, retournez sur l'application et actualisez la page.
            L'activation peut prendre 2-3 minutes.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            💡 Une fois le paiement effectué, déconnectez-vous et reconnectez-vous pour activer vos fonctionnalités PRO.
          </p>
          {import.meta.env.DEV && (
            <button 
              onClick={handleManualActivation}
              className="text-xs text-purple-600 mt-2 underline hover:text-purple-800"
              disabled={loading}
            >
              [DEV] Activer manuellement (sans paiement)
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;