// src/hooks/useSubscriptionCheck.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useSubscriptionCheck() {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Utiliser le profil directement
      if (profile) {
        const isPro = profile.is_pro === true;
        const expireAt = profile.abonnement_expire_at;
        
        if (isPro && expireAt && new Date(expireAt) > new Date()) {
          setSubscription({
            is_pro: true,
            type: profile.abonnement_type || 'monthly',
            expire_at: expireAt
          });
        } else {
          setSubscription(null);
        }
      } else {
        // Fallback: requête directe si profile n'est pas chargé
        const { data, error } = await supabase
          .from('profiles')
          .select('is_pro, abonnement_type, abonnement_expire_at')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.is_pro && data?.abonnement_expire_at && new Date(data.abonnement_expire_at) > new Date()) {
          setSubscription({
            is_pro: true,
            type: data.abonnement_type || 'monthly',
            expire_at: data.abonnement_expire_at
          });
        } else {
          setSubscription(null);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const hasActiveSubscription = !!subscription;
  let isExpiringSoon = false;

  if (subscription?.expire_at) {
    const endDate = new Date(subscription.expire_at);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpiringSoon = diffDays <= 7 && diffDays > 0;
  }

  return { 
    hasActiveSubscription, 
    subscription, 
    isExpiringSoon, 
    refreshSubscription: checkSubscription, 
    loading 
  };
}