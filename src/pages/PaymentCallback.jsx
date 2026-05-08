import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');
      
      if (status === 'success') {
        try {
          // Vérifier que l'utilisateur est devenu PRO
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_pro')
            .eq('id', user?.id)
            .single();
          
          if (profile?.is_pro) {
            setStatus('success');
            setMessage('Paiement confirmé ! Votre compte PRO est actif.');
          } else {
            setStatus('pending');
            setMessage('Paiement reçu, activation en cours...');
            
            // Rafraîchir après 5 secondes
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 5000);
          }
        } catch (error) {
          setStatus('error');
          setMessage('Erreur lors de la vérification du paiement.');
        }
      } else {
        setStatus('error');
        setMessage('Le paiement a échoué ou a été annulé.');
      }
    };
    
    verifyPayment();
  }, [searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold">Vérification du paiement...</h2>
            <p className="text-gray-600 mt-2">Veuillez patienter.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-700">Paiement confirmé !</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg"
            >
              Retour au tableau de bord
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700">Erreur</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <button 
              onClick={() => window.location.href = '/subscription'}
              className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg"
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
}