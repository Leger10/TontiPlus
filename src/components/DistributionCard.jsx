import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export default function DistributionCard({ currentTour, tontine }) {
  if (!currentTour) {
    return (
      <Card className="shadow-premium-sm bg-card border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucun cycle en cours.
        </CardContent>
      </Card>
    );
  }

  const name = currentTour.user?.full_name || currentTour.expand?.user?.full_name || "Inconnu";

  return (
    <Card className="shadow-premium overflow-hidden border-[hsl(var(--primary))]/30 bg-card">
      <div className="bg-[hsl(var(--primary))]/10 p-4 border-b border-[hsl(var(--primary))]/20 flex justify-between items-center">
        <CardTitle className="text-lg flex items-center text-foreground">
          <Crown className="w-5 h-5 mr-2 text-[hsl(var(--primary))]" /> Cycle Actuel ({currentTour.cycle_number})
        </CardTitle>
        <Badge variant="outline" className="bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] border-transparent">En cours</Badge>
      </div>
      <CardContent className="p-6 space-y-4 bg-card">
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Prochain bénéficiaire</p>
          <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] font-bold text-lg">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">Position: #{currentTour.position || currentTour.ordre}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Montant prévu</p>
              <p className="font-bold text-[hsl(var(--primary))]">
                {(tontine?.montant_total_collecte || 
                  (tontine?.montant_cotisation * (tontine?.nombre_membres || 1)) || 
                  0).toLocaleString()} CFA
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}