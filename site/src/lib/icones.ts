// Gerado a partir de assets/icones do kit. Tracos usam currentColor.
export const ICONES = {
  "cadeado": "<rect x=\"4\" y=\"10\" width=\"16\" height=\"12\" rx=\"3\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4M12 15v3\"/>",
  "caixa": "<path d=\"m12 2 10 5v10l-10 5-10-5V7ZM2 7l10 5 10-5M12 12v10M7 4l10 5\"/>",
  "caminhao": "<path d=\"M1 5h13v12H1ZM14 9h5l4 5v3h-9\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"18\" r=\"3\"/>",
  "brilho": "<path d=\"M12 2.5 13.9 8 19.5 10 13.9 12 12 17.5 10.1 12 4.5 10 10.1 8Z\"/><path d=\"M18.5 15.5 19.3 18l2.2.9-2.2.9-.8 2.4-.8-2.4-2.2-.9 2.2-.9ZM5 2.5l.6 1.9L7.5 5l-1.9.7L5 7.5l-.6-1.8L2.5 5l1.9-.6Z\"/>",
  "capacidade": "<path d=\"m5 2 2 20h10l2-20ZM14 6h4M14 10h4M14 14h3\"/>",
  "carrinho": "<circle cx=\"9.5\" cy=\"20\" r=\"1.6\"/><circle cx=\"18\" cy=\"20\" r=\"1.6\"/><path d=\"M1.5 3h3l2.4 11.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.55L21 8H5.4\"/>",
  "cartao": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"3\"/><path d=\"M2 9h20M6 15h4\"/>",
  "casa": "<path d=\"m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7\"/>",
  "check": "<path d=\"m4 12 5 5L20 6\"/>",
  "coracao": "<path d=\"M12 21 3 12C-3 3 8-2 12 6 16-2 27 3 21 12Z\"/>",
  "email": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"3\"/><path d=\"m2 5 10 8L22 5\"/>",
  "energia": "<path d=\"m14 2-10 12h7l-1 8 10-12h-7Z\"/>",
  "escudo": "<path d=\"m12 2 9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6Z\"/><path d=\"m7 12 3 3 7-7\"/>",
  "estrela": "<path d=\"m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z\"/>",
  "fechar": "<path d=\"m5 5 14 14M5 19 19 5\"/>",
  "folha": "<path d=\"M20 3C3 0-2 19 9 21 20 24 23 8 20 3ZM5 20 17 7\"/>",
  "mais": "<path d=\"M5 12h14M12 5v14\"/>",
  "menos": "<path d=\"M5 12h14\"/>",
  "menu": "<path d=\"M3 6h18M3 12h18M3 18h18\"/>",
  "nota-fiscal": "<path d=\"M5 2h14v20l-3-2-4 2-4-2-3 2ZM8 7h8M8 11h8M8 15h5\"/>",
  "pix": "<path d=\"m12 2 10 10-10 10L2 12ZM5 9h4l3 3 3-3h4M5 15h4l3-3 3 3h4\"/>",
  "relogio": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 5v7l4 3\"/>",
  "sacola": "<path d=\"M4 7h16l1 15H3ZM8 8V6a4 4 0 0 1 8 0v2\"/>",
  "seta": "<path d=\"M3 12h18m-7-7 7 7-7 7\"/>",
} as const;

export type NomeIcone = keyof typeof ICONES;
