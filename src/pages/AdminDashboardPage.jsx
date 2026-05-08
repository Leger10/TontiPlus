import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Wallet, AlertTriangle, Activity, Plus, FileText, ShieldAlert, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tontines: 0,
    members: 0,
    pendingDistributions: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer le nombre de tontines
        const { count: tontinesCount, error: tError } = await supabase
          .from('tontines')
          .select('*', { count: 'exact', head: true });
        
        if (tError) throw tError;
        
        // Récupérer le nombre de membres (profiles)
        const { count: membersCount, error: mError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (mError) throw mError;
        
        // Récupérer les tours en attente (pending)
        const { count: pendingTours, error: pError } = await supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'pending');
        
        if (pError) throw pError;
        
        // Récupérer les paiements en retard
        const { count: overduePayments, error: oError } = await supabase
          .from('paiements')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'late');
        
        if (oError) throw oError;
        
        setStats({
          tontines: tontinesCount || 0,
          members: membersCount || 0,
          pendingDistributions: pendingTours || 0,
          overdue: overduePayments || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Administration - BonPlan Tontine</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord Administrateur</h1>
          <p className="text-muted-foreground mt-1">Gérez les tontines, les membres et la modération.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline"><Link to="/admin/reports"><FileText className="w-4 h-4 mr-2" /> Rapports</Link></Button>
          <Button asChild><Link to="/create-tontine"><Plus className="w-4 h-4 mr-2" /> Nouvelle Tontine</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary"><Wallet className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tontines</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.tontines}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Membres Actifs</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.members}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><Activity className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tours en attente</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.pendingDistributions}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-destructive/10 rounded-2xl text-destructive"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paiements en retard</p>
              <h3 className="text-2xl font-bold">{loading ? '...' : stats.overdue}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="quick-links">Liens Rapides</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Tableau de bord administrateur</p>
                      <p className="text-xs text-muted-foreground">Connectez-vous pour voir les activités récentes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-warning" /> Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/deposits"><Wallet className="w-4 h-4 mr-2" /> Valider des dépôts</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/admin/subscriptions-management"><Crown className="w-4 h-4 mr-2" /> Gérer abonnements</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick-links">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild><Link to="/admin/tontines"><Wallet className="w-6 h-6" /> Gestion Tontines</Link></Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild><Link to="/admin/members"><Users className="w-6 h-6" /> Gestion Membres</Link></Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild><Link to="/admin/deposits"><ShieldAlert className="w-6 h-6" /> Validation Dépôts</Link></Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2" asChild><Link to="/admin/audit"><Activity className="w-6 h-6" /> Logs d'Audit</Link></Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;