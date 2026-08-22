import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(
  text: string,
  options?: { width?: number; margin?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  try {
    const opts = {
      width: options?.width || 512,
      margin: options?.margin ?? 2,
      errorCorrectionLevel: 'M' as const,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#ffffff',
      },
    };
    return await QRCode.toDataURL(text, opts);
  } catch (err) {
    console.error('Erro ao gerar QR Code real:', err);
    return '';
  }
}
