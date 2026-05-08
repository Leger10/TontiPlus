import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Globe, ShieldCheck, Wallet, Activity, FileText, Edit, AlertTriangle, 
  TrendingUp, CheckCircle, XCircle, Clock, Crown, Eye, Filter, RefreshCw,
  Calendar, DollarSign, UserCheck, UserX, Award, Bell, Settings, Trash2,
  UserCog, CreditCard, CalendarDays, FileImage, Loader2
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard.jsx';
import DataTable from '@/components/dashboard/DataTable.jsx';
import ChartCard from '@/components/dashboard/ChartCard.jsx';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';

const SuperAdminDashboard = () => {
  const { user, profile } = useAuth();
  
  // États principaux
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tontines: { total: 0, active: 0, completed: 0, paused: 0 },
    users: { total: 0, active: 0, suspended: 0 },
    adhesions: { total: 0, pending: 0, validated: 0, rejected: 0 },
    paiements: { total: 0, paid: 0, pending: 0, late: 0, overdue: 0 },
    tours: { total: 0, completed: 0, pending: 0 },
    subscriptions: { active: 0, expired: 0 }
  });
  
  // Données pour les tableaux
  const [tontines, setTontines] = useState([]);
  const [users, setUsers] = useState([]);
  const [adhesions, setAdhesions] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [tours, setTours] = useState([]);
  const [countries, setCountries] = useState([]);
  const [secretaires, setSecretaires] = useState([]);
  
  // États pour les dépôts
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [processingDeposit, setProcessingDeposit] = useState(null);
  const [rejectDepositModalOpen, setRejectDepositModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // États pour les modals
  const [isModerateModalOpen, setIsModerateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [moderationType, setModerationType] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  
  // États pour la gestion des secrétaires
  const [selectedSecretaire, setSelectedSecretaire] = useState(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryConfig, setSalaryConfig] = useState({ taux: 10, jourVersement: 5 });
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState('quarterly');
  const [secretairesSalaries, setSecretairesSalaries] = useState({});
  
  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // =====================================================
  // RÉCUPÉRATION DES DONNÉES
  // =====================================================

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Récupérer les tontines
      const { data: tontinesData, error: tontinesError } = await supabase
        .from('tontines')
        .select(`
          *,
          organisateur:organisateur_id(full_name, email, phone),
          pays:pays(name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (tontinesError) throw tontinesError;
      setTontines(tontinesData || []);
      
      // 2. Récupérer les utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          pays:pays(name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      setUsers(usersData || []);
      
      // 3. Récupérer les adhésions
      const { data: adhesionsData, error: adhesionsError } = await supabase
        .from('adhesions')
        .select(`
          *,
          tontine:tontine_id(name),
          user:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (adhesionsError) throw adhesionsError;
      setAdhesions(adhesionsData || []);
      
      // 4. Récupérer les paiements
      const { data: paiementsData, error: paiementsError } = await supabase
        .from('paiements')
        .select(`
          *,
          tontine:tontine_id(name),
          user:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (paiementsError) throw paiementsError;
      setPaiements(paiementsData || []);
      
      // 5. Récupérer les tours
      const { data: toursData, error: toursError } = await supabase
        .from('tours')
        .select(`
          *,
          tontine:tontine_id(name),
          user:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (toursError) throw toursError;
      setTours(toursData || []);
      
      // 6. Récupérer les pays
      const { data: countriesData, error: countriesError } = await supabase
        .from('pays')
        .select('*')
        .order('name');
      
      if (countriesError) throw countriesError;
      setCountries(countriesData || []);
      
      // 7. Récupérer les secrétaires
      const { data: secretairesData, error: secretairesError } = await supabase
        .from('profiles')
        .select(`
          *,
          pays:pays(name, code)
        `)
        .in('role', ['pays_secretaire', 'secretaire_national', 'dg_pays']);
      
      if (secretairesError) throw secretairesError;
      setSecretaires(secretairesData || []);
      await calculateAllSalaries(secretairesData || []);
      
      // 8. Calculer les statistiques
      calculateStats(tontinesData, usersData, adhesionsData, paiementsData, toursData);
      
      // 9. Récupérer la configuration salariale
      const { data: configData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'salary_config')
        .maybeSingle();
      
      if (configData?.value) {
        setSalaryConfig(configData.value);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les dépôts en attente
  const fetchPendingDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          user:user_id(id, full_name, email, phone)
        `)
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPendingDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const calculateStats = (tontinesData, usersData, adhesionsData, paiementsData, toursData) => {
    // Statistiques tontines
    const tontinesStats = {
      total: tontinesData?.length || 0,
      active: tontinesData?.filter(t => t.statut === 'active').length || 0,
      completed: tontinesData?.filter(t => t.statut === 'completed').length || 0,
      paused: tontinesData?.filter(t => t.statut === 'paused').length || 0
    };
    
    // Statistiques utilisateurs
    const usersStats = {
      total: usersData?.length || 0,
      active: usersData?.filter(u => u.is_active !== false).length || 0,
      suspended: usersData?.filter(u => u.is_active === false).length || 0
    };
    
    // Statistiques adhésions
    const adhesionsStats = {
      total: adhesionsData?.length || 0,
      pending: adhesionsData?.filter(a => a.statut === 'pending').length || 0,
      validated: adhesionsData?.filter(a => a.statut === 'validated').length || 0,
      rejected: adhesionsData?.filter(a => a.statut === 'rejected').length || 0
    };
    
    // Statistiques paiements
    const paiementsStats = {
      total: paiementsData?.length || 0,
      paid: paiementsData?.filter(p => p.statut === 'paid').length || 0,
      pending: paiementsData?.filter(p => p.statut === 'pending').length || 0,
      late: paiementsData?.filter(p => p.statut === 'late').length || 0,
      overdue: paiementsData?.filter(p => p.statut === 'overdue').length || 0
    };
    
    // Statistiques tours
    const toursStats = {
      total: toursData?.length || 0,
      completed: toursData?.filter(t => t.statut === 'completed').length || 0,
      pending: toursData?.filter(t => t.statut === 'pending').length || 0
    };
    
    // Abonnements (depuis profiles)
    const subscriptionsStats = {
      active: usersData?.filter(u => u.is_pro === true && new Date(u.abonnement_expire_at) > new Date()).length || 0,
      expired: usersData?.filter(u => u.is_pro === true && new Date(u.abonnement_expire_at) <= new Date()).length || 0
    };
    
    setStats({
      tontines: tontinesStats,
      users: usersStats,
      adhesions: adhesionsStats,
      paiements: paiementsStats,
      tours: toursStats,
      subscriptions: subscriptionsStats
    });
  };

  const calculateAllSalaries = async (secretairesList) => {
    const salaries = {};
    for (const secretaire of secretairesList) {
      const { data: payments } = await supabase
        .from('paiements')
        .select('montant')
        .eq('pays_id', secretaire.pays_id)
        .eq('statut', 'paid')
        .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());
      
      const totalCA = payments?.reduce((sum, p) => sum + p.montant, 0) || 0;
      const salary = totalCA * (salaryConfig.taux / 100);
      salaries[secretaire.id] = { totalCA, salary };
    }
    setSecretairesSalaries(salaries);
  };

  useEffect(() => {
    fetchAllData();
    fetchPendingDeposits();
  }, [fetchAllData]);

  // =====================================================
  // FONCTIONS DE MODÉRATION
  // =====================================================

  const handleModerateTontine = async (tontine, action) => {
    setIsUpdating(true);
    try {
      const newStatus = action === 'suspend' ? 'paused' : 'active';
      const { error } = await supabase
        .from('tontines')
        .update({ statut: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tontine.id);
      
      if (error) throw error;
      
      await supabase.from('notifications').insert([{
        user_id: tontine.organisateur_id,
        title: action === 'suspend' ? 'Tontine suspendue' : 'Tontine réactivée',
        message: `Votre tontine "${tontine.name}" a été ${action === 'suspend' ? 'suspendue' : 'réactivée'} par l'administrateur.`,
        type: 'moderation_alert',
        send_internal: true
      }]);
      
      toast.success(`Tontine ${action === 'suspend' ? 'suspendue' : 'réactivée'} avec succès`);
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la modération');
    } finally {
      setIsUpdating(false);
      setIsModerateModalOpen(false);
    }
  };

  const handleValidateAdhesion = async (adhesion, action) => {
    setIsUpdating(true);
    try {
      const newStatus = action === 'approve' ? 'validated' : 'rejected';
      const { error } = await supabase
        .from('adhesions')
        .update({ 
          statut: newStatus, 
          motif_rejet: action === 'reject' ? moderationReason : null,
          date_validation: new Date().toISOString(),
          valide_par: user.id
        })
        .eq('id', adhesion.id);
      
      if (error) throw error;
      
      await supabase.from('notifications').insert([{
        user_id: adhesion.user_id,
        title: action === 'approve' ? 'Adhésion approuvée' : 'Adhésion refusée',
        message: action === 'approve' 
          ? `Votre adhésion à la tontine "${adhesion.tontine?.name}" a été approuvée.`
          : `Votre adhésion à la tontine "${adhesion.tontine?.name}" a été refusée. Raison: ${moderationReason}`,
        type: action === 'approve' ? 'adhesion_validated' : 'adhesion_rejected',
        send_internal: true
      }]);
      
      toast.success(`Adhésion ${action === 'approve' ? 'approuvée' : 'refusée'}`);
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la validation');
    } finally {
      setIsUpdating(false);
      setIsModerateModalOpen(false);
      setModerationReason('');
    }
  };

  const handleManageUser = async (userItem, action) => {
    setIsUpdating(true);
    try {
      const isActive = action === 'activate';
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userItem.id);
      
      if (error) throw error;
      
      toast.success(`Utilisateur ${action === 'activate' ? 'activé' : 'désactivé'}`);
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la gestion');
    } finally {
      setIsUpdating(false);
      setIsModerateModalOpen(false);
    }
  };

  // =====================================================
  // FONCTIONS POUR LES DÉPÔTS
  // =====================================================

  const getDepositImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const { data } = supabase.storage.from('payment_screenshots').getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const openRejectDepositModal = (deposit) => {
    setSelectedDeposit(deposit);
    setRejectReason('');
    setRejectDepositModalOpen(true);
  };

  const handleValidateDeposit = async (deposit) => {
    setProcessingDeposit(deposit.id);
    try {
      // Mettre à jour le dépôt
      const { error: depositError } = await supabase
        .from('deposits')
        .update({ 
          statut: 'validated',
          validated_at: new Date().toISOString(),
          validated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit.id);
      
      if (depositError) throw depositError;
      
      // Mettre à jour le wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', deposit.user_id)
        .maybeSingle();
      
      if (wallet) {
        await supabase
          .from('wallets')
          .update({ 
            balance: (wallet.balance || 0) + deposit.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', deposit.user_id);
      } else {
        await supabase
          .from('wallets')
          .insert({ 
            user_id: deposit.user_id, 
            balance: deposit.amount,
            commissions_total: 0,
            pending_withdrawal: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      // Créer une notification
      await supabase.from('notifications').insert({
        user_id: deposit.user_id,
        title: '✅ Dépôt validé',
        message: `Votre dépôt de ${deposit.amount.toLocaleString()} FCFA a été validé et crédité sur votre wallet.`,
        type: 'deposit_validated',
        is_read: false,
        created_at: new Date().toISOString()
      });
      
      toast.success(`Dépôt de ${deposit.amount.toLocaleString()} FCFA validé`);
      fetchPendingDeposits();
      fetchAllData();
      
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la validation');
    } finally {
      setProcessingDeposit(null);
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer un motif');
      return;
    }
    
    setProcessingDeposit(selectedDeposit?.id);
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          statut: 'rejected',
          motif_rejet: rejectReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDeposit.id);
      
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: selectedDeposit.user_id,
        title: '❌ Dépôt rejeté',
        message: `Votre dépôt de ${selectedDeposit.amount.toLocaleString()} FCFA a été rejeté. Motif: ${rejectReason}`,
        type: 'deposit_rejected',
        is_read: false,
        created_at: new Date().toISOString()
      });
      
      toast.success('Dépôt rejeté');
      setRejectDepositModalOpen(false);
      fetchPendingDeposits();
      
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessingDeposit(null);
      setRejectReason('');
    }
  };

  // =====================================================
  // FONCTIONS POUR LES SECRÉTAIRES
  // =====================================================

  const handleUpdateSalaryConfig = async () => {
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'salary_config',
        value: salaryConfig,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Erreur lors de la configuration');
    } else {
      toast.success('Configuration salariale mise à jour');
      setIsSalaryModalOpen(false);
      await calculateAllSalaries(secretaires);
    }
  };

  const handleSecretaireSubscription = async (secretaire, type) => {
    const durationMonths = type === 'annual' ? 12 : 3;
    const price = type === 'annual' ? 350000 : 100000;
    
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + durationMonths);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        abonnement_type: type,
        abonnement_started_at: new Date().toISOString(),
        abonnement_expire_at: expireDate.toISOString(),
        role: 'pays_secretaire'
      })
      .eq('id', secretaire.id);
    
    if (error) {
      toast.error('Erreur lors de l\'abonnement');
    } else {
      toast.success(`Abonnement ${type === 'annual' ? 'annuel' : 'trimestriel'} activé`);
      fetchAllData();
      setIsSubscriptionModalOpen(false);
    }
  };

  // =====================================================
  // COMPOSANTS D'AFFICHAGE
  // =====================================================

  const getStatusBadge = (status) => {
    const badges = {
      'active': { className: 'bg-green-500 text-white', label: 'ACTIVE' },
      'completed': { className: 'bg-blue-500 text-white', label: 'TERMINÉE' },
      'paused': { className: 'bg-yellow-500 text-white', label: 'EN PAUSE' },
      'full': { className: 'bg-purple-500 text-white', label: 'COMPLÈTE' },
      'pending': { className: 'bg-yellow-500 text-white', label: 'EN ATTENTE' },
      'validated': { className: 'bg-green-500 text-white', label: 'VALIDÉE' },
      'rejected': { className: 'bg-red-500 text-white', label: 'REJETÉE' },
      'paid': { className: 'bg-green-500 text-white', label: 'PAYÉ' },
      'late': { className: 'bg-orange-500 text-white', label: 'EN RETARD' },
      'overdue': { className: 'bg-red-500 text-white', label: 'TRÈS EN RETARD' }
    };
    const badge = badges[status] || { className: 'bg-gray-500 text-white', label: status?.toUpperCase() || 'INCONNU' };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  // Données pour les graphiques
  const tontineStatusData = [
    { name: 'Actives', value: stats.tontines.active },
    { name: 'Terminées', value: stats.tontines.completed },
    { name: 'En pause', value: stats.tontines.paused }
  ];
  
  const paymentStatusData = [
    { name: 'Payés', value: stats.paiements.paid },
    { name: 'En attente', value: stats.paiements.pending },
    { name: 'En retard', value: stats.paiements.late },
    { name: 'Très en retard', value: stats.paiements.overdue }
  ];

  // Colonnes pour les tableaux
  const tontineColumns = [
    { header: 'Nom', accessorKey: 'name' },
    { header: 'Organisateur', accessorKey: 'organisateur.full_name' },
    { header: 'Pays', accessorKey: 'pays.name' },
    { header: 'Membres', accessorKey: (row) => `${row.nombre_membres || 0}` },
    { header: 'Cotisation', accessorKey: (row) => `${row.montant_cotisation?.toLocaleString()} CFA` },
    { header: 'Statut', cell: (row) => getStatusBadge(row.statut) },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => window.open(`/admin/tontines/${row.id}`, '_blank')}>
          <Eye className="w-4 h-4" />
        </Button>
        {row.statut === 'active' ? (
          <Button size="sm" variant="destructive" onClick={() => {
            setSelectedItem(row);
            setModerationType('suspend_tontine');
            setIsModerateModalOpen(true);
          }}>
            <AlertTriangle className="w-4 h-4" />
          </Button>
        ) : row.statut === 'paused' && (
          <Button size="sm" variant="default" onClick={() => handleModerateTontine(row, 'activate')}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    ) }
  ];

  const adhesionColumns = [
    { header: 'Membre', accessorKey: 'user.full_name' },
    { header: 'Tontine', accessorKey: 'tontine.name' },
    { header: 'Téléphone', accessorKey: 'telephone' },
    { header: 'Date', accessorKey: (row) => new Date(row.created_at).toLocaleDateString('fr-FR') },
    { header: 'Statut', cell: (row) => getStatusBadge(row.statut) },
    { header: 'Actions', cell: (row) => row.statut === 'pending' && (
      <div className="flex gap-2">
        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => {
          setSelectedItem(row);
          setModerationType('approve_adhesion');
          setIsModerateModalOpen(true);
        }}>
          <CheckCircle className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={() => {
          setSelectedItem(row);
          setModerationType('reject_adhesion');
          setIsModerateModalOpen(true);
        }}>
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    ) }
  ];

  const paymentColumns = [
    { header: 'Membre', accessorKey: 'user.full_name' },
    { header: 'Tontine', accessorKey: 'tontine.name' },
    { header: 'Montant', accessorKey: (row) => `${row.montant?.toLocaleString()} CFA` },
    { header: 'Cycle', accessorKey: 'cycle_number' },
    { header: 'Statut', cell: (row) => getStatusBadge(row.statut) }
  ];

  const tourColumns = [
    { header: 'Bénéficiaire', accessorKey: 'user.full_name' },
    { header: 'Tontine', accessorKey: 'tontine.name' },
    { header: 'Cycle', accessorKey: 'cycle_number' },
    { header: 'Position', accessorKey: 'position' },
    { header: 'Statut', cell: (row) => getStatusBadge(row.statut) }
  ];

  const userColumns = [
    { header: 'Nom', accessorKey: 'full_name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Téléphone', accessorKey: 'phone' },
    { header: 'Pays', accessorKey: (row) => row.pays?.name || '-' },
    { header: 'Rôle', accessorKey: 'role' },
    { header: 'PRO', cell: (row) => row.is_pro ? <Crown className="w-4 h-4 text-yellow-500" /> : '-' },
    { header: 'Statut', cell: (row) => row.is_active !== false ? 'Actif' : 'Suspendu' },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => window.open(`/profile/${row.id}`, '_blank')}>
          <Eye className="w-4 h-4" />
        </Button>
        {row.is_active !== false ? (
          <Button size="sm" variant="destructive" onClick={() => {
            setSelectedItem(row);
            setModerationType('suspend_user');
            setIsModerateModalOpen(true);
          }}>
            <UserX className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="sm" variant="default" onClick={() => handleManageUser(row, 'activate')}>
            <UserCheck className="w-4 h-4" />
          </Button>
        )}
      </div>
    ) }
  ];

  // Filtrage des données
  const filteredTontines = tontines.filter(t => {
    if (statusFilter !== 'all' && t.statut !== statusFilter) return false;
    if (countryFilter !== 'all' && t.pays_id !== parseInt(countryFilter)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Super Administration</h1>
            <p className="text-muted-foreground mt-2">Vue d'ensemble et contrôle global du système de tontines</p>
          </div>
          <Button onClick={fetchAllData} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
          </Button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Tontines" value={stats.tontines.total} icon={Activity} 
            subtitle={`${stats.tontines.active} actives`} />
          <StatCard title="Utilisateurs" value={stats.users.total} icon={Users} 
            subtitle={`${stats.users.active} actifs`} />
          <StatCard title="Adhésions" value={stats.adhesions.total} icon={UserCheck} 
            subtitle={`${stats.adhesions.pending} en attente`} />
          <StatCard title="Paiements" value={stats.paiements.total} icon={DollarSign} 
            subtitle={`${stats.paiements.pending} en attente`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Tours effectués" value={stats.tours.completed} icon={Award} 
            subtitle={`sur ${stats.tours.total} tours`} />
          <StatCard title="Abonnements PRO" value={stats.subscriptions.active} icon={Crown} 
            subtitle={`${stats.subscriptions.expired} expirés`} />
          <StatCard title="Pays couverts" value={countries.length} icon={Globe} 
            subtitle="Couverture régionale" />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Répartition des Tontines">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={tontineStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>
                  {tontineStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          
          <ChartCard title="État des Paiements">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Tabs avec toutes les données */}
        <Tabs defaultValue="tontines" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-8 mb-8 h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto">
            <TabsTrigger value="tontines" className="rounded-lg py-2">📊 Tontines</TabsTrigger>
            <TabsTrigger value="adhesions" className="rounded-lg py-2">📝 Adhésions</TabsTrigger>
            <TabsTrigger value="paiements" className="rounded-lg py-2">💰 Paiements</TabsTrigger>
            <TabsTrigger value="tours" className="rounded-lg py-2">🔄 Tours</TabsTrigger>
            <TabsTrigger value="utilisateurs" className="rounded-lg py-2">👥 Utilisateurs</TabsTrigger>
            <TabsTrigger value="depots" className="rounded-lg py-2">💳 Dépôts</TabsTrigger>
            <TabsTrigger value="pays" className="rounded-lg py-2">🌍 Pays</TabsTrigger>
            <TabsTrigger value="secretaires" className="rounded-lg py-2">👥 Secrétaires</TabsTrigger>
          </TabsList>

          {/* Onglet Tontines */}
          <TabsContent value="tontines" className="space-y-4">
            <div className="bg-card rounded-2xl p-4 shadow-premium-sm border border-border">
              <div className="flex flex-wrap gap-4 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="paused">En pause</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Globe className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DataTable 
                columns={tontineColumns} 
                data={filteredTontines}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Onglet Adhésions */}
          <TabsContent value="adhesions">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="text-primary" /> Demandes d'adhésion
                {stats.adhesions.pending > 0 && (
                  <Badge className="bg-yellow-500">{stats.adhesions.pending} en attente</Badge>
                )}
              </h2>
              <DataTable 
                columns={adhesionColumns} 
                data={adhesions}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Onglet Paiements */}
          <TabsContent value="paiements">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="text-primary" /> Suivi des paiements
                {stats.paiements.late > 0 && (
                  <Badge className="bg-orange-500">{stats.paiements.late} en retard</Badge>
                )}
                {stats.paiements.overdue > 0 && (
                  <Badge className="bg-red-500">{stats.paiements.overdue} très en retard</Badge>
                )}
              </h2>
              <DataTable 
                columns={paymentColumns} 
                data={paiements}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Onglet Tours */}
          <TabsContent value="tours">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="text-primary" /> Distribution des tours
                <Badge className="bg-green-500">{stats.tours.completed} complétés</Badge>
              </h2>
              <DataTable 
                columns={tourColumns} 
                data={tours}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Onglet Utilisateurs */}
          <TabsContent value="utilisateurs">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="text-primary" /> Gestion des utilisateurs
              </h2>
              <DataTable 
                columns={userColumns} 
                data={users}
                loading={loading}
              />
            </div>
          </TabsContent>

          {/* Onglet Dépôts - Validation des rechargements */}
          <TabsContent value="depots">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CreditCard className="text-primary" /> Validation des dépôts
                  </h2>
                  <p className="text-muted-foreground">
                    Gérez les demandes de rechargement de wallet des utilisateurs
                  </p>
                </div>
                <Button onClick={fetchPendingDeposits} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
                </Button>
              </div>
              
              {/* Tableau des dépôts en attente */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Opérateur & ID</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="text-center">Reçu</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDeposits ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-8 w-8 rounded mx-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pendingDeposits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                          <CheckCircle className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-medium">Aucune demande en attente</p>
                        <p className="text-sm text-muted-foreground mt-1">Tous les dépôts ont été traités</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingDeposits.map(deposit => (
                      <TableRow key={deposit.id} className="hover:bg-muted/10">
                        <TableCell className="whitespace-nowrap">
                          {new Date(deposit.created_at).toLocaleDateString('fr-FR')}
                          <div className="text-xs text-muted-foreground">
                            {new Date(deposit.created_at).toLocaleTimeString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{deposit.user?.full_name || 'Inconnu'}</div>
                          <div className="text-xs text-muted-foreground">{deposit.user?.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="mb-1 bg-background">
                            {deposit.payment_method}
                          </Badge>
                          <div className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit mt-1">
                            {deposit.transaction_id}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold whitespace-nowrap">
                          {deposit.amount?.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell className="text-center">
                          {deposit.image_url ? (
                            <Button variant="outline" size="sm" asChild className="gap-2">
                              <a href={getDepositImageUrl(deposit.image_url)} target="_blank" rel="noopener noreferrer">
                                <FileImage className="w-4 h-4" /> Voir
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Aucun</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openRejectDepositModal(deposit)}
                              disabled={processingDeposit === deposit.id}
                              className="bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Rejeter
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleValidateDeposit(deposit)}
                              disabled={processingDeposit === deposit.id}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              {processingDeposit === deposit.id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              Valider
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Onglet Pays */}
          <TabsContent value="pays">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe className="text-primary" /> Pays couverts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {countries.map(country => (
                  <div key={country.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{country.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {country.code}</p>
                    </div>
                    <Badge variant="outline">{country.indicatif_telephone}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Onglet Secrétaires */}
          <TabsContent value="secretaires">
            <div className="bg-card rounded-2xl p-6 shadow-premium-sm border border-border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <UserCog className="text-primary" /> Gestion des Secrétaires par pays
                  </h2>
                  <p className="text-muted-foreground">
                    Gérez les abonnements, les salaires et les commissions des secrétaires
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsSalaryModalOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" /> Configurer salaire
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration salariale actuelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taux de commission :</span>
                        <span className="font-bold">{salaryConfig.taux}% du CA mensuel</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jour de versement :</span>
                        <span className="font-bold">Le {salaryConfig.jourVersement} de chaque mois</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frais de retrait :</span>
                        <span className="font-bold">3% sur chaque demande</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Tarifs abonnement secrétaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">100 000 FCFA</p>
                        <p className="text-sm opacity-80">Trimestriel<br/>(10% commission)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">350 000 FCFA</p>
                        <p className="text-sm opacity-80">Annuel<br/>(10% commission)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secrétaire</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead>CA mensuel</TableHead>
                    <TableHead>Salaire (10%)</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secretaires.map((s) => {
                    const salaryData = secretairesSalaries[s.id] || { totalCA: 0, salary: 0 };
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell>{s.pays?.name}</TableCell>
                        <TableCell>
                          {s.is_pro ? (
                            <Badge className="bg-green-500">
                              {s.abonnement_type === 'annual' ? 'Annuel' : 'Trimestriel'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Aucun</Badge>
                          )}
                        </TableCell>
                        <TableCell>{salaryData.totalCA.toLocaleString()} FCFA</TableCell>
                        <TableCell className="font-bold text-green-600">{salaryData.salary.toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          {s.is_active !== false ? (
                            <Badge className="bg-green-500">Actif</Badge>
                          ) : (
                            <Badge className="bg-red-500">Suspendu</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {!s.is_pro && (
                            <Button size="sm" variant="default" onClick={() => {
                              setSelectedSecretaire(s);
                              setIsSubscriptionModalOpen(true);
                            }}>
                              <Crown className="w-4 h-4 mr-1" /> Activer
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => {
                            window.open(`/profile/${s.id}`, '_blank');
                          }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {secretaires.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Aucun secrétaire</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de modération */}
      <Dialog open={isModerateModalOpen} onOpenChange={setIsModerateModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary" /> Modération
            </DialogTitle>
            <DialogDescription>
              {moderationType === 'suspend_tontine' && `Suspendre la tontine "${selectedItem?.name}" ?`}
              {moderationType === 'approve_adhesion' && `Approuver l'adhésion de ${selectedItem?.user?.full_name} ?`}
              {moderationType === 'reject_adhesion' && `Refuser l'adhésion de ${selectedItem?.user?.full_name} ?`}
              {moderationType === 'suspend_user' && `Suspendre l'utilisateur ${selectedItem?.full_name} ?`}
            </DialogDescription>
          </DialogHeader>
          
          {(moderationType === 'reject_adhesion' || moderationType === 'suspend_tontine') && (
            <div className="space-y-4 py-4">
              <Label>Motif (optionnel)</Label>
              <Textarea 
                placeholder="Expliquez la raison de cette action..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModerateModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant={moderationType.includes('reject') || moderationType.includes('suspend') ? 'destructive' : 'default'}
              onClick={() => {
                if (moderationType === 'suspend_tontine') handleModerateTontine(selectedItem, 'suspend');
                if (moderationType === 'approve_adhesion') handleValidateAdhesion(selectedItem, 'approve');
                if (moderationType === 'reject_adhesion') handleValidateAdhesion(selectedItem, 'reject');
                if (moderationType === 'suspend_user') handleManageUser(selectedItem, 'suspend');
              }}
              disabled={isUpdating}
            >
              {isUpdating ? 'Traitement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de rejet de dépôt */}
      <Dialog open={rejectDepositModalOpen} onOpenChange={setRejectDepositModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rejeter le dépôt</DialogTitle>
            <DialogDescription>
              Veuillez expliquer le motif du rejet. L'utilisateur recevra cette information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motif du rejet <span className="text-red-500">*</span></Label>
              <Textarea 
                placeholder="Ex: Transaction ID invalide, Montant incorrect, Reçu illisible..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="bg-background border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDepositModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRejectDeposit}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal configuration salaire */}
      <Dialog open={isSalaryModalOpen} onOpenChange={setIsSalaryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration des salaires</DialogTitle>
            <DialogDescription>
              Définissez les paramètres de commission pour les secrétaires pays
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Taux de commission (%)</Label>
              <Input
                type="number"
                value={salaryConfig.taux}
                onChange={(e) => setSalaryConfig({...salaryConfig, taux: parseInt(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Jour de versement</Label>
              <Input
                type="number"
                value={salaryConfig.jourVersement}
                onChange={(e) => setSalaryConfig({...salaryConfig, jourVersement: parseInt(e.target.value)})}
                min="1"
                max="28"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaryModalOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdateSalaryConfig}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal abonnement secrétaire */}
      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer l'abonnement secrétaire</DialogTitle>
            <DialogDescription>
              Choisissez la formule pour {selectedSecretaire?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card className={`cursor-pointer transition-all ${subscriptionType === 'quarterly' ? 'border-2 border-primary' : ''}`} onClick={() => setSubscriptionType('quarterly')}>
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-bold">100 000 FCFA</p>
                <p className="text-sm text-muted-foreground">Trimestriel</p>
                <p className="text-xs mt-2">Commission 10% pendant 3 mois</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${subscriptionType === 'annual' ? 'border-2 border-primary' : ''}`} onClick={() => setSubscriptionType('annual')}>
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-bold">350 000 FCFA</p>
                <p className="text-sm text-muted-foreground">Annuel</p>
                <p className="text-xs mt-2">Commission 10% pendant 12 mois</p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscriptionModalOpen(false)}>Annuler</Button>
            <Button onClick={() => handleSecretaireSubscription(selectedSecretaire, subscriptionType)}>
              Activer l'abonnement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;