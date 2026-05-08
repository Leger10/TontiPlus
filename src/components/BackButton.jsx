import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ className = '' }) => {
  const navigate = useNavigate();
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => navigate(-1)} 
      className={`text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" /> Retour
    </Button>
  );
};

export default BackButton;