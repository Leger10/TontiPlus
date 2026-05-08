import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wallet, ShoppingBag, PiggyBank, CheckCircle, Info, Loader2, 
  Calendar, Users, TrendingUp, AlertCircle, Crown, Gift,   MapPin  ,HelpCircle 
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/BackButton.jsx';

const steps = [
  { id: 1, title: 'Infos de base' },
  { id: 2, title: 'Localisation' },
  { id: 3, title: 'Cotisation & Règles' },
  { id: 4, title: 'Validation' }
];

const TontineCreationPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userCountryId, setUserCountryId] = useState(null);
  const [totalTours, setTotalTours] = useState(0);

  // Form state - Infos de base
  const [name, setName] = useState('');
  const [type_tontine, setTypeTontine] = useState('rotative');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form state - Localisation
  const [localisation, setLocalisation] = useState('');
  const [ville, setVille] = useState('');
  const [quartier, setQuartier] = useState('');
  const [contact_organisateur, setContact] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Form state - Cotisation & Règles
  const [montant_cotisation, setMontantCotisation] = useState('');
  const [nombre_membres, setNombreMembres] = useState('');
  const [nombre_mains_max, setNombreMainsMax] = useState('');
  const [frequence, setFrequence] = useState('monthly');
  const [delai_rigueur, setDelaiRigueur] = useState('');
  const [paiement_anticipe, setPaiementAnticipe] = useState(false);
  const [recompense, setRecompense] = useState('');
  
  // Form state - Options
  const [possibilites_speciales, setPossibilites] = useState('');
  const [conditions, setConditions] = useState('');

  // Récupérer l'ID du pays de l'utilisateur
  useEffect(() => {
    const getUserCountry = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('pays_id')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.pays_id) {
          setUserCountryId(data.pays_id);
        }
      }
    };
    getUserCountry();
  }, [user]);

  // Calculer le nombre total de tours
  useEffect(() => {
    if (nombre_membres && nombre_mains_max) {
      const mainsParDefaut = parseInt(nombre_membres) * parseInt(nombre_mains_max);
      setTotalTours(mainsParDefaut);
    } else if (nombre_membres) {
      setTotalTours(parseInt(nombre_membres));
    } else {
      setTotalTours(0);
    }
  }, [nombre_membres, nombre_mains_max]);

  const handleNext = () => {
    if (step === 1 && !name) {
      toast.error('Le nom est obligatoire.');
      return;
    }
    if (step === 3) {
      if (!montant_cotisation || parseFloat(montant_cotisation) < 0.01) {
        toast.error('Montant de cotisation invalide.');
        return;
      }
      if (!nombre_membres || parseInt(nombre_membres) < 2) {
        toast.error('Le nombre de membres doit être au moins 2.');
        return;
      }
      if (!delai_rigueur || parseInt(delai_rigueur) < 1) {
        toast.error('Le délai de rigueur doit être au moins 1 jour.');
        return;
      }
    }
    setStep(s => Math.min(4, s + 1));
  };

  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tontines_images')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('tontines_images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!name || !montant_cotisation || !delai_rigueur || !nombre_membres) {
      toast.error('Champs obligatoires manquants.');
      return;
    }
    
    if (!userCountryId) {
      toast.error("Votre profil n'a pas de pays associé.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload image si présente
      const imageUrl = image ? await uploadImage(image) : null;
      
      // Calculer le nombre total de tours (cycle_total)
      let cycle_total = parseInt(nombre_membres);
      if (nombre_mains_max && parseInt(nombre_mains_max) > 1) {
        cycle_total = parseInt(nombre_membres) * parseInt(nombre_mains_max);
      }
      
      // Créer la tontine
      const { data: newTontine, error: tError } = await supabase
        .from('tontines')
        .insert([{
          name,
          description,
          type_tontine,
          montant_cotisation: parseFloat(montant_cotisation),
          nombre_membres: parseInt(nombre_membres),
          nombre_mains_max: nombre_mains_max ? parseInt(nombre_mains_max) : 1,
          frequence: frequence,
          statut: 'active',
          localisation: localisation || null,
          ville: ville || null,
          quartier: quartier || null,
          contact_organisateur: contact_organisateur || null,
          whatsapp: whatsapp || null,
          image_url: imageUrl,
          possibilites_speciales: possibilites_speciales || null,
          delai_rigueur: parseInt(delai_rigueur),
          paiement_anticipe: paiement_anticipe,
          cycle_actuel: 1,
          cycle_total: cycle_total,
          montant_total_collecte: 0,
          organisateur_id: user.id,
          pays_id: userCountryId
        }])
        .select()
        .single();
      
      if (tError) throw tError;
      
      // Créer une notification pour l'organisateur
      await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: '🎉 Tontine créée avec succès !',
          message: `Votre tontine "${name}" est maintenant active. ${cycle_total} tours seront organisés. Les membres peuvent adhérer via l'application.`,
          type: 'adhesion_validated',
          send_internal: true,
          send_push: true
        }]);
      
      toast.success(`Tontine créée avec succès ! ${cycle_total} tours programmés.`);
      navigate(`/tontinier/dashboard/${newTontine.id}`);
      
    } catch (error) {
      console.error(error);
      toast.error('Échec de la création. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (typeValue) => {
    switch (typeValue) {
      case 'rotative': return <Wallet className="w-8 h-8 mb-2" />;
      case 'epargne': return <PiggyBank className="w-8 h-8 mb-2" />;
      default: return <ShoppingBag className="w-8 h-8 mb-2" />;
    }
  };

  const getTypeLabel = (typeValue) => {
    switch (typeValue) {
      case 'rotative': return 'Tontine Rotative (Chacun son tour)';
      case 'epargne': return "Tontine d'Épargne (Fonds commun)";
      default: return 'Tontine Mixte';
    }
  };

  const getFrequenceLabel = (freqValue) => {
    switch (freqValue) {
      case 'daily': return 'Quotidienne';
      case 'weekly': return 'Hebdomadaire';
      case 'biweekly': return 'Bi-mensuelle (15 jours)';
      case 'monthly': return 'Mensuelle';
      default: return 'Mensuelle';
    }
  };

  return (
    <>
      <Helmet><title>Créer une tontine - BonPlan</title></Helmet>
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <div className="pt-8 pb-4 px-4 bg-card sticky top-0 z-10 border-b shadow-premium">
          <div className="max-w-2xl mx-auto flex items-center">
            <BackButton className="-ml-2" />
            <h1 className="text-xl font-extrabold ml-2 text-foreground">Créer une tontine</h1>
          </div>
          <div className="max-w-2xl mx-auto mt-6">
            <div className="flex gap-2 mb-2">
              {steps.map(s => (
                <div key={s.id} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${step >= s.id ? 'bg-primary shadow-sm' : 'bg-muted'}`} />
              ))}
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Étape {step}: <span className="text-foreground">{steps[step-1].title}</span>
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border shadow-premium rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* ÉTAPE 1: INFOS DE BASE */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-base font-semibold text-foreground">Type de Tontine</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'rotative', icon: Wallet, label: 'Rotative', color: 'text-primary', desc: 'Chacun son tour' },
                              { id: 'mixte', icon: Gift, label: 'Mixte', color: 'text-secondary', desc: 'Plusieurs mains' },
                              { id: 'epargne', icon: PiggyBank, label: 'Épargne', color: 'text-accent', desc: 'Fonds commun' }
                            ].map(t => (
                              <button
                                key={t.id}
                                onClick={() => setTypeTontine(t.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all shadow-sm ${
                                  type_tontine === t.id ? `border-primary bg-primary/5 ${t.color}` : 'border-transparent bg-background text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                <t.icon className={`w-8 h-8 mb-2 ${type_tontine === t.id ? t.color : 'opacity-70'}`} />
                                <span className="text-xs font-bold uppercase tracking-wide">{t.label}</span>
                                <span className="text-[10px] text-muted-foreground mt-1">{t.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">
                            Nom de la tontine <span className="text-destructive">*</span>
                          </Label>
                          <Input 
                            placeholder="Ex: Tontine Habits Premium 2026" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="bg-background border h-12 rounded-xl text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Description</Label>
                          <Textarea 
                            placeholder="Décrivez l'objectif, le lot à gagner, etc..." 
                            value={description} 
                            onChange={e => setDescription(e.target.value)}
                            className="bg-background border resize-none rounded-xl text-foreground" 
                            rows={4}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Image du lot (Optionnel)</Label>
                          <div className="flex items-center gap-4">
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageChange}
                              className="bg-background border rounded-xl text-foreground flex-1"
                            />
                            {imagePreview && (
                              <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">Photo de l'habit ou du lot à gagner</p>
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 2: LOCALISATION */}
                    {step === 2 && (
                      <div className="space-y-6">
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                          <div className="flex items-center gap-2 text-primary mb-2">
                            <MapPin className="w-5 h-5" />
                            <span className="font-semibold">Lieu de livraison</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Indiquez où le lot sera remis au gagnant</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Ville</Label>
                          <Input 
                            placeholder="Ex: Ouagadougou" 
                            value={ville} 
                            onChange={e => setVille(e.target.value)}
                            className="bg-background border h-12 rounded-xl text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Quartier / Secteur</Label>
                          <Input 
                            placeholder="Ex: Zone résidentielle, Secteur 4" 
                            value={quartier} 
                            onChange={e => setQuartier(e.target.value)}
                            className="bg-background border h-12 rounded-xl text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Contact Organisateur</Label>
                          <Input 
                            type="tel" 
                            placeholder="Numéro d'appel" 
                            value={contact_organisateur} 
                            onChange={e => setContact(e.target.value)}
                            className="bg-background border h-12 rounded-xl text-foreground"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Numéro WhatsApp</Label>
                          <Input 
                            type="tel" 
                            placeholder="Pour le groupe de discussion" 
                            value={whatsapp} 
                            onChange={e => setWhatsapp(e.target.value)}
                            className="bg-background border h-12 rounded-xl text-foreground"
                          />
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 3: COTISATION & RÈGLES */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl space-y-4">
                          <h3 className="font-bold text-primary flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" /> Paramètres financiers
                          </h3>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-bold">Montant de Cotisation (CFA) <span className="text-destructive">*</span></Label>
                            <Input 
                              type="number" 
                              placeholder="Ex: 5000" 
                              min="100" 
                              step="100" 
                              value={montant_cotisation} 
                              onChange={e => setMontantCotisation(e.target.value)}
                              className="bg-card border h-12 rounded-xl"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-bold">Nombre de Membres <span className="text-destructive">*</span></Label>
                            <Input 
                              type="number" 
                              placeholder="Ex: 1000" 
                              min="2" 
                              value={nombre_membres} 
                              onChange={e => setNombreMembres(e.target.value)}
                              className="bg-card border h-12 rounded-xl"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-bold">Nombre de mains max par personne</Label>
                            <Input 
                              type="number" 
                              placeholder="Ex: 5 (5 parts max)" 
                              min="1" 
                              value={nombre_mains_max} 
                              onChange={e => setNombreMainsMax(e.target.value)}
                              className="bg-card border h-12 rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">
                              Une personne peut prendre plusieurs parts. 2 main = 2 cotisation = 2 Prise
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-bold">Fréquence des cotisations</Label>
                            <select 
                              value={frequence} 
                              onChange={e => setFrequence(e.target.value)}
                              className="w-full bg-card border rounded-xl h-12 px-4"
                            >
                              <option value="daily">Quotidienne</option>
                              <option value="weekly">Hebdomadaire</option>
                              <option value="biweekly">Bi-mensuelle (15 jours)</option>
                              <option value="monthly">Mensuelle</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5" /> Délais et Règles
                          </h4>
                          
                          <div className="space-y-2">
                            <Label className="text-sm">Délai de rigueur (jours) <span className="text-destructive">*</span></Label>
                            <Input 
                              type="number" 
                              placeholder="Ex: 5" 
                              min="1" 
                              value={delai_rigueur} 
                              onChange={e => setDelaiRigueur(e.target.value)}
                              className="bg-background border h-12 rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">
                              Nombre de jours de tolérance après la date limite de paiement
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                              <Label className="font-semibold">Paiement anticipé</Label>
                              <p className="text-xs text-muted-foreground">Permettre de payer plusieurs cycles d'avance</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={paiement_anticipe} 
                              onChange={e => setPaiementAnticipe(e.target.checked)}
                              className="w-5 h-5 rounded accent-primary"
                            />
                          </div>
                        </div>

                        {/* Information sur le nombre de tours */}
                        {totalTours > 0 && (
                          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                              <HelpCircle className="w-5 h-5" />
                              <span className="font-semibold">Configuration automatique</span>
                            </div>
                            <p className="text-sm">
                              <strong>{totalTours} tours</strong> seront organisés 
                              {nombre_mains_max && parseInt(nombre_mains_max) > 1 
                                ? ` (${nombre_membres} membres × ${nombre_mains_max} mains max)` 
                                : ` (1 tour par membre)`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Total collecté par cycle: {(parseFloat(montant_cotisation) * totalTours).toLocaleString()} FCFA
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ÉTAPE 4: VALIDATION */}
                    {step === 4 && (
                      <div className="space-y-6">
                        <div className="flex gap-3 bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm">
                          <AlertCircle className="w-6 h-6 shrink-0 text-yellow-600" />
                          <p className="text-yellow-800">
                            Une fois créée, informez vos membres que tous les paiements s'effectuent via le Wallet BonPlan.
                            Les tours seront automatiquement programmés selon le nombre de parts.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-base font-semibold text-foreground">Règles spéciales</Label>
                          <Textarea 
                            placeholder="Ex: Un membre peut prendre jusqu'à 5 mains. Chaque main donne droit à une prise."
                            value={possibilites_speciales} 
                            onChange={e => setPossibilites(e.target.value)}
                            className="bg-background border resize-none rounded-xl text-base text-foreground" 
                            rows={3}
                          />
                        </div>
                        
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm rounded-2xl">
                          <CardContent className="p-5 text-sm">
                            <div className="flex items-center gap-2 font-bold text-green-700 text-lg mb-4">
                              <CheckCircle className="w-6 h-6" /> Prêt à lancer !
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-muted-foreground text-xs">Nom</p>
                                <p className="font-semibold">{name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Type</p>
                                <p className="font-semibold">{getTypeLabel(type_tontine)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Cotisation</p>
                                <p className="font-semibold">{montant_cotisation ? `${parseFloat(montant_cotisation).toLocaleString()} FCFA` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Membres</p>
                                <p className="font-semibold">{nombre_membres || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Mains max/pers</p>
                                <p className="font-semibold">{nombre_mains_max || '1'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Fréquence</p>
                                <p className="font-semibold">{getFrequenceLabel(frequence)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Délai rigueur</p>
                                <p className="font-semibold">{delai_rigueur ? `${delai_rigueur} jours` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Tours programmés</p>
                                <p className="font-semibold text-primary">{totalTours}</p>
                              </div>
                            </div>
                            {ville && (
                              <p className="mt-3 pt-2 border-t border-green-200">
                                <span className="text-muted-foreground text-xs">Lieu de livraison :</span>
                                <span className="ml-2 font-medium">{ville} {quartier ? `- ${quartier}` : ''}</span>
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Boutons de navigation */}
        <div className="p-4 bg-card border-t mt-auto shadow-sm">
          <div className="max-w-2xl mx-auto flex gap-4">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1 h-14 rounded-2xl text-base font-bold shadow-sm">
                Retour
              </Button>
            )}
            {step < 4 ? (
              <Button 
                onClick={handleNext} 
                className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold shadow-md"
              >
                Continuer
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 text-white text-base font-bold shadow-md"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</> : '🎉 Publier ma tontine'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TontineCreationPage;