import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const TontineDistributionHistory = ({ tontineId }) => {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistributions = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select(`
            *,
            user:user_id(full_name, email, phone),
            tontine:tontine_id(name)
          `)
          .eq('tontine_id', tontineId)
          .eq('statut', 'completed')
          .order('date_reception', { ascending: false });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au format attendu
        const formattedDistributions = (data || []).map(tour => ({
          id: tour.id,
          cycle_numero: tour.cycle_number,
          user_id: tour.user_id,
          expand: {
            user_id: {
              name: tour.user?.full_name || 'Inconnu'
            }
          },
          montant_distribue: tour.montant_recu || 0,
          date_distribution: tour.date_reception,
          statut: 'CONFIRMEE'
        }));
        
        setDistributions(formattedDistributions);
      } catch (error) {
        console.error("Error fetching distributions:", error);
        toast.error("Erreur lors du chargement de l'historique");
      } finally {
        setLoading(false);
      }
    };

    if (tontineId) {
      fetchDistributions();
    }
  }, [tontineId]);

  const handleDownloadPDF = (dist) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Reçu de Distribution - Tontine", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${dist.date_distribution ? new Date(dist.date_distribution).toLocaleDateString('fr-FR') : '-'}`, 20, 40);
    doc.text(`Cycle: ${dist.cycle_numero}`, 20, 50);
    doc.text(`Bénéficiaire: ${dist.expand?.user_id?.name || 'Inconnu'}`, 20, 60);
    doc.text(`Montant: ${(dist.montant_distribue || 0).toLocaleString()} FCFA`, 20, 70);
    doc.text(`Statut: ${dist.statut}`, 20, 80);
    
    doc.setFontSize(10);
    doc.text("Document généré automatiquement par BonPlan Tontine.", 20, 120);
    
    doc.save(`Distribution_Cycle_${dist.cycle_numero}_${(dist.expand?.user_id?.name || 'Membre').replace(/\s/g, '_')}.pdf`);
  };

  if (loading) {
    return <Skeleton className="w-full h-64 rounded-2xl shadow-premium-sm" />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Historique des Distributions</h3>
      <div className="bg-card rounded-2xl border shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center">Cycle</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Reçu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((dist) => (
                <TableRow key={dist.id}>
                  <TableCell className="text-center font-bold">{dist.cycle_numero}</TableCell>
                  <TableCell className="font-medium">{dist.expand?.user_id?.name || 'Inconnu'}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {(dist.montant_distribue || 0).toLocaleString()} CFA
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dist.date_distribution ? new Date(dist.date_distribution).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-green-500 text-white">
                      {dist.statut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(dist)}>
                      <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {distributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune distribution effectuée pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TontineDistributionHistory;