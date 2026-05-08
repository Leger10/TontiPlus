import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Upload, ArrowRight, ShieldCheck, Info, ExternalLink, Loader2 } from 'lucide-react';
import BackButton from '@/components/BackButton.jsx';

const operatorDetails = {
  'Wave': { number: '54 32 92 99', name: 'SOCIÉTÉ TONTINE-PRO' },
  'Orange Money': { number: '54 32 92 99', name: 'SOCIÉTÉ TONTINE-PRO' },
  'Moov': { number: '73 79 09 78', name: 'SOCIÉTÉ TONTINE-PRO' },
  'TelecelMoney': { number: '73 79 09 78', name: 'SOCIÉTÉ TONTINE-PRO' },
  'PayPal': { link: 'https://paypal.me/kibobo', name: 'Kibobo (PayPal)' }
};

const DepositFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    operateur: 'Wave',
    montant: '',
    transaction_id: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const isPayPal = formData.operateur === 'PayPal';
  const currentMerchant = operatorDetails[formData.operateur];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié !");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) {
        toast.error("Fichier trop volumineux (Max 5MB)");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image");
        return;
      }
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

// Dans DepositFormPage.jsx, remplacez handleSubmit par cette version debug
const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('🔍 FORM SUBMIT START');
  console.log('User:', user?.id);
  console.log('Form data:', formData);
  console.log('File:', receiptFile?.name);
  
  // Validations
  if (!user) {
    toast.error("Vous devez être connecté");
    console.log('❌ No user');
    return;
  }
  
  const montantValue = parseFloat(formData.montant);
  if (isNaN(montantValue) || montantValue <= 0) {
    toast.error("Montant invalide");
    console.log('❌ Invalid amount');
    return;
  }
  
  if (!isPayPal && !formData.transaction_id?.trim()) {
    toast.error("ID de transaction requis");
    console.log('❌ No transaction ID');
    return;
  }
  
  if (!receiptFile) {
    toast.error("Reçu requis");
    console.log('❌ No file');
    return;
  }

  setSubmitting(true);
  
  try {
    // Upload
    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    console.log('📤 Uploading to:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('payment_screenshots')
      .upload(fileName, receiptFile);
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      toast.error(`Upload: ${uploadError.message}`);
      setSubmitting(false);
      return;
    }
    console.log('✅ Upload success');
    
    const { data: urlData } = supabase.storage
      .from('payment_screenshots')
      .getPublicUrl(fileName);
    console.log('📷 Image URL:', urlData.publicUrl);
    
    // Insertion
    const depositData = {
      user_id: user.id,
      payment_method: formData.operateur,
      amount: montantValue,
      transaction_id: isPayPal ? `PAYPAL-${Date.now()}` : formData.transaction_id.trim(),
      image_url: urlData.publicUrl,
      statut: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('📝 Deposit data:', depositData);
    
    const { error: insertError } = await supabase
      .from('deposits')
      .insert([depositData]);
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      toast.error(`Insert: ${insertError.message}`);
      setSubmitting(false);
      return;
    }
    
    console.log('✅ All good!');
    toast.success("Demande soumise !");
    navigate('/wallet');
    
  } catch (error) {
    console.error('❌ Catch error:', error);
    toast.error("Erreur: " + error.message);
    setSubmitting(false);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <>
      <Helmet><title>Recharger Mon Compte - BonPlan</title></Helmet>
      
      <div className="relative min-h-[30vh] flex items-center justify-center pt-24 pb-16 bg-background">
        <div className="absolute top-4 left-4 z-20"><BackButton /></div>
        <div className="text-center max-w-3xl px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground">Recharger Mon Compte</h1>
          <p className="text-lg text-muted-foreground">Transférez les fonds puis soumettez la preuve pour créditer votre wallet.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Colonne instructions */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-4">Instructions</h3>
                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                      <li>Sélectionnez votre opérateur</li>
                      <li>Envoyez l'argent au numéro ci-dessous</li>
                      <li>Capturez l'écran du SMS de confirmation</li>
                      <li>Remplissez le formulaire avec l'ID de transaction</li>
                      <li>Soumettez la capture d'écran</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-none">
              <CardContent className="p-6">
                <p className="text-sm font-bold text-white/70 uppercase mb-4">Plateforme BonPlan</p>
                {!isPayPal ? (
                  <>
                    <div>
                      <p className="text-sm text-white/80 mb-2">Numéro de transfert</p>
                      <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                        <span className="font-mono text-2xl font-bold">{currentMerchant.number}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(currentMerchant.number)} className="text-white hover:bg-white/20">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-white/80 mb-2">Nom du destinataire</p>
                      <div className="bg-black/20 p-3 rounded-lg">
                        <span className="font-bold">{currentMerchant.name}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-white/80 mb-2">Lien de paiement PayPal</p>
                    <div className="bg-black/20 p-3 rounded-lg break-all">
                      <a href={currentMerchant.link} target="_blank" rel="noopener noreferrer" className="underline">
                        {currentMerchant.link}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne formulaire */}
          <div className="lg:col-span-7">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label className="text-base font-bold">1. Opérateur</Label>
                    <Select value={formData.operateur} onValueChange={(val) => setFormData({...formData, operateur: val})}>
                      <SelectTrigger className="h-12 mt-2">
                        <SelectValue placeholder="Sélectionnez un opérateur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wave">Wave</SelectItem>
                        <SelectItem value="Orange Money">Orange Money</SelectItem>
                        <SelectItem value="Moov">Moov</SelectItem>
                        <SelectItem value="TelecelMoney">TelecelMoney</SelectItem>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-bold">2. Montant (FCFA)</Label>
                      <Input 
                        type="number" 
                        min="100" 
                        step="100"
                        placeholder="Ex: 10000" 
                        className="h-12 mt-2 text-lg"
                        value={formData.montant} 
                        onChange={(e) => setFormData({...formData, montant: e.target.value})} 
                        required
                      />
                    </div>
                    {!isPayPal && (
                      <div>
                        <Label className="text-base font-bold">3. ID de Transaction</Label>
                        <Input 
                          type="text" 
                          placeholder="Ex: CI240506.1452..." 
                          className="h-12 mt-2 font-mono"
                          value={formData.transaction_id} 
                          onChange={(e) => setFormData({...formData, transaction_id: e.target.value})} 
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-bold">{isPayPal ? '3.' : '4.'} Capture d'écran</Label>
                    <div className="border-2 border-dashed border-input bg-background rounded-xl p-6 text-center hover:bg-muted/30 transition-colors mt-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="file-upload"
                        onChange={handleFileChange} 
                        required={!isPayPal}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        {previewUrl ? (
                          <div className="flex flex-col items-center">
                            <img src={previewUrl} alt="Aperçu" className="w-32 h-32 rounded-lg object-cover mb-3 border" />
                            <p className="text-sm text-green-600 font-medium">✓ Reçu chargé</p>
                            <p className="text-xs text-muted-foreground mt-1">Cliquez pour changer</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                              <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="font-medium">Cliquez pour sélectionner une image</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : isPayPal ? (
                      <>
                        Payer via PayPal <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Soumettre ma demande <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default DepositFormPage;