import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, PieChart as PieChartIcon, TrendingUp, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tontines: { total: 0, active: 0 },
    users: { total: 0 },
    paiements: { total: 0, totalAmount: 0 }
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Nombre de tontines
      const { count: tontinesTotal } = await supabase
        .from('tontines')
        .select('*', { count: 'exact', head: true });
      
      const { count: tontinesActive } = await supabase
        .from('tontines')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'active');

      // Nombre d'utilisateurs
      const { count: usersTotal } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total des paiements
      const { data: paiementsData } = await supabase
        .from('paiements')
        .select('montant, statut')
        .eq('statut', 'paid');

      const totalAmount = paiementsData?.reduce((sum, p) => sum + p.montant, 0) || 0;

      setStats({
        tontines: { total: tontinesTotal || 0, active: tontinesActive || 0 },
        users: { total: usersTotal || 0 },
        paiements: { total: paiementsData?.length || 0, totalAmount }
      });

      // Données mensuelles (simulées pour l'instant)
      setMonthlyData([
        { month: 'Jan', montants: 45000 },
        { month: 'Fév', montants: 52000 },
        { month: 'Mar', montants: 48000 },
        { month: 'Avr', montants: 61000 },
        { month: 'Mai', montants: 55000 },
        { month: 'Juin', montants: 67000 }
      ]);

      // Données de statut
      setStatusData([
        { name: 'Actives', value: stats.tontines.active },
        { name: 'Terminées', value: stats.tontines.total - stats.tontines.active }
      ]);

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Mois', 'Montants (FCFA)'];
    const rows = monthlyData.map(d => [d.month, d.montants]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'rapports_tontines.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export CSV effectué');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Rapports & Statistiques - Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports & Statistiques</h1>
          <p className="text-muted-foreground mt-1">Analysez les performances de la plateforme.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Exporter tout (CSV)
        </Button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tontines</p>
                <p className="text-2xl font-bold">{stats.tontines.total}</p>
                <p className="text-xs text-green-600">{stats.tontines.active} actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.users.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.paiements.totalAmount.toLocaleString()} FCFA</p>
                <p className="text-xs text-muted-foreground">{stats.paiements.total} paiements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Flux Financiers (Mensuel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                <Legend />
                <Bar dataKey="montants" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" /> Répartition des Statuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} tontines`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapport par Tontine</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-8 text-center text-muted-foreground border-t border-border">
            Tableau des rapports détaillés à implémenter.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;