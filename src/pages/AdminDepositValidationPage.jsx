import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Check, X, ShieldAlert, FileImage, Loader2 } from 'lucide-react';
import BackButton from '@/components/BackButton.jsx';

const AdminDepositValidationPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');

  const fetchPendingDeposits = async () => {
    setLoading(true);
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
      console.log('Dépôts récupérés:', data?.length || 0);
      setDeposits(data || []);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast.error("Erreur lors de la récupération des dépôts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
    
    // Abonnement en temps réel pour les nouveaux dépôts
    const subscription = supabase
      .channel('deposits_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'deposits', filter: 'statut=eq.pending' },
        () => { fetchPendingDeposits(); }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    const { data } = supabase.storage
      .from('payment_screenshots')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  // Fonction utilitaire pour créer des notifications de manière sécurisée
  const createNotification = async (userId, title, message, type) => {
    try {
      // Types valides pour la table notifications
      const validTypes = [
        'adhesion_validated', 
        'adhesion_rejected', 
        'payment_reminder', 
        'tour_notification',
        'system_notification',
        'moderation_alert',
        'wallet_credit',
        'wallet_debit'
      ];
      
      // Utiliser system_notification comme fallback
      const safeType = validTypes.includes(type) ? type : 'system_notification';
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: title,
          message: message,
          type: safeType,
          is_read: false,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.warn('Erreur notification:', error.message);
      }
      return true;
    } catch (error) {
      console.warn('Erreur création notification:', error);
      return false;
    }
  };

  const handleValidate = async (deposit) => {
  if (!window.confirm(`Confirmer le rechargement de ${deposit.amount?.toLocaleString()} FCFA pour ${deposit.user?.full_name || deposit.user?.email} ?`)) return;
  
  setProcessing(true);
  setProcessingId(deposit.id);
  
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    console.log('1️⃣ Mise à jour du dépôt...');
    // 1. Mettre à jour le statut du dépôt
    const { error: depositError } = await supabase
      .from('deposits')
      .update({ 
        statut: 'validated',
        validated_at: new Date().toISOString(),
        validated_by: currentUser?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', deposit.id);
    
    if (depositError) throw depositError;
    console.log('✅ Dépôt mis à jour');
    
    console.log('2️⃣ Mise à jour du wallet...');
    // 2. Mettre à jour le wallet de l'utilisateur
    const { data: wallet, error: walletFetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', deposit.user_id)
      .maybeSingle();
    
    console.log('Wallet existant:', wallet);
    
    if (walletFetchError && walletFetchError.code !== 'PGRST116') {
      throw walletFetchError;
    }
    
    let walletUpdated = false;
    
    if (wallet) {
      // Wallet existe, mettre à jour
      const newBalance = (parseFloat(wallet.balance) || 0) + parseFloat(deposit.amount);
      console.log(`Ancien solde: ${wallet.balance}, Nouveau solde: ${newBalance}`);
      
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', deposit.user_id);
      
      if (walletUpdateError) throw walletUpdateError;
      walletUpdated = true;
      console.log('✅ Wallet mis à jour');
    } else {
      // Wallet n'existe pas, le créer
      console.log('Création du wallet...');
      const { error: walletCreateError } = await supabase
        .from('wallets')
        .insert({ 
          user_id: deposit.user_id, 
          balance: parseFloat(deposit.amount),
          commissions_total: 0,
          pending_withdrawal: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (walletCreateError) throw walletCreateError;
      walletUpdated = true;
      console.log('✅ Wallet créé');
    }
    
    console.log('3️⃣ Création de la transaction...');
    // 3. Créer une transaction
    const { error: transactionError } = await supabase
      .from('transactions_wallet')
      .insert({
        user_id: deposit.user_id,
        montant: parseFloat(deposit.amount),
        type: 'depot',
        methode: deposit.payment_method,
        reference: deposit.transaction_id,
        statut: 'completed',
        description: `Dépôt validé via ${deposit.payment_method}`,
        created_at: new Date().toISOString()
      });
    
    if (transactionError) {
      console.error('Erreur transaction:', transactionError);
    } else {
      console.log('✅ Transaction créée');
    }
    
    console.log('4️⃣ Envoi de la notification...');
    // 4. Notification (optionnelle)
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: deposit.user_id,
          title: '✅ Dépôt validé',
          message: `Votre dépôt de ${deposit.amount.toLocaleString()} FCFA a été validé.`,
          type: 'system_notification',
          is_read: false,
          created_at: new Date().toISOString()
        });
      console.log('✅ Notification envoyée');
    } catch (notifError) {
      console.warn('Notification ignorée:', notifError.message);
    }
    
    console.log('5️⃣ Rafraîchissement...');
    toast.success(`✅ Dépôt validé ! ${deposit.amount.toLocaleString()} FCFA crédités.`);
    
    // Recharger la liste
    await fetchPendingDeposits();
    
    // Rediriger ou rester sur la page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erreur validation:', error);
    toast.error(error.message || "Erreur lors de la validation du dépôt.");
  } finally {
    setProcessing(false);
    setProcessingId(null);
  }
};

  const openRejectModal = (deposit) => {
    setSelectedDeposit(deposit);
    setMotifRejet('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!motifRejet.trim()) {
      toast.error("Le motif de rejet est obligatoire");
      return;
    }
    
    setProcessing(true);
    try {
      // Mettre à jour le statut du dépôt
      const { error } = await supabase
        .from('deposits')
        .update({ 
          statut: 'rejected',
          motif_rejet: motifRejet,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDeposit.id);
      
      if (error) throw error;
      
      // Créer une notification de rejet (version sécurisée)
      await createNotification(
        selectedDeposit.user_id,
        '❌ Dépôt rejeté',
        `Votre dépôt de ${selectedDeposit.amount?.toLocaleString()} FCFA a été rejeté. Motif: ${motifRejet}`,
        'system_notification'
      );
      
      toast.success("Dépôt rejeté avec succès.");
      setRejectModalOpen(false);
      fetchPendingDeposits();
    } catch (error) {
      console.error('Erreur rejet:', error);
      toast.error("Erreur lors du rejet.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Helmet><title>Validation Dépôts - Administration</title></Helmet>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6"><BackButton /></div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-500/10 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Validation des Dépôts</h1>
            <p className="text-muted-foreground mt-1">Gérez les demandes de rechargement du Wallet.</p>
          </div>
        </div>

        <Card className="shadow-premium-sm border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Utilisateur</th>
                  <th className="px-6 py-4 font-semibold">Opérateur & ID</th>
                  <th className="px-6 py-4 font-semibold">Montant</th>
                  <th className="px-6 py-4 font-semibold text-center">Reçu</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded mx-auto" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-40 ml-auto" /></td>
                    </tr>
                  ))
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Check className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium">Aucune demande en attente</p>
                      <p className="text-sm text-muted-foreground mt-1">Tous les dépôts ont été traités</p>
                    </td>
                  </tr>
                ) : (
                  deposits.map(deposit => (
                    <tr key={deposit.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(deposit.created_at).toLocaleDateString('fr-FR')}
                        <div className="text-xs text-muted-foreground">{new Date(deposit.created_at).toLocaleTimeString('fr-FR')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{deposit.user?.full_name || 'Inconnu'}</div>
                        <div className="text-xs text-muted-foreground">{deposit.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="mb-1 bg-background">{deposit.payment_method}</Badge>
                        <div className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit border border-border mt-1">
                          {deposit.transaction_id}
                        </div>
                       </td>
                      <td className="px-6 py-4 font-bold text-base whitespace-nowrap">
                        {deposit.amount?.toLocaleString()} FCFA
                       </td>
                      <td className="px-6 py-4 text-center">
                        {deposit.image_url ? (
                          <Button variant="outline" size="sm" asChild className="gap-2 bg-background">
                            <a href={getImageUrl(deposit.image_url)} target="_blank" rel="noopener noreferrer">
                              <FileImage className="w-4 h-4 text-primary" /> Voir
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aucun reçu</span>
                        )}
                       </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="destructive" size="sm" 
                            onClick={() => openRejectModal(deposit)} 
                            disabled={processing && processingId === deposit.id}
                            className="bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border border-red-200"
                          >
                            <X className="w-4 h-4 mr-1" /> Rejeter
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleValidate(deposit)} 
                            disabled={processing && processingId === deposit.id}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            {processing && processingId === deposit.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Valider
                          </Button>
                        </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-card border-border">
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
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                rows={4}
                className="bg-background border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={processing}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDepositValidationPage;