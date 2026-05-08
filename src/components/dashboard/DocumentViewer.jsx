import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getFileUrl } from '@/lib/supabase';

const DocumentViewer = ({ isOpen, onClose, documentUrl, title }) => {
  if (!documentUrl) return null;

  // Vérifier si l'URL est complète ou relative
  const getFullUrl = (url) => {
    if (url.startsWith('http')) return url;
    return getFileUrl('adhesion_documents', url);
  };

  const fullUrl = getFullUrl(documentUrl);
  const isPdf = fullUrl.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || 'Document'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full h-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {isPdf ? (
            <iframe src={fullUrl} className="w-full h-full" title={title} />
          ) : (
            <img src={fullUrl} alt={title} className="max-w-full max-h-full object-contain" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;