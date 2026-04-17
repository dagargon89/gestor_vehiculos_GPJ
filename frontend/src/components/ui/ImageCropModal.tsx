import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        pixelCrop.width, pixelCrop.height,
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas empty'))),
        'image/jpeg',
        0.92,
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

type Props = {
  imageSrc: string;
  fileName: string;
  aspect?: number;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

export function ImageCropModal({
  imageSrc,
  fileName,
  aspect = 4 / 3,
  onConfirm,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const baseName = fileName.replace(/\.[^.]+$/, '');
      const file = new File([blob], `${baseName}_crop.jpg`, { type: 'image/jpeg' });
      onConfirm(file);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="flex flex-col w-full max-w-md rounded-[16px] overflow-hidden"
        style={{
          background: 'var(--color-bg-soft)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
              Recortar foto
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Ajusta el encuadre 4:3 para la tarjeta del vehículo
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,132,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full" style={{ height: 340, background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid #6384ff',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div
          className="px-5 py-3 flex items-center gap-3"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-table-head-bg)' }}
        >
          <span className="material-icons text-base shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            zoom_out
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Zoom"
            style={{ accentColor: '#6384ff' }}
          />
          <span className="material-icons text-base shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            zoom_in
          </span>
        </div>

        {/* Footer buttons */}
        <div
          className="flex gap-3 px-5 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost flex-1 py-2.5"
            disabled={processing}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary flex-1 py-2.5 disabled:opacity-50"
            disabled={processing}
          >
            {processing ? 'Procesando…' : 'Confirmar recorte'}
          </button>
        </div>
      </div>
    </div>
  );
}
