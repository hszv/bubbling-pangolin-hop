import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useRef } from 'react';

export const QRCodeDisplay = () => {
  const { restaurantId } = useAuth();
  const qrRef = useRef<SVGSVGElement>(null);

  if (!restaurantId) {
    return null;
  }

  const menuUrl = `${window.location.origin}/menu/${restaurantId}`;

  const downloadQRCode = () => {
    if (qrRef.current) {
      const svg = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = 256; // Set a fixed size for better quality
        canvas.height = 256;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 256, 256);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "qrcode-cardapio.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu QR Code Exclusivo</CardTitle>
        <CardDescription>
          Seus clientes podem escanear este código para acessar seu cardápio digital instantaneamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG
            value={menuUrl}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
            ref={qrRef}
          />
        </div>
        <p className="text-sm text-muted-foreground break-all">{menuUrl}</p>
        <Button onClick={downloadQRCode}>
          <Download className="mr-2 h-4 w-4" />
          Baixar QR Code (PNG)
        </Button>
      </CardContent>
    </Card>
  );
};