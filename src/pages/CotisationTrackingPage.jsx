import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Trophy, Download } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import BeneficiaryStatus from '@/components/BeneficiaryStatus.jsx';
import { generateMemberDistributionHistoryPDF } from '@/lib/pdfGenerator';
import BackButton from '@/components/BackButton.jsx';

const CotisationTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [adhesions, setAdhesions] = useState([]);
  const [myDistributions, setMyDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAdhesion, setMyAdhesion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer la tontine
        const { data: t, error: tError } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tError) throw tError;
        setTontine(t);
        
        // Récupérer les adhésions validées
        const { data: aData, error: aError } = await supabase
          .from('adhesions')
          .select(`
            *,
            user:user_id(full_name, email)
          `)
          .eq('tontine_id', id)
          .eq('statut', 'validated')
          .order('created_at', { ascending: true });
        
        if (aError) throw aError;
        setAdhesions(aData || []);
        
        // Trouver l'adhésion de l'utilisateur courant
        const currentAdhesion = aData?.find(a => a.user_id === user?.id);
        setMyAdhesion(currentAdhesion);
        
        // Récupérer les distributions de l'utilisateur
        const { data: distData, error: distError } = await supabase
          .from('tours')
          .select('*')
          .eq('tontine_id', id)
          .eq('user_id', user?.id)
          .eq('statut', 'completed')
          .order('date_reception', { ascending: false });
        
        if (distError) throw distError;
        setMyDistributions(distData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    if (user && id) {
      fetchData();
    }
  }, [id, user]);

  const handleDownloadPersonalHistory = () => {
    if (myDistributions.length === 0) {
      toast.info("Aucun historique disponible");
      return;
    }
    
    // Adapter le PDF generator pour Supabase
    const blob = generateMemberDistributionHistoryPDF(
      { name: profile?.full_name || user?.email }, 
      myDistributions.map(d => ({
        cycle_number: d.cycle_number,
        date_distribution: d.date_reception,
        montant_distribue: d.montant_recu
      }))
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Historique_Distributions_${tontine.name?.replace(/\s/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!tontine) return <div className="p-8 text-center">Tontine introuvable</div>;

  // Calculer le classement basé sur le montant cotisé (à adapter selon votre logique)
  const getRank = () => {
    if (!myAdhesion) return null;
    const sorted = [...adhesions].sort((a, b) => (b.montant_cotise || 0) - (a.montant_cotise || 0));
    return sorted.findIndex(a => a.id === myAdhesion.id) + 1;
  };
  
  const myRank = getRank();
  const isOrganizer = tontine.organisateur_id === user?.id;

  const getStatusBadge = (adhesion) => {
    const expected = tontine.montant_cotisation || 0;
    const actual = adhesion.montant_cotise || 0;
    if (actual >= expected) return <Badge className="bg-green-500 text-white">À jour</Badge>;
    if (actual > 0) return <Badge className="bg-yellow-500 text-white">Partiel</Badge>;
    return <Badge className="bg-red-500 text-white">Non payé</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <>
      <Helmet><title>Suivi & Tours - {tontine.name}</title></Helmet>
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center">
          <BackButton className="mr-2" />
          <h1 className="text-xl font-bold text-foreground truncate">Suivi: {tontine.name}</h1>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <BeneficiaryStatus tontineId={id} tontine={tontine} />

          {myAdhesion && (
            <Card className="shadow-premium-sm border-border bg-card">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Votre classement</p>
                    <p className="text-3xl font-extrabold text-foreground">{myRank} <span className="text-lg text-muted-foreground font-medium">sur {adhesions.length}</span></p>
                  </div>
                </div>
                <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">Montant cotisé</p>
                  <p className="text-2xl font-bold text-primary">{(myAdhesion.montant_cotise || 0).toLocaleString()} FCFA</p>
                  <Button onClick={() => navigate('/wallet')} className="w-full mt-3 rounded-xl shadow-sm">
                    <Wallet className="w-4 h-4 mr-2" /> Cotiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {myDistributions.length > 0 && (
            <Card className="shadow-premium-sm">
              <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-t-xl">
                <h3 className="font-bold text-foreground">Mes Distributions Reçues</h3>
                <Button size="sm" variant="outline" onClick={handleDownloadPersonalHistory}>
                  <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myDistributions.map(d => (
                      <TableRow key={d.id}>
                        <TableCell>Cycle {d.cycle_number}</TableCell>
                        <TableCell>{formatDate(d.date_reception)}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">+{d.montant_recu?.toLocaleString()} CFA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-premium-sm overflow-hidden">
            <CardHeader className="bg-card">
              <CardTitle>Classement des cotisations</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-16 text-center">Rang</TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adhesions.map((a, index) => (
                    <TableRow key={a.id} className={a.user_id === user?.id ? 'bg-muted/50' : ''}>
                      <TableCell className="text-center font-bold text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{a.nom_complet || a.user?.full_name}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{(a.montant_cotise || 0).toLocaleString()} FCFA</TableCell>
                      <TableCell className="text-center">{getStatusBadge(a)}</TableCell>
                    </TableRow>
                  ))}
                  {adhesions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun membre actif</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CotisationTrackingPage;