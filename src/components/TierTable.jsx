import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const TierTable = ({ tiers = [], compact = false, onRemove, isEditable = false }) => {
  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto rounded-xl shadow-md border border-[hsl(var(--primary))]/30">
      <table className="w-full text-left border-collapse min-w-[320px]">
        <thead className="bg-[hsl(var(--primary))] text-white">
          <tr>
            <th className={`font-semibold border-b border-white/20 ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              Montant {compact ? '(Mois)' : 'mensuel'}
            </th>
            <th className={`font-semibold border-b border-white/20 ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              Prix total
            </th>
            <th className={`font-semibold border-b border-white/20 ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              Durée
            </th>
            <th className={`font-semibold border-b border-white/20 ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
              {compact ? 'Places' : 'Nombre de personnes'}
            </th>
            {isEditable && (
              <th className={`font-semibold border-b border-white/20 p-3 text-sm text-center w-12`}>
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-[hsl(var(--primary))]/90 text-white">
          {tiers.map((tier, index) => (
            <tr key={index} className="border-b border-white/10 last:border-0 hover:bg-[hsl(var(--primary))] transition-colors">
              <td className={`font-medium ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                {Number(tier.montant_mensuel).toLocaleString()} CFA
              </td>
              <td className={`font-bold ${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                {Number(tier.prix_total).toLocaleString()} CFA
              </td>
              <td className={`${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                {tier.duree_mois} mois
              </td>
              <td className={`${compact ? 'p-2 text-xs' : 'p-3 text-sm'}`}>
                {tier.nombre_personnes}
              </td>
              {isEditable && (
                <td className="p-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:text-red-300 hover:bg-white/10 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      onRemove?.(index);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TierTable;