import './globals.css';
import { Inter } from 'next/font/google';
import Providers from '../components/Providers';
import AppShell from '../components/shell/AppShell';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata = {
  title: 'PYQ Analyzer',
  description: 'See which topics repeat in previous-year question papers and plan what to study first.',
};

export const viewport = { themeColor: '#0b0c10' };

// runs before the first paint so the saved theme never flashes
const themeInit = `try{var t=localStorage.getItem('pyq_theme')||'dark';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}