// src/pages/ContributionPaymentPage.jsx (Version Supabase)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';
import { CreditCard, Upload } from 'lucide-react';

const ContributionPaymentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('paiements')
        .select('*, tontine:tontine_id(name)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment:', error);
      toast.error('Paiement introuvable');
      navigate('/my-contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error('Veuillez sélectionner un moyen de paiement');
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = null;
      
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `payments/${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment_screenshots')
          .upload(fileName, screenshot);
        
        if (!uploadError) {
          screenshotUrl = fileName;
        } else {
          console.error('Upload error:', uploadError);
        }
      }
      
      const { error } = await supabase
        .from('paiements')
        .update({
          statut: 'pending',
          operateur_nom: paymentMethod,
          transaction_id: transactionId,
          capture_ecran_url: screenshotUrl,
          is_offline: true,
          date_validation_tontinier: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Paiement enregistré, en attente de validation');
      navigate('/my-contributions');
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!payment) {
    return <div className="p-8 text-center">Paiement introuvable</div>;
  }

  return (
    <>
      <Helmet><title>Paiement - BonPlan Tontine</title></Helmet>
      <div className="min-h-screen bg-muted/20 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <BackButton />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Paiement pour {payment.tontine?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Montant à payer</p>
                  <p className="text-2xl font-bold">{payment.montant?.toLocaleString()} FCFA</p>
                  <p className="text-xs text-muted-foreground">Cycle n°{payment.cycle_number}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Moyen de paiement</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez votre opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orange Money">Orange Money</SelectItem>
                      <SelectItem value="Moov Money">Moov Money</SelectItem>
                      <SelectItem value="Wave">Wave</SelectItem>
                      <SelectItem value="Bank">Virement Bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Numéro de transaction / Référence</Label>
                  <Input
                    placeholder="Ex: ORANGE_123456789"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preuve de paiement (capture d'écran)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: JPG, PNG. Max 5MB.
                  </p>
                </div>
                
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Traitement...' : 'Confirmer le paiement'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ContributionPaymentPage;