import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { LoaderCircle, QrCode, X } from 'lucide-react';

function QRCodeModal({ isOpen, onClose, port = 8080 }) {
  const [localIp, setLocalIp] = useState('127.0.0.1');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    const loadQrCode = async () => {
      setIsLoading(true);
      try {
        const address = await window.electronAPI?.getLocalIp?.() || '127.0.0.1';
        const websocketUrl = `ws://${address}:${port}`;
        const dataUrl = await QRCode.toDataURL(websocketUrl, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 256,
          color: { dark: '#0b1018', light: '#ffffff' },
        });

        if (!cancelled) {
          setLocalIp(address);
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('Unable to generate pairing QR code:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadQrCode();
    return () => { cancelled = true; };
  }, [isOpen, port]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const websocketUrl = `ws://${localIp}:${port}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="pairing-modal-title">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300"><QrCode size={20} /></div>
            <div><h2 id="pairing-modal-title" className="text-base font-semibold">Pair Mobile Companion</h2><p className="mt-1 text-xs text-slate-400">Scan this code from the mobile app.</p></div>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white" onClick={onClose} aria-label="Close pairing dialog"><X size={17} /></button>
        </header>

        <div className="mt-6 flex min-h-64 items-center justify-center rounded-xl bg-white p-4">
          {isLoading ? <LoaderCircle className="animate-spin text-slate-600" size={28} /> : qrDataUrl ? <img className="h-56 w-56" src={qrDataUrl} alt={`Pairing QR code for ${websocketUrl}`} /> : <p className="text-center text-sm text-slate-600">QR code unavailable</p>}
        </div>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-center font-mono text-xs text-sky-300 break-all">{websocketUrl}</div>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">Both devices must be connected to the same local Wi-Fi network.</p>
      </section>
    </div>
  );
}

export default QRCodeModal;
