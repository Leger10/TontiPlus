import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const DepositImageViewer = ({ isOpen, onClose, imageUrl, title = "Reçu de dépôt" }) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = "recu_depot" + imageUrl.substring(imageUrl.lastIndexOf('.'));
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="sr-only">Visualisation du reçu</DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-[60vh] bg-muted/30 flex items-center justify-center p-4">
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-w-full max-h-full object-contain rounded-md shadow-sm"
          />
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-muted/10">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" /> Télécharger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositImageViewer;