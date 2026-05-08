import React, { useState, useEffect } from 'react';
import { supabase, getFileUrl } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import { generateDistributionReportPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

export default function DistributionHistory({ tontineId, tontine }) {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select(`
            *,
            user:user_id(full_name, email, phone)
          `)
          .eq('tontine_id', tontineId)
          .eq('statut', 'completed')
          .order('date_reception', { ascending: false });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au format attendu
        const formattedDistributions = (data || []).map(tour => ({
          id: tour.id,
          cycle_number: tour.cycle_number,
          user_id: tour.user_id,
          expand: {
            utilisateur_id: {
              name: tour.user?.full_name,
              email: tour.user?.email
            }
          },
          montant_distribue: tour.montant_recu,
          date_distribution: tour.date_reception,
          created_at: tour.created_at
        }));
        
        setDistributions(formattedDistributions);
      } catch (err) {
        console.error('Error fetching distribution history:', err);
        toast.error("Erreur lors du chargement de l'historique");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [tontineId]);

  const handleDownload = async (dist) => {
    try {
      const blob = await generateDistributionReportPDF(
        dist, 
        tontine, 
        dist.expand?.utilisateur_id || { name: 'Bénéficiaire' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_Distribution_Cycle${dist.cycle_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Rapport téléchargé");
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-premium-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Cycle</TableHead>
              <TableHead>Bénéficiaire</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Rapport</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucune distribution enregistrée.
                </TableCell>
              </TableRow>
            )}
            {distributions.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">Cycle {d.cycle_number}</TableCell>
                <TableCell>{d.expand?.utilisateur_id?.name || 'Inconnu'}</TableCell>
                <TableCell className="font-bold text-primary">
                  {(d.montant_distribue || 0).toLocaleString()} CFA
                </TableCell>
                <TableCell>
                  {d.date_distribution ? new Date(d.date_distribution).toLocaleDateString('fr-FR') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(d)}>
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}