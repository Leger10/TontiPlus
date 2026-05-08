import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TourManagement({ tontineId }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select(`
            *,
            user:user_id(full_name, email)
          `)
          .eq('tontine_id', tontineId)
          .order('position', { ascending: true });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au format attendu
        const formattedTours = (data || []).map(tour => ({
          id: tour.id,
          ordre: tour.position,
          cycle_number: tour.cycle_number,
          user_id: tour.user_id,
          user: tour.user,
          statut: tour.statut,
          beneficiaire_statut: tour.statut === 'completed' ? 'deja_pris' : 
                               tour.statut === 'pending' ? 'prochain_a_prendre' : 'en_attente'
        }));
        
        setTours(formattedTours);
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, [tontineId]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'deja_pris': return <Badge className="bg-green-500 text-white">Déjà pris</Badge>;
      case 'prochain_a_prendre': return <Badge className="bg-yellow-500 text-white">Prochain à prendre</Badge>;
      default: return <Badge className="bg-gray-500 text-white">En attente</Badge>;
    }
  };

  if (loading) return <Skeleton className="w-full h-64 rounded-2xl shadow-premium-sm" />;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-premium-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-16">Ordre</TableHead>
              <TableHead>Membre</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead className="text-right">Statut de prise</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tours.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucun tour configuré.
                </TableCell>
              </TableRow>
            )}
            {tours.map((t) => (
              <TableRow key={t.id} className={t.beneficiaire_statut === 'prochain_a_prendre' ? 'bg-primary/5' : ''}>
                <TableCell className="font-bold text-muted-foreground">#{t.ordre}</TableCell>
                <TableCell className="font-medium flex items-center gap-2">
                  {t.beneficiaire_statut === 'prochain_a_prendre' && <Crown className="w-4 h-4 text-primary" />}
                  {t.user?.full_name || 'Inconnu'}
                </TableCell>
                <TableCell>Cycle {t.cycle_number}</TableCell>
                <TableCell className="text-right">{getStatusBadge(t.beneficiaire_statut)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}