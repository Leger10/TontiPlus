import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useDashboardStats = (paysId = null) => {
  const [data, setData] = useState({
    tontines: 0,
    users: 0,
    countries: 0,
    collected: 0,
    distributed: 0,
    activeTontines: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      console.log('[useDashboardStats] Fetching stats started. paysId:', paysId);
      try {
        // Requêtes parallèles
        let tontinesQuery = supabase.from('tontines').select('*', { count: 'exact', head: true });
        let usersQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
        let paysQuery = supabase.from('pays').select('*', { count: 'exact', head: true });
        let adhesionsQuery = supabase.from('adhesions').select('montant_cotise, tontine_id');

        if (paysId) {
          tontinesQuery = tontinesQuery.eq('pays_id', paysId);
          usersQuery = usersQuery.eq('pays_id', paysId);
          adhesionsQuery = adhesionsQuery.eq('pays_id', paysId);
        }

        const [tontinesResult, usersResult, paysResult, adhesionsResult] = await Promise.all([
          tontinesQuery,
          usersQuery,
          paysQuery,
          adhesionsQuery
        ]);

        if (tontinesResult.error) throw tontinesResult.error;
        if (usersResult.error) throw usersResult.error;
        if (paysResult.error) throw paysResult.error;
        if (adhesionsResult.error) throw adhesionsResult.error;

        let collected = 0;
        adhesionsResult.data?.forEach(a => {
          collected += (a.montant_cotise || 0);
        });

        // Récupérer les tontines actives
        let activeTontinesQuery = supabase
          .from('tontines')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'active');
        
        if (paysId) {
          activeTontinesQuery = activeTontinesQuery.eq('pays_id', paysId);
        }
        
        const { count: activeTontines } = await activeTontinesQuery;

        const newData = {
          tontines: tontinesResult.count || 0,
          users: usersResult.count || 0,
          countries: paysResult.count || 0,
          collected: collected,
          distributed: collected * 0.8, // Mocké
          activeTontines: activeTontines || 0
        };
        
        console.log('[useDashboardStats] Fetching successful:', newData);
        setData(newData);
        setError(null);
      } catch (err) {
        console.error("[useDashboardStats] Error fetching stats:", err);
        setError(err.message || "Erreur de chargement des statistiques");
        toast.error("Impossible de charger les statistiques du tableau de bord");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [paysId]);

  return { data, loading, error };
};

export const usePendingAdhesions = (paysId = null) => {
  const [adhesions, setAdhesions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdhesions = async () => {
      try {
        let query = supabase
          .from('adhesions')
          .select(`
            *,
            user:user_id(full_name, email, phone),
            tontine:tontine_id(name)
          `)
          .eq('statut', 'pending');
        
        if (paysId) {
          query = query.eq('pays_id', paysId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        setAdhesions(data || []);
      } catch (error) {
        console.error('[usePendingAdhesions] Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdhesions();
  }, [paysId]);

  return { adhesions, loading, setAdhesions };
};

export const useLatePayments = (paysId = null) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        let query = supabase
          .from('paiements')
          .select(`
            *,
            user:user_id(full_name, email, phone),
            tontine:tontine_id(name)
          `)
          .in('statut', ['pending', 'late', 'overdue']);
        
        if (paysId) {
          query = query.eq('pays_id', paysId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        setPayments(data || []);
      } catch (error) {
        console.error('[useLatePayments] Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [paysId]);

  return { payments, loading };
};