import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Share2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

const QRCodePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [server, setServer] = useState(null);
  const qrRef = useRef(null);

  useEffect(() => {
    const serverData = sessionStorage.getItem('server');
    if (!serverData) {
      navigate('/auth');
      return;
    }
    setServer(JSON.parse(serverData));
  }, [navigate]);

  const tipUrl = server ? `${window.location.origin}/t/${server.id}` : '';

  const handleDownload = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `tipsy-qr-${server.first_name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success(t('qr.download') + ' ' + 'complete!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(tipUrl);
    toast.success(t('qr.link.copied'));
  };

  if (!server) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <Button
        variant="ghost"
        className="absolute top-6 left-6 rounded-full"
        onClick={() => navigate('/dashboard')}
        data-testid="back-to-dashboard-button"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="max-w-md mx-auto px-6 py-20 relative z-10">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h1 className="font-quasimoda font-bold text-3xl">{t('qr.title')}</h1>
            <p className="text-muted-foreground">{t('qr.subtitle')}</p>
          </div>

          <Card className="glass-card p-8 rounded-3xl" data-testid="qr-code-card">
            <div ref={qrRef} className="bg-white p-6 rounded-2xl mx-auto w-fit">
              <QRCodeSVG value={tipUrl} size={256} level="H" />
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-center text-sm text-muted-foreground font-mono break-all">
                {tipUrl}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleDownload}
                  data-testid="download-qr-button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('qr.download')}
                </Button>

                <Button
                  className="rounded-full"
                  onClick={handleShare}
                  data-testid="share-link-button"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('qr.share')}
                </Button>
              </div>
            </div>
          </Card>

          {server.photo_url && (
            <Card className="glass-card p-6 rounded-3xl text-center">
              <img
                src={server.photo_url}
                alt={server.first_name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-primary"
              />
              <p className="font-quasimoda font-bold text-xl">{server.first_name}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;