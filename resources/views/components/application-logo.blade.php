<svg {{ $attributes }} viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradiente de fondo -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
    </linearGradient>

    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
    </linearGradient>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Fondo con bordes redondeados -->
  <rect width="200" height="80" rx="12" ry="12" fill="url(#bgGradient)" filter="url(#shadow)"/>

  <!-- Elementos UML - Diagrama de clases simplificado -->
  <g transform="translate(15, 15)">
    <!-- Clase 1 -->
    <rect x="0" y="0" width="25" height="18" fill="white" stroke="#dc2626" stroke-width="1.5" rx="2"/>
    <line x1="0" y1="6" x2="25" y2="6" stroke="#dc2626" stroke-width="1"/>
    <line x1="0" y1="12" x2="25" y2="12" stroke="#dc2626" stroke-width="1"/>

    <!-- Clase 2 -->
    <rect x="40" y="25" width="25" height="18" fill="white" stroke="#dc2626" stroke-width="1.5" rx="2"/>
    <line x1="40" y1="31" x2="65" y2="31" stroke="#dc2626" stroke-width="1"/>
    <line x1="40" y1="37" x2="65" y2="37" stroke="#dc2626" stroke-width="1"/>

    <!-- Clase 3 -->
    <rect x="80" y="5" width="25" height="18" fill="white" stroke="#dc2626" stroke-width="1.5" rx="2"/>
    <line x1="80" y1="11" x2="105" y2="11" stroke="#dc2626" stroke-width="1"/>
    <line x1="80" y1="17" x2="105" y2="17" stroke="#dc2626" stroke-width="1"/>

    <!-- Conexiones/Relaciones -->
    <line x1="25" y1="9" x2="40" y2="34" stroke="#00f2fe" stroke-width="2" opacity="0.8"/>
    <line x1="65" y1="34" x2="80" y2="14" stroke="#00f2fe" stroke-width="2" opacity="0.8"/>
    <line x1="25" y1="9" x2="80" y2="14" stroke="#00f2fe" stroke-width="2" opacity="0.8"/>

    <!-- Puntos de conexión colaborativa -->
    <circle cx="32.5" cy="21.5" r="3" fill="#00f2fe" opacity="0.9"/>
    <circle cx="72.5" cy="19.5" r="3" fill="#00f2fe" opacity="0.9"/>
    <circle cx="52.5" cy="11.5" r="3" fill="#00f2fe" opacity="0.9"/>
  </g>

  <!-- Texto del logo -->
  <text x="125" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">UML</text>
  <text x="125" y="48" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.9">Colaborativo</text>

  <!-- Icono de colaboración (personas conectadas) -->
  <g transform="translate(125, 52)">
    <circle cx="5" cy="5" r="3" fill="white" opacity="0.8"/>
    <circle cx="15" cy="5" r="3" fill="white" opacity="0.8"/>
    <circle cx="25" cy="5" r="3" fill="white" opacity="0.8"/>
    <line x1="5" y1="8" x2="15" y2="8" stroke="white" stroke-width="1.5" opacity="0.6"/>
    <line x1="15" y1="8" x2="25" y2="8" stroke="white" stroke-width="1.5" opacity="0.6"/>
  </g>
</svg>
