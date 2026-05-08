import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Crown, ArrowLeft } from 'lucide-react';

const SubscriptionPending = () => {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('waiting'); // waiting, checking, success
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Vérifier périodiquement si l'abonnement est activé
    const checkSubscriptionStatus = async () => {
      setStatus('checking');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro, abonnement_expire_at')
        .eq('id', user.id)
        .single();
      
      if (!error && data?.is_pro) {
        // Abonnement activé !
        setStatus('success');
        await fetchProfile();
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
        return;
      }
      
      // Réessayer après 5 secondes (max 12 fois = 1 minute)
      if (checkCount < 12) {
        setTimeout(() => {
          setCheckCount(prev => prev + 1);
        }, 5000);
      } else {
        setStatus('timeout');
      }
    };
    
    if (checkCount > 0 || status === 'waiting') {
      checkSubscriptionStatus();
    }
  }, [user, navigate, checkCount, status, fetchProfile]);

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">🎉 Abonnement activé !</CardTitle>
            <CardDescription>
              Votre compte est maintenant PRO. Vous allez être redirigé...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/dashboard">Accéder au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Activation en cours...</CardTitle>
          <CardDescription>
            {status === 'waiting' && 'Veuillez patienter, nous vérifions votre paiement.'}
            {status === 'checking' && 'Vérification de votre paiement...'}
            {status === 'timeout' && "L'activation prend plus de temps que prévu."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
            <p>💡 Après votre paiement sur MoneyFusion :</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-left">
              <li>Revenez sur cette page</li>
              <li>L'activation est automatique sous 2-3 minutes</li>
              <li>Si rien ne se passe, déconnectez-vous et reconnectez-vous</li>
            </ol>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/dashboard">Retour au tableau de bord</Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Vérifier maintenant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPending;