import React from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { Modal, Button } from './UIComponents';
import { downloadFile } from '../../utils/pdfHelper';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl?: string;
  fileName?: string;
  fallbackText?: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
  fileName = 'documento.pdf',
  fallbackText
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (pdfUrl) {
      downloadFile(pdfUrl, fileName);
    }
  };

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      const w = window.open();
      if (w) {
        w.document.write(
          `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 truncate">
            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenNewTab}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Nueva Ventana
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Embedded Viewer */}
        <div className="w-full h-[500px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex flex-col items-center justify-center">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={title}
              className="w-full h-full border-0"
              onError={() => console.warn('Could not render iframe')}
            />
          ) : (
            <div className="p-8 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-slate-600 text-sm font-medium">
                {fallbackText || 'Vista previa no disponible directamente.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button size="md" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
