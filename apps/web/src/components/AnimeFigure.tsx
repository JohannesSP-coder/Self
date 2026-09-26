export function AnimeFigure({ width = 110 }: { width?: number }) {
  return (
    <svg
      width={width}
      height={(width * 200) / 120}
      viewBox="0 0 120 200"
      role="img"
      aria-label="Anime-Figur: muskulöser junger Mann mit schwarzen Haaren und Sixpack, der in einem Buch liest"
      className="anime-figure"
    >
      <path d="M49,64 Q40,68 30,70 Q22,72 21,82 L28,100 Q32,126 42,150 L78,150 Q88,126 92,100 L99,82 Q98,72 90,70 Q80,68 71,64 Z" fill="#E8B48E" />
      <path d="M28,100 Q32,126 42,150 L47,150 Q37,126 34,100 Z" fill="#C98E68" opacity="0.7" />
      <path d="M92,100 Q88,126 78,150 L73,150 Q83,126 86,100 Z" fill="#C98E68" opacity="0.7" />

      <g fill="none" stroke="#A8704E" strokeLinecap="round">
        <path d="M34,96 Q46,103 58.5,98 M86,96 Q74,103 61.5,98" strokeWidth="1.5" />
        <path d="M60,76 L60,146" strokeWidth="1.2" />
        <path d="M49,103 Q47.5,124 52,143 M71,103 Q72.5,124 68,143" strokeWidth="1.3" />
        <path d="M50.5,109 Q55,111.5 60,109 Q65,111.5 69.5,109" strokeWidth="1.3" />
        <path d="M50,120 Q55,122.5 60,120 Q65,122.5 70,120" strokeWidth="1.3" />
        <path d="M51,131 Q55.5,133.5 60,131 Q64.5,133.5 69,131" strokeWidth="1.3" />
        <path d="M43,132 Q50,142 55,150 M77,132 Q70,142 65,150" strokeWidth="1.3" />
      </g>
      <g fill="none" stroke="#F3C8A6" strokeWidth="1" strokeLinecap="round">
        <path d="M52.5,104 L57.5,104 M62.5,104 L67.5,104" />
        <path d="M52.5,114.5 L57.5,114.5 M62.5,114.5 L67.5,114.5 M53,125.5 L57.5,125.5 M62.5,125.5 L67,125.5" />
      </g>
      <path d="M36,106 L41,108 M37,112 L42,114 M38,118 L43,120 M84,106 L79,108 M83,112 L78,114 M82,118 L77,120" fill="none" stroke="#C98E68" strokeWidth="1.2" strokeLinecap="round" />

      <path d="M51,54 L69,54 L71,68 L49,68 Z" fill="#E8B48E" />
      <path d="M50,56 Q60,66 70,56 L70,62 Q60,70 50,62 Z" fill="#C98E68" />
      <path d="M52,59 L56.5,67 M68,59 L63.5,67" fill="none" stroke="#C98E68" strokeWidth="1.2" strokeLinecap="round" />

      <ellipse cx="45" cy="37" rx="2.5" ry="5" fill="#E8B48E" />
      <ellipse cx="75" cy="37" rx="2.5" ry="5" fill="#E8B48E" />
      <path d="M47,24 Q47,12 60,11 Q73,12 73,24 L74,38 Q73.5,47 69,54 Q64.5,59.5 60,60.5 Q55.5,59.5 51,54 Q46.5,47 46,38 Z" fill="#E8B48E" />
      <path d="M48.5,41 L50.5,45 M71.5,41 L69.5,45" fill="none" stroke="#C98E68" strokeWidth="1" strokeLinecap="round" />

      <path d="M49.5,32 Q53.5,30.8 57.5,32 M70.5,32 Q66.5,30.8 62.5,32" fill="none" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M49.5,35.6 Q53.5,34.4 57.5,35.2 Q54,37.2 49.5,35.6 Z" fill="#FFFFFF" />
      <path d="M70.5,35.6 Q66.5,34.4 62.5,35.2 Q66,37.2 70.5,35.6 Z" fill="#FFFFFF" />
      <circle cx="53.2" cy="36.1" r="1.25" fill="#2B1312" />
      <circle cx="64.8" cy="36.1" r="1.25" fill="#2B1312" />
      <path d="M49,35.5 Q53.5,33.6 58,35.1 M71,35.5 Q66.5,33.6 62,35.1" fill="none" stroke="#111111" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M60,39 L59,43 L61,43.2" fill="none" stroke="#C98E68" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M56.5,50 Q60,51 63.5,50" fill="none" stroke="#8A4A3A" strokeWidth="1.3" strokeLinecap="round" />

      <path d="M44,34 Q41,22 45,14 Q51,5 62,6 Q74,7 77,16 Q79,24 76,34 L73,27 L72.5,32 L69,25 L67.5,31 L64,24 L62.5,33 L59,24 L56.5,31 L53,25 L50.5,32 L48,26 L47,33 Z" fill="#161414" stroke="#4A4444" strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M50,12 Q57,8 65,10 M53,17 Q60,13 68,16 M71,13 Q74,18 74,24" fill="none" stroke="#4A4444" strokeWidth="1.1" strokeLinecap="round" />

      <circle cx="26" cy="81" r="10" fill="#E8B48E" />
      <circle cx="94" cy="81" r="10" fill="#E8B48E" />
      <path d="M17,82 Q12,100 14,118 L24,122 Q30,104 32,88 Z" fill="#E8B48E" />
      <path d="M103,82 Q108,100 106,118 L96,122 Q90,104 88,88 Z" fill="#E8B48E" />
      <path d="M15,115 L44,99.5 Q49,101 49,106 L23,124 Q16,123 15,115 Z" fill="#E8B48E" />
      <path d="M107,116 Q100,138 86,156 L78,152 Q90,134 96,116 Z" fill="#E8B48E" />
      <path d="M18,84 Q22,78 30,80 M102,84 Q98,78 90,80" fill="none" stroke="#C98E68" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M22,92 Q27,100 26,112 M98,92 Q93,100 94,112" fill="none" stroke="#C98E68" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16,120 Q20,118 24,121 M104,120 Q100,118 96,121" fill="none" stroke="#A8704E" strokeWidth="1.2" strokeLinecap="round" />

      <path d="M38,146 L82,146 L86,200 L34,200 Z" fill="#2E2A2A" />
      <path d="M38,150.5 L82,150.5" fill="none" stroke="#4A4444" strokeWidth="1.2" />
      <path d="M58.5,151 L57.5,161 M61.5,151 L62.5,161" fill="none" stroke="#D12A24" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M60,172 L60,200" fill="none" stroke="#1F1C1C" strokeWidth="1.2" />
      <path d="M87,151 L74,148 Q75,160 83,168 L87,166 Z" fill="#2E2A2A" />
      <ellipse cx="82" cy="162" rx="5" ry="4.5" fill="#363131" />
      <path d="M46,148 Q45,160 37,168 M74,148 Q75,160 83,168" fill="none" stroke="#5A5252" strokeWidth="1.2" strokeLinecap="round" />

      <path d="M50,80 L35,76 L35,98 L50,102 Z" fill="#D12A24" />
      <path d="M50,80 L65,76 L65,98 L50,102 Z" fill="#B3221D" />
      <path d="M35,76 L50,80 L65,76 L65,74.4 L50,78.4 L35,74.4 Z" fill="#F4EFEC" />
      <path d="M50,78.4 L50,102" fill="none" stroke="#7A1512" strokeWidth="1.2" />
      <path d="M38,82 L46,84 M38,86 L44,87.5" fill="none" stroke="#FF5A52" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="49.5" cy="102.5" rx="5.5" ry="3.8" fill="#E8B48E" />
      <path d="M46.5,101.3 L46.5,104.2 M49,101 L49,104.8 M51.5,101 L51.5,104.6" fill="none" stroke="#C98E68" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}
