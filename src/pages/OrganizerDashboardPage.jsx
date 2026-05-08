import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Settings, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';

const OrganizerDashboardPage = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Récupérer la tontine
        const { data: t, error } = await supabase
          .from('tontines')
          .select('*, organisateur:organisateur_id(full_name, email)')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        // Vérifier l'accès (organisateur ou super_admin)
        const isOrganizer = t.organisateur_id === user.id;
        const isSuperAdmin = profile?.role === 'super_admin';
        
        if (!isOrganizer && !isSuperAdmin) {
          toast.error("Accès refusé : vous n'êtes pas l'organisateur de cette tontine");
          navigate('/');
          return;
        }
        
        setTontine(t);
        
        // Rediriger vers la nouvelle interface Tontinier unifiée
        navigate(`/tontinier/dashboard/${id}`);
      } catch(e) {
        console.error('Error loading tontine:', e);
        toast.error("Tontine introuvable ou accès non autorisé");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, user, profile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Tableau de bord - {tontine?.name || 'Organisateur'}</title></Helmet>
      <div className="min-h-screen bg-muted/20 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tableau de bord organisateur</h1>
              <p className="text-muted-foreground">Redirection en cours vers la nouvelle interface...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tontine</p>
                  <p className="text-xl font-bold">{tontine?.name}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="text-xl font-bold capitalize">{tontine?.statut || 'Actif'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cycle actuel</p>
                  <p className="text-xl font-bold">Cycle {tontine?.cycle_actuel || 1}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <p>Redirection vers le tableau de bord unifié des tontines...</p>
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizerDashboardPage;