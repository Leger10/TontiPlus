import React from 'react';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const ShareTontine = ({ tontineName, tontineId, url }) => {
  const shareUrl = url || window.location.href;
  const message = `Rejoignez la tontine "${tontineName}" sur BonPlan Tontine ! Découvrez les détails ici: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Lien copié dans le presse-papier !'))
      .catch(() => toast.error('Échec de la copie du lien.'));
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex-1 rounded-xl gap-2 font-medium"
        onClick={handleCopyLink}
      >
        <LinkIcon className="w-4 h-4" />
        Copier le lien
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl gap-2 font-medium border-none"
        onClick={handleWhatsAppShare}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>
    </div>
  );
};

export default ShareTontine;