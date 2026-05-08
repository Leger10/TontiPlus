import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { generateEngagementPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import BackButton from '@/components/BackButton.jsx';

const TontineAdhesionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nom_complet: profile?.full_name || '',
    telephone: profile?.phone || '',
    email: user?.email || '',
    adresse: ''
  });
  const [identityFile, setIdentityFile] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [engagementBlob, setEngagementBlob] = useState(null);
  const [userCountryId, setUserCountryId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tontine
        const { data: tontineData, error: tontineError } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tontineError) throw tontineError;
        setTontine(tontineData);
        
        // Get user country
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('pays_id')
            .eq('id', user.id)
            .single();
          
          if (!profileError && profileData?.pays_id) {
            setUserCountryId(profileData.pays_id);
          }
        }
      } catch (error) {
        toast.error('Tontine introuvable');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, user]);

  const handleGeneratePDF = () => {
    if (!formData.nom_complet) return toast.error('Veuillez saisir votre nom complet d\'abord');
    const date = new Date().toLocaleDateString('fr-FR');
    const blob = generateEngagementPDF(tontine.name, formData.nom_complet, date);
    setEngagementBlob(blob);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Engagement_${tontine.name.replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('adhesion_documents')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('adhesion_documents')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom_complet || !formData.telephone || !formData.adresse) {
      return toast.error('Veuillez remplir tous les champs');
    }
    if (!identityFile) {
      return toast.error('Veuillez uploader votre pièce d\'identité');
    }
    if (!accepted) {
      return toast.error('Vous devez accepter les conditions');
    }
    if (!engagementBlob) {
      return toast.error('Veuillez générer et télécharger l\'engagement');
    }
    if (!userCountryId) {
      return toast.error('Veuillez configurer votre pays dans votre profil avant de continuer');
    }

    setSubmitting(true);
    try {
      // Upload identity document
      const identityUrl = await uploadFile(identityFile, 'identity');
      
      // Upload engagement PDF
      const engagementUrl = await uploadFile(engagementBlob, 'engagement');
      
      if (!identityUrl || !engagementUrl) {
        throw new Error('Erreur lors de l\'upload des documents');
      }
      
      // Create adhesion record
      const { data, error } = await supabase
        .from('adhesions')
        .insert([{
          tontine_id: id,
          user_id: user.id,
          pays_id: userCountryId,
          nom_complet: formData.nom_complet,
          telephone: formData.telephone,
          email: formData.email || null,
          adresse: formData.adresse,
          statut: 'pending',
          identite_document_url: identityUrl,
          engagement_pdf_url: engagementUrl,
          signature_acceptee: true,
          date_signature: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create notification for organizer
      await supabase
        .from('notifications')
        .insert([{
          user_id: tontine.organisateur_id,
          title: 'Nouvelle demande d\'adhésion',
          message: `${formData.nom_complet} souhaite adhérer à votre tontine "${tontine.name}".`,
          type: 'adhesion_pending',
          tontine_id: id,
          send_internal: true,
          send_push: true
        }]);
      
      toast.success('Demande envoyée ! En attente de validation du tontinier.');
      navigate(`/tontine/${id}`);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <>
      <Helmet><title>Adhésion - {tontine?.name}</title></Helmet>
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center">
          <BackButton className="mr-2" />
          <h1 className="text-xl font-bold text-foreground">Adhésion: {tontine?.name}</h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="shadow-premium-sm">
              <CardHeader>
                <CardTitle>1. Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input 
                    value={formData.nom_complet} 
                    onChange={e => setFormData({...formData, nom_complet: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input 
                    type="tel" 
                    value={formData.telephone} 
                    onChange={e => setFormData({...formData, telephone: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse physique *</Label>
                  <Input 
                    value={formData.adresse} 
                    onChange={e => setFormData({...formData, adresse: e.target.value})} 
                    required 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-premium-sm">
              <CardHeader>
                <CardTitle>2. Pièce d'identité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="identity" className="cursor-pointer text-primary font-medium hover:underline">
                    Cliquez pour uploader (CNIB, Passeport)
                  </Label>
                  <Input 
                    id="identity" 
                    type="file" 
                    accept="image/*,.pdf" 
                    className="hidden" 
                    onChange={e => setIdentityFile(e.target.files[0])} 
                  />
                  {identityFile && (
                    <p className="mt-2 text-sm text-green-600 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-1"/> {identityFile.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Max 5MB. Images ou PDF.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-premium-sm">
              <CardHeader>
                <CardTitle>3. Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-xl text-sm text-muted-foreground italic">
                  "Je m'engage à respecter les clauses de la tontine {tontine?.name}..."
                </div>
                
                <Button type="button" variant="outline" onClick={handleGeneratePDF} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Générer et télécharger l'engagement PDF
                </Button>

                {engagementBlob && (
                  <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
                    <Checkbox 
                      id="terms" 
                      checked={accepted} 
                      onCheckedChange={(checked) => setAccepted(checked)} 
                    />
                    <Label htmlFor="terms" className="text-sm font-medium leading-tight cursor-pointer">
                      J'accepte les conditions et je confirme avoir téléchargé mon engagement.
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              disabled={submitting || !accepted} 
              className="w-full h-14 text-lg font-bold rounded-xl shadow-premium"
            >
              {submitting ? 'Envoi en cours...' : 'Confirmer l\'adhésion'}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default TontineAdhesionPage;