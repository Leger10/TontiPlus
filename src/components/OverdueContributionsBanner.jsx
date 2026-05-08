import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/lib/supabase';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OverdueContributionsBanner = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [overdueCount, setOverdueCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkOverdue = async () => {
      if (user) {
        const { count, error } = await supabase
          .from('paiements')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('statut', ['late', 'overdue']);
        
        if (!error) {
          setOverdueCount(count || 0);
        }
      }
    };
    checkOverdue();
  }, [user]);

  if (!user || overdueCount === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between border-l-4 border-l-red-800 shadow-xl relative z-50">
      <div 
        className="flex items-center flex-1 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => navigate('/my-contributions')}
      >
        <AlertCircle className="w-6 h-6 mr-3 shrink-0 animate-pulse" />
        <p className="text-sm font-medium">
          Vous avez <strong className="font-extrabold text-lg">{overdueCount} cotisation(s) en retard</strong> - Cliquez ici pour régulariser.
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-white hover:bg-white/20 h-8 w-8 rounded-full shrink-0 ml-4 border border-white/20"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default OverdueContributionsBanner;