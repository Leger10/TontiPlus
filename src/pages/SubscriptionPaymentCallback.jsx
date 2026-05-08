import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { CheckCircle2, Loader2, AlertCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';

const SubscriptionPaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const processPayment = async () => {
      if (!user) {
        // Attendre que l'utilisateur soit connecté
        setTimeout(() => {
          if (!user && retryCount < 3) {
            setRetryCount(prev => prev + 1);
          } else if (!user) {
            setStatus('error');
            setErrorMessage("Veuillez vous connecter pour activer votre abonnement.");
          }
        }, 1000);
        return;
      }

      const typePack = searchParams.get('type') || searchParams.get('plan') || 'monthly';
      const reference = searchParams.get('ref') || searchParams.get('transaction_id') || `PAY-${Date.now()}`;
      const statusParam = searchParams.get('status');
      
      // Si le paiement a été annulé
      if (statusParam === 'cancel' || statusParam === 'failed') {
        setStatus('error');
        setErrorMessage("Le paiement a été annulé. Vous pouvez réessayer quand vous voulez.");
        return;
      }

      try {
        // Vérifier si l'utilisateur est déjà PRO
        const { data: currentProfile, error: checkError } = await supabase
          .from('profiles')
          .select('is_pro, abonnement_expire_at')
          .eq('id', user.id)
          .single();
        
        if (checkError) throw checkError;
        
        // Si déjà PRO et l'abonnement est encore valide
        if (currentProfile?.is_pro && new Date(currentProfile.abonnement_expire_at) > new Date()) {
          setStatus('success');
          toast.success("Votre abonnement est déjà actif !");
          setTimeout(() => navigate('/subscription-management'), 2000);
          return;
        }
        
        // Déterminer la durée en mois
        let durationMonths = 1;
        let price = 5000;
        let type = 'monthly';
        
        if (typePack === 'yearly' || typePack === 'annuel') {
          durationMonths = 12;
          price = 50000;
          type = 'yearly';
        }
        
        // Calculer la date d'expiration
        const now = new Date();
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + durationMonths);
        
        // Appeler la fonction RPC pour activer l'abonnement
        const { data: activationData, error: activationError } = await supabase.rpc(
          'activate_subscription',
          {
            p_user_id: user.id,
            p_type: type,
            p_duration_months: durationMonths
          }
        );
        
        if (activationError) throw activationError;
        
        // Mettre à jour également la table d'historique si elle existe
        // Note: Créez une table 'subscriptions' si vous voulez garder l'historique
        try {
          await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              type: type,
              price: price,
              start_date: now.toISOString(),
              end_date: expireDate.toISOString(),
              status: 'active',
              reference: reference,
              payment_method: 'moneyfusion'
            });
        } catch (historyError) {
          // Table d'historique n'existe pas encore, ignorer
          console.log("Historique non sauvegardé (table subscriptions inexistante)");
        }
        
        setStatus('success');
        toast.success("Abonnement activé avec succès !");
        
        setTimeout(() => {
          navigate('/subscription-success');
        }, 2000);
        
      } catch (error) {
        console.error("Callback error:", error);
        setStatus('error');
        setErrorMessage(error.message || "Une erreur est survenue lors de l'activation de votre abonnement. Veuillez contacter le support.");
      }
    };

    processPayment();
  }, [user, searchParams, navigate, retryCount]);

  // Si l'utilisateur n'est pas connecté, afficher un message
  if (!user && status === 'processing') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-gray-200 text-center overflow-hidden">
          <div className="h-2 w-full bg-purple-600"></div>
          <CardContent className="p-8 sm:p-12">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion requise</h2>
            <p className="text-gray-600 mb-6">Veuillez vous connecter pour activer votre abonnement.</p>
            <Button asChild className="w-full bg-purple-600 text-white hover:bg-purple-700">
              <Link to="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Validation du paiement - BonPlan</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-white">
        <Card className="w-full max-w-md shadow-xl border-gray-200 text-center overflow-hidden">
          <div className={`h-2 w-full ${
            status === 'success' ? 'bg-green-500' : 
            status === 'error' ? 'bg-red-500' : 'bg-purple-600'
          }`}></div>
          <CardContent className="p-8 sm:p-12">
            
            {status === 'processing' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérification en cours</h2>
                <p className="text-gray-500">Veuillez patienter pendant que nous confirmons votre paiement...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement Réussi !</h2>
                <p className="text-gray-600 mb-4">Votre abonnement Premium est maintenant actif.</p>
                <div className="bg-purple-50 rounded-lg p-3 mb-6">
                  <Crown className="w-5 h-5 text-purple-600 inline mr-2" />
                  <span className="text-purple-700 font-medium">Vous avez accès à toutes les fonctionnalités PRO</span>
                </div>
                <p className="text-sm text-gray-400 animate-pulse">Redirection vers votre espace...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Échec de la validation</h2>
                <p className="text-gray-600 mb-8">{errorMessage}</p>
                <div className="flex flex-col gap-3 w-full">
                  <Button asChild className="w-full bg-purple-600 text-white hover:bg-purple-700">
                    <Link to="/subscription-management">Retourner à la gestion</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/support">Contacter le support</Link>
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SubscriptionPaymentCallback;