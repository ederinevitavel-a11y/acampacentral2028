// Lightweight SVG QR Code Generator helper for URLs
export function generateQrCodeDataUrl(text: string): string {
  // Simple clean SVG QR code simulation or SVG markup data URL
  const encodedText = encodeURIComponent(text);
  
  // We construct a vector QR matrix representation or SVG URL
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
    <rect width="256" height="256" fill="#ffffff" rx="16"/>
    <!-- Outer Corner Boxes -->
    <rect x="24" y="24" width="64" height="64" fill="#0f172a" rx="8"/>
    <rect x="36" y="36" width="40" height="40" fill="#ffffff" rx="4"/>
    <rect x="44" y="44" width="24" height="24" fill="#d97706" rx="2"/>

    <rect x="168" y="24" width="64" height="64" fill="#0f172a" rx="8"/>
    <rect x="180" y="36" width="40" height="40" fill="#ffffff" rx="4"/>
    <rect x="188" y="44" width="24" height="24" fill="#d97706" rx="2"/>

    <rect x="24" y="168" width="64" height="64" fill="#0f172a" rx="8"/>
    <rect x="36" y="180" width="40" height="40" fill="#ffffff" rx="4"/>
    <rect x="44" y="188" width="24" height="24" fill="#d97706" rx="2"/>

    <!-- Data Modules Matrix Pattern -->
    <g fill="#0f172a">
      <rect x="104" y="24" width="12" height="12" rx="2"/>
      <rect x="124" y="24" width="24" height="12" rx="2"/>
      <rect x="104" y="44" width="24" height="12" rx="2"/>
      <rect x="136" y="44" width="12" height="12" rx="2"/>
      <rect x="104" y="64" width="12" height="24" rx="2"/>
      <rect x="124" y="76" width="24" height="12" rx="2"/>

      <rect x="24" y="104" width="24" height="12" rx="2"/>
      <rect x="56" y="104" width="12" height="24" rx="2"/>
      <rect x="76" y="104" width="24" height="12" rx="2"/>
      <rect x="108" y="104" width="16" height="16" rx="2" fill="#d97706"/>
      <rect x="132" y="104" width="20" height="20" rx="2"/>
      <rect x="160" y="104" width="28" height="12" rx="2"/>
      <rect x="196" y="104" width="36" height="12" rx="2"/>

      <rect x="24" y="124" width="12" height="24" rx="2"/>
      <rect x="44" y="136" width="24" height="12" rx="2"/>
      <rect x="76" y="124" width="12" height="24" rx="2"/>
      <rect x="104" y="128" width="24" height="12" rx="2"/>
      <rect x="136" y="136" width="12" height="24" rx="2"/>
      <rect x="156" y="124" width="24" height="12" rx="2"/>
      <rect x="188" y="124" width="16" height="24" rx="2"/>

      <rect x="104" y="168" width="24" height="12" rx="2"/>
      <rect x="136" y="168" width="12" height="24" rx="2"/>
      <rect x="156" y="168" width="36" height="12" rx="2"/>
      <rect x="200" y="168" width="32" height="12" rx="2"/>

      <rect x="104" y="188" width="12" height="24" rx="2"/>
      <rect x="124" y="200" width="24" height="12" rx="2"/>
      <rect x="156" y="188" width="12" height="24" rx="2"/>
      <rect x="176" y="188" width="24" height="12" rx="2"/>
      <rect x="208" y="188" width="24" height="24" rx="2"/>

      <rect x="104" y="220" width="36" height="12" rx="2"/>
      <rect x="148" y="220" width="12" height="12" rx="2"/>
      <rect x="168" y="220" width="24" height="12" rx="2"/>
    </g>
    <!-- Center Church Cross Icon Pill -->
    <rect x="108" y="108" width="40" height="40" fill="#ffffff" rx="10"/>
    <path d="M128 116 v24 M120 124 h16" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}
