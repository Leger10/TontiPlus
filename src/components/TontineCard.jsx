import React from 'react';
import { Link } from 'react-router-dom';
import { supabase, getFileUrl } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TierTable from '@/components/TierTable.jsx';
import { MapPin, Users, ArrowRight, Trophy, Clock } from 'lucide-react';

const TontineCard = ({ tontine }) => {
  // Obtenir l'URL de l'image depuis Supabase Storage
  const getImageUrl = () => {
    if (tontine.image_url) {
      return getFileUrl('tontines_images', tontine.image_url);
    }
    return 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80';
  };

  const getTypeColor = (type) => {
    const types = {
      'rotative': 'bg-gradient-to-r from-purple-600 to-purple-800 text-white border-none shadow-sm',
      'mixte': 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none shadow-sm',
      'epargne': 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-none shadow-sm'
    };
    return types[type] || 'bg-gray-600 text-white border-none shadow-sm';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'rotative': 'Rotative',
      'mixte': 'Mixte',
      'epargne': 'Épargne'
    };
    return labels[type] || type;
  };

  const imageUrl = getImageUrl();
  const paliers = Array.isArray(tontine.paliers) ? tontine.paliers : [];
  const hasPaliers = paliers.length > 0;

  return (
    <Link to={`/tontine/${tontine.id}`} className="block h-full group">
      <Card className="h-full bg-[#2d2d2d] border-[#4a4a4a] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden flex flex-col">
        <div className="relative h-48 w-full bg-[#1a1a1a] overflow-hidden">
          <img 
            src={imageUrl} 
            alt={tontine.name} 
            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2d2d2d] to-transparent"></div>
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge className={`${getTypeColor(tontine.type_tontine)} font-bold uppercase tracking-wider text-[10px] px-3 py-1`}>
              {getTypeLabel(tontine.type_tontine)}
            </Badge>
            {tontine.statut === 'active' && (
              <Badge className="bg-green-500 text-white font-bold uppercase tracking-wider text-[10px] px-3 py-1">
                Active
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-6 flex flex-col flex-grow z-10 relative bg-[#2d2d2d]">
          <div className="mb-4">
            <h3 className="text-xl font-extrabold text-white leading-tight mb-2 line-clamp-2">
              {tontine.name}
            </h3>
            <div className="flex flex-wrap items-center text-xs text-[#b0b0b0] gap-3">
              {tontine.ville && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span className="truncate max-w-[100px]">{tontine.ville}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-500" />
                <span>{tontine.nombre_membres || 0} membres</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{tontine.frequence === 'biweekly' ? '15 jours' : tontine.frequence}</span>
              </span>
            </div>
          </div>

          {/* Montant de cotisation */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-500">
                {tontine.montant_cotisation?.toLocaleString()}
              </span>
              <span className="text-xs text-[#b0b0b0]">FCFA / {tontine.frequence === 'biweekly' ? '15j' : tontine.frequence === 'monthly' ? 'mois' : 'semaine'}</span>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            {hasPaliers && (
              <div className="mb-2 bg-[#3a3a3a] p-3 rounded-lg border border-[#4a4a4a]">
                <p className="text-xs font-bold text-[#b0b0b0] mb-2 uppercase tracking-wide flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  Paliers disponibles
                </p>
                <TierTable tiers={paliers.slice(0, 2)} compact={true} />
                {paliers.length > 2 && (
                  <p className="text-[10px] text-center text-[#b0b0b0] mt-2">+{paliers.length - 2} autres paliers</p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm font-bold text-amber-500 group-hover:text-amber-400 transition-colors pt-4 border-t border-[#4a4a4a]">
              <span>Voir les détails</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TontineCard;