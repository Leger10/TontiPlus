import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowUpRight, ArrowDownRight, ArrowRightLeft, History, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import BackButton from '@/components/BackButton.jsx';
import { toast } from 'sonner';

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return;
      
      try {
        // Récupérer le wallet
        let { data: userWallet, error: walletError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletError) throw walletError;
        
        if (!userWallet) {
          // Créer un wallet si inexistant
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert([{ user_id: user.id, balance: 0 }])
            .select()
            .single();
          
          if (createError) throw createError;
          userWallet = newWallet;
        }
        
        setWallet(userWallet);

        // Récupérer les transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions_wallet')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (txError) throw txError;
        setTransactions(txData || []);
        
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        toast.error("Erreur lors du chargement du portefeuille");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white border-transparent gap-1"><CheckCircle2 className="w-3 h-3" /> Complété</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white border-transparent gap-1"><Clock className="w-3 h-3" /> En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white border-transparent gap-1"><XCircle className="w-3 h-3" /> Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTxIcon = (type) => {
    switch (type) {
      case 'depot':
      case 'commission':
        return <ArrowDownRight className="w-5 h-5 text-green-500" />;
      case 'retrait':
      case 'paiement_cotisation':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      default:
        return <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTxColor = (type) => {
    switch (type) {
      case 'depot':
      case 'commission':
        return 'text-green-500';
      case 'retrait':
      case 'paiement_cotisation':
        return 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

  const getTxPrefix = (type) => {
    switch (type) {
      case 'depot':
      case 'commission':
        return '+';
      case 'retrait':
      case 'paiement_cotisation':
        return '-';
      default:
        return '';
    }
  };

  const getTxLabel = (type) => {
    switch (type) {
      case 'depot': return 'Dépôt / Recharge';
      case 'retrait': return 'Retrait';
      case 'paiement_cotisation': return 'Paiement Cotisation';
      case 'commission': return 'Commission reçue';
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      <Helmet><title>Mon Portefeuille - BonPlan Tontine</title></Helmet>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6"><BackButton /></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-gradient-to-r from-purple-600 to-purple-800 border-none rounded-[2rem] overflow-hidden relative shadow-xl">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-3 bg-black/20 rounded-xl backdrop-blur-sm border border-white/10">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-bold tracking-widest uppercase text-white/70">Solde Disponible</span>
                </div>
                
                <div className="mb-8">
                  {loading ? (
                    <Skeleton className="h-12 w-48 bg-white/20 rounded-lg" />
                  ) : (
                    <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-md tracking-tight">
                      {wallet?.balance?.toLocaleString() || 0} <span className="text-2xl font-bold text-white/80">FCFA</span>
                    </h2>
                  )}
                </div>
                
                <div className="flex items-center gap-2 pt-6 border-t border-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                    <span className="text-sm font-bold text-white">BP</span>
                  </div>
                  <p className="text-sm font-medium text-white/80">BonPlan Tontine Wallet</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-14 font-bold shadow-md rounded-xl bg-purple-600 hover:bg-purple-700 text-white" asChild>
                <Link to="/wallet/deposit">
                  <ArrowDownRight className="w-5 h-5 mr-2" /> Recharger
                </Link>
              </Button>
              <Button variant="outline" className="h-14 font-bold rounded-xl bg-card border-border shadow-sm hover:bg-muted" asChild>
                <Link to="/wallet/history">
                  <History className="w-5 h-5 mr-2" /> Demandes
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" /> Transactions Récentes
                </h3>
              </div>
              <div className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted" />)}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-bold mb-2 text-foreground">Aucune transaction</h4>
                    <p className="text-muted-foreground font-medium text-sm">Votre historique de transactions est vide.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-muted rounded-xl border border-border">
                            {getTxIcon(tx.type)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{getTxLabel(tx.type)}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              {formatDate(tx.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`font-black text-lg ${getTxColor(tx.type)}`}>
                            {getTxPrefix(tx.type)}{Math.abs(tx.montant).toLocaleString()} FCFA
                          </span>
                          {getStatusBadge(tx.statut)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletPage;