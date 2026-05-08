import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DistributionConfirmationModal from '@/components/dashboard/DistributionConfirmationModal.jsx';

const OrganizerDistributionDashboard = ({ tontineId }) => {
  const [distributions, setDistributions] = useState([]);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDistributions = async () => {
    if (!tontineId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tours')
        .select(`
          *,
          user:user_id(full_name, email, phone)
        `)
        .eq('tontine_id', tontineId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transformer les données pour correspondre au format attendu
      const formattedDistributions = (data || []).map(tour => ({
        id: tour.id,
        montant: tour.montant_recu || 0,
        date_prevue: tour.created_at,
        statut: tour.statut === 'completed' ? 'distribuee' : 'en_attente',
        expand: {
          beneficiaire_id: {
            name: tour.user?.full_name,
            email: tour.user?.email
          }
        },
        created: tour.created_at,
        cycle_number: tour.cycle_number
      }));
      
      setDistributions(formattedDistributions);
    } catch (error) {
      console.error('Error fetching distributions:', error);
      toast.error("Erreur de chargement des distributions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tontineId) fetchDistributions();
  }, [tontineId]);

  const getStatusBadgeClass = (statut) => {
    return statut === 'distribuee' 
      ? 'bg-green-500 text-white' 
      : 'bg-yellow-500 text-white';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
        <h2 className="text-xl font-bold mb-4">Gestion des Distributions</h2>
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-premium-sm">
      <h2 className="text-xl font-bold mb-4">Gestion des Distributions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Bénéficiaire</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Date Prévue</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {distributions.map(d => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{d.expand?.beneficiaire_id?.name || 'Inconnu'}</td>
                <td className="px-4 py-3">{d.montant?.toLocaleString()} CFA</td>
                <td className="px-4 py-3">{new Date(d.date_prevue || d.created).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Badge className={getStatusBadgeClass(d.statut)}>
                    {d.statut === 'distribuee' ? 'Distribuée' : 'En attente'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {d.statut !== 'distribuee' && (
                    <Button size="sm" onClick={() => setSelectedDistribution(d)}>
                      Confirmer
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {distributions.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-muted-foreground">
                  Aucune distribution trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DistributionConfirmationModal 
        isOpen={!!selectedDistribution} 
        onClose={() => setSelectedDistribution(null)} 
        distribution={selectedDistribution} 
        onSuccess={fetchDistributions} 
      />
    </div>
  );
};

export default OrganizerDistributionDashboard;