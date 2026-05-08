import { supabase } from '../lib/supabase';

const walletService = {
  // Récupérer le wallet d'un utilisateur
  async getWallet(userId) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Wallet n'existe pas, le créer
      return this.createWallet(userId);
    }
    
    if (error) throw error;
    return data;
  },

  // Créer un wallet
  async createWallet(userId) {
    const { data, error } = await supabase
      .from('wallets')
      .insert([{ user_id: userId, balance: 0 }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créditer un wallet
  async creditWallet(userId, amount, type, reference = null) {
    // Commencer une transaction
    const { data: wallet, error: getError } = await this.getWallet(userId);
    if (getError) throw getError;
    
    const newBalance = wallet.balance + amount;
    
    // Mettre à jour le wallet
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Enregistrer la transaction
    const { error: transError } = await supabase
      .from('transactions_wallet')
      .insert([{
        user_id: userId,
        montant: amount,
        type: type,
        reference: reference,
        statut: 'completed'
      }]);
    
    if (transError) console.error('Erreur enregistrement transaction:', transError);
    
    return updatedWallet;
  },

  // Débiter un wallet
  async debitWallet(userId, amount, type, reference = null) {
    const { data: wallet, error: getError } = await this.getWallet(userId);
    if (getError) throw getError;
    
    if (wallet.balance < amount) {
      throw new Error('Solde insuffisant');
    }
    
    const newBalance = wallet.balance - amount;
    
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    const { error: transError } = await supabase
      .from('transactions_wallet')
      .insert([{
        user_id: userId,
        montant: -amount,
        type: type,
        reference: reference,
        statut: 'completed'
      }]);
    
    if (transError) console.error('Erreur enregistrement transaction:', transError);
    
    return updatedWallet;
  },

  // Récupérer l'historique des transactions
  async getTransactionHistory(userId, limit = 50) {
    const { data, error } = await supabase
      .from('transactions_wallet')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};

export default walletService;