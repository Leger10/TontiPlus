import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard.jsx";
import ChartCard from "@/components/dashboard/ChartCard.jsx";
import {
  FileCheck,
  AlertTriangle,
  Wallet,
  Crown,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Activity,
  History,
  Award,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import BackButton from "@/components/BackButton.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SecretairePaysDashboard = () => {
  const { user, profile } = useAuth();

  // États
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tontines: 0,
    users: 0,
    adhesions: { total: 0, pending: 0 },
    paiements: { total: 0, late: 0 },
    commissions: { total: 0, pending: 0, lastMonth: 0 },
    chiffreAffaire: 0,
    totalCollected: 0,
  });

  const [adhesions, setAdhesions] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [tontiniersPro, setTontiniersPro] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [countries, setCountries] = useState([]);

  // États modals
  const [selectedAdhesion, setSelectedAdhesion] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Couleurs graphiques
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const paysId = profile?.pays_id;
  const pays = countries.find((c) => c.id === paysId);

  // =====================================================
  // RÉCUPÉRATION DES DONNÉES
  // =====================================================

  const fetchData = useCallback(async () => {
    if (!paysId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Récupérer les pays
      const { data: countriesData, error: countriesError } = await supabase
        .from("pays")
        .select("*")
        .order("name");

      if (countriesError) throw countriesError;
      setCountries(countriesData || []);

      // 2. Récupérer les adhésions en attente du pays
      const { data: adhesionsData, error: adhesionsError } = await supabase
        .from("adhesions")
        .select(
          `
          *,
          user:user_id(full_name, email, phone),
          tontine:tontine_id(name, organisateur_id)
        `,
        )
        .eq("statut", "pending")
        .eq("pays_id", paysId)
        .order("created_at", { ascending: false });

      if (adhesionsError) throw adhesionsError;
      setAdhesions(adhesionsData || []);

      // 3. Récupérer les paiements en retard
      const { data: paiementsData, error: paiementsError } = await supabase
        .from("paiements")
        .select(
          `
          *,
          user:user_id(full_name, email, phone),
          tontine:tontine_id(name)
        `,
        )
        .eq("pays_id", paysId)
        .in("statut", ["pending", "late", "overdue"])
        .order("created_at", { ascending: false });

      if (paiementsError) throw paiementsError;
      setPaiements(paiementsData || []);

      // 4. Récupérer les distributions en attente
      const { data: distributionsData, error: distributionsError } =
        await supabase
          .from("tours")
          .select(
            `
          *,
          user:user_id(full_name, email),
          tontine:tontine_id(name)
        `,
          )
          .eq("statut", "pending")
          .order("created_at", { ascending: false });

      if (distributionsError) throw distributionsError;
      setDistributions(distributionsData || []);

      // 5. Récupérer les tontiniers PRO
      const { data: tontiniersData, error: tontiniersError } = await supabase
        .from("profiles")
        .select(
          `
          *,
          pays:pays(name)
        `,
        )
        .eq("pays_id", paysId)
        .eq("is_pro", true)
        .eq("role", "tontinier");

      if (tontiniersError) throw tontiniersError;
      setTontiniersPro(tontiniersData || []);

      // 6. Récupérer l'historique des retraits
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawalHistory(withdrawalsData || []);

      // 7. Calculer les statistiques
      await calculateStats();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [paysId, user?.id]);

  const calculateStats = async () => {
    try {
      // Nombre de tontines dans le pays
      const { count: tontinesCount } = await supabase
        .from("tontines")
        .select("*", { count: "exact", head: true })
        .eq("pays_id", paysId);

      // Nombre d'utilisateurs
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("pays_id", paysId);

      // Total collecté (paiements validés)
      const { data: paiementsData } = await supabase
        .from("paiements")
        .select("montant")
        .eq("pays_id", paysId)
        .eq("statut", "paid");

      const totalCollected =
        paiementsData?.reduce((sum, p) => sum + p.montant, 0) || 0;

      // Commission (10% du chiffre d'affaire)
      const commissionTotal = totalCollected * 0.1;

      // Chiffre d'affaire du dernier mois
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: lastMonthPayments } = await supabase
        .from("paiements")
        .select("montant")
        .eq("pays_id", paysId)
        .eq("statut", "paid")
        .gte("created_at", lastMonth.toISOString());

      const lastMonthTotal =
        lastMonthPayments?.reduce((sum, p) => sum + p.montant, 0) || 0;
      const lastMonthCommission = lastMonthTotal * 0.1;

      setStats({
        tontines: tontinesCount || 0,
        users: usersCount || 0,
        adhesions: {
          total: adhesions.length,
          pending: adhesions.filter((a) => a.statut === "pending").length,
        },
        paiements: {
          total: paiements.length,
          late: paiements.filter(
            (p) => p.statut === "late" || p.statut === "overdue",
          ).length,
        },
        commissions: {
          total: commissionTotal,
          pending: commissionTotal * 0.7,
          lastMonth: lastMonthCommission,
        },
        chiffreAffaire: totalCollected,
        totalCollected: totalCollected,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =====================================================
  // FONCTIONS DE GESTION
  // =====================================================

  const handleValidateAdhesion = async (adhesion, action) => {
    try {
      const newStatus = action === "approve" ? "validated" : "rejected";
      const { error } = await supabase
        .from("adhesions")
        .update({
          statut: newStatus,
          date_validation: new Date().toISOString(),
          valide_par: user.id,
        })
        .eq("id", adhesion.id);

      if (error) throw error;

      toast.success(
        `Adhésion ${action === "approve" ? "approuvée" : "refusée"}`,
      );
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la validation");
    }
  };

  const handleValidatePayment = async (payment) => {
    try {
      const { error } = await supabase
        .from("paiements")
        .update({
          statut: "paid",
          date_paiement: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (error) throw error;

      toast.success("Paiement validé");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la validation");
    }
  };

  const handleConfirmDistribution = async (distribution) => {
    try {
      const { error } = await supabase
        .from("tours")
        .update({
          statut: "completed",
          date_reception: new Date().toISOString(),
        })
        .eq("id", distribution.id);

      if (error) throw error;

      toast.success("Distribution confirmée");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la confirmation");
    }
  };

  const handleSendReminder = async (payment) => {
    try {
      await supabase.from("notifications").insert([
        {
          user_id: payment.user_id,
          title: "Rappel de paiement",
          message: `Votre paiement pour la tontine "${payment.tontine?.name}" est en retard. Veuillez effectuer votre cotisation.`,
          type: "payment_reminder",
          priority: "high",
          send_sms: true,
          send_push: true,
          send_internal: true,
        },
      ]);

      toast.success("Rappel envoyé");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }

    if (amount > stats.commissions.pending) {
      toast.error("Montant supérieur à votre solde disponible");
      return;
    }

    setIsWithdrawing(true);
    try {
      const frais = amount * 0.03;
      const netAmount = amount - frais;

      const { error } = await supabase.from("withdrawals").insert([
        {
          user_id: user.id,
          amount: amount,
          frais: frais,
          amount_net: netAmount,
          phone_number: profile?.phone,
          operateur_nom: "Wave",
          statut: "pending",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success(
        `Demande de retrait de ${amount.toLocaleString()} FCFA envoyée (frais: ${frais.toLocaleString()} FCFA)`,
      );
      setIsWithdrawalModalOpen(false);
      setWithdrawalAmount("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la demande");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // =====================================================
  // COMPOSANTS D'AFFICHAGE
  // =====================================================

  const getStatusBadge = (status) => {
    const badges = {
      pending: { className: "bg-yellow-500 text-white", label: "EN ATTENTE" },
      validated: { className: "bg-green-500 text-white", label: "VALIDÉE" },
      rejected: { className: "bg-red-500 text-white", label: "REJETÉE" },
      paid: { className: "bg-green-500 text-white", label: "PAYÉ" },
      late: { className: "bg-orange-500 text-white", label: "EN RETARD" },
      overdue: { className: "bg-red-500 text-white", label: "TRÈS EN RETARD" },
      completed: { className: "bg-green-500 text-white", label: "COMPLÉTÉ" },
      pending_withdrawal: {
        className: "bg-yellow-500 text-white",
        label: "EN ATTENTE",
      },
      completed_withdrawal: {
        className: "bg-green-500 text-white",
        label: "COMPLÉTÉ",
      },
      rejected_withdrawal: {
        className: "bg-red-500 text-white",
        label: "REJETÉ",
      },
    };
    const badge = badges[status] || {
      className: "bg-gray-500 text-white",
      label: status?.toUpperCase() || "INCONNU",
    };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  // Données pour les graphiques
  const paymentStatusData = [
    { name: "Payés", value: stats.paiements.total - stats.paiements.late },
    { name: "En retard", value: stats.paiements.late },
  ];

  const commissionData = [
    { name: "Mois 1", commission: stats.commissions.lastMonth * 0.3 },
    { name: "Mois 2", commission: stats.commissions.lastMonth * 0.5 },
    { name: "Mois 3", commission: stats.commissions.lastMonth * 0.7 },
    { name: "Mois 4", commission: stats.commissions.lastMonth * 0.9 },
    { name: "Mois 5", commission: stats.commissions.lastMonth * 1.1 },
    { name: "Mois 6", commission: stats.commissions.lastMonth * 1.3 },
  ];

  const isEligibleForSalary = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth >= 5;
  };

  const nextSalaryDate = () => {
    const today = new Date();
    let next = new Date(today);
    if (today.getDate() >= 5) {
      next.setMonth(next.getMonth() + 1);
    }
    next.setDate(5);
    return next;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Secrétariat {pays?.name || "Pays"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Suivi opérationnel des tontines et gestion des commissions
            </p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
          </Button>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tontines actives"
            value={stats.tontines}
            icon={Activity}
          />
          <StatCard title="Utilisateurs" value={stats.users} icon={Users} />
          <StatCard
            title="Adhésions en attente"
            value={stats.adhesions.pending}
            icon={FileCheck}
          />
          <StatCard
            title="Paiements en retard"
            value={stats.paiements.late}
            icon={AlertTriangle}
          />
        </div>

        {/* Cartes financières */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Chiffre d'affaire total</p>
              <p className="text-3xl font-bold">
                {stats.chiffreAffaire.toLocaleString()} FCFA
              </p>
              <p className="text-xs opacity-75 mt-2">
                Toutes tontines confondues
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Commissions totales (10%)</p>
              <p className="text-3xl font-bold">
                {stats.commissions.total.toLocaleString()} FCFA
              </p>
              <p className="text-xs opacity-75 mt-2">
                À percevoir sur le CA total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Commissions disponibles</p>
              <p className="text-3xl font-bold">
                {stats.commissions.pending.toLocaleString()} FCFA
              </p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs opacity-75">Retrait possible</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  disabled={stats.commissions.pending === 0}
                >
                  <Wallet className="w-4 h-4 mr-1" /> Retirer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>État des Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Évolution des Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={commissionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value) => `${value.toLocaleString()} FCFA`}
                  />
                  <Bar
                    dataKey="commission"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Information salaire */}
        <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Commission mensuelle</p>
                  <p className="text-muted-foreground text-sm">
                    10% du chiffre d'affaire du pays
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isEligibleForSalary() ? (
                  <Badge className="bg-green-500 text-white px-4 py-2">
                    ✅ Commission disponible - Retirez via l'application
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500 text-white px-4 py-2">
                    ⏰ Prochaine disponibilité le{" "}
                    {nextSalaryDate().toLocaleDateString("fr-FR")}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs principales */}
        <Tabs defaultValue="adhesions" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8 bg-muted/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="adhesions" className="py-2">
              Adhésions
            </TabsTrigger>
            <TabsTrigger value="paiements" className="py-2">
              Paiements
            </TabsTrigger>
            <TabsTrigger value="distributions" className="py-2">
              Distributions
            </TabsTrigger>
            <TabsTrigger value="tontiniers" className="py-2">
              Tontiniers PRO
            </TabsTrigger>
            <TabsTrigger value="historique" className="py-2">
              Historique retraits
            </TabsTrigger>
          </TabsList>

          {/* Adhésions */}
          <TabsContent value="adhesions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="text-primary" /> Adhésions en attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidat</TableHead>
                      <TableHead>Tontine</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adhesions
                      .filter((a) => a.statut === "pending")
                      .map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.user?.full_name}
                          </TableCell>
                          <TableCell>{a.tontine?.name}</TableCell>
                          <TableCell>{a.telephone}</TableCell>
                          <TableCell>
                            {new Date(a.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() =>
                                handleValidateAdhesion(a, "approve")
                              }
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleValidateAdhesion(a, "reject")
                              }
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Refuser
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {adhesions.filter((a) => a.statut === "pending").length ===
                      0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Aucune adhésion en attente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paiements */}
          <TabsContent value="paiements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="text-primary" /> Paiements à valider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Tontine</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paiements.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.user?.full_name}
                        </TableCell>
                        <TableCell>{p.tontine?.name}</TableCell>
                        <TableCell>{p.montant?.toLocaleString()} CFA</TableCell>
                        <TableCell>{getStatusBadge(p.statut)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(p)}
                          >
                            <Bell className="w-4 h-4 mr-1" /> Rappel
                          </Button>
                          {p.statut !== "paid" && (
                            <Button
                              size="sm"
                              onClick={() => handleValidatePayment(p)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Valider
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {paiements.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Aucun paiement à valider
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distributions */}
          <TabsContent value="distributions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="text-primary" /> Distributions à confirmer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Tontine</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {d.user?.full_name}
                        </TableCell>
                        <TableCell>{d.tontine?.name}</TableCell>
                        <TableCell>{d.cycle_number}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmDistribution(d)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Confirmer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {distributions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Aucune distribution en attente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tontiniers PRO */}
          <TabsContent value="tontiniers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="text-primary" /> Tontiniers avec abonnement
                  PRO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Expire le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tontiniersPro.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.full_name}
                        </TableCell>
                        <TableCell>{t.email}</TableCell>
                        <TableCell>{t.phone}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">PRO</Badge>
                        </TableCell>
                        <TableCell>
                          {t.abonnement_expire_at
                            ? new Date(
                                t.abonnement_expire_at,
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {tontiniersPro.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Aucun tontinier PRO
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historique retraits */}
          <TabsContent value="historique">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="text-primary" /> Historique des retraits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant demandé</TableHead>
                      <TableHead>Frais (3%)</TableHead>
                      <TableHead>Net reçu</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalHistory.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          {new Date(w.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{w.amount?.toLocaleString()} FCFA</TableCell>
                        <TableCell>{w.frais?.toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          {w.amount_net?.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>{getStatusBadge(w.statut)}</TableCell>
                      </TableRow>
                    ))}
                    {withdrawalHistory.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Aucun historique de retrait
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de retrait */}
      <Dialog
        open={isWithdrawalModalOpen}
        onOpenChange={setIsWithdrawalModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demande de retrait</DialogTitle>
            <DialogDescription>
              Montant disponible: {stats.commissions.pending.toLocaleString()}{" "}
              FCFA
              <br />
              Frais de retrait: 3% du montant demandé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Montant à retirer (FCFA)</Label>
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                min="1000"
                max={stats.commissions.pending}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">Détails :</p>
              <div className="flex justify-between mt-2">
                <span>Montant demandé :</span>
                <span className="font-bold">
                  {parseFloat(withdrawalAmount || 0).toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frais (3%) :</span>
                <span className="font-bold">
                  {(parseFloat(withdrawalAmount || 0) * 0.03).toLocaleString()}{" "}
                  FCFA
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t mt-2">
                <span>Net à recevoir :</span>
                <span className="font-bold text-green-600">
                  {(parseFloat(withdrawalAmount || 0) * 0.97).toLocaleString()}{" "}
                  FCFA
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWithdrawalModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleWithdrawal}
              disabled={isWithdrawing || !withdrawalAmount}
            >
              {isWithdrawing ? "Traitement..." : "Demander le retrait"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecretairePaysDashboard;
