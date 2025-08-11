// app/fonts.ts (or any file you prefer)
import { Playfair_Display } from 'next/font/google';

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
});
import { Cinzel } from 'next/font/google';

export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['700'],
});