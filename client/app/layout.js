import './globals.css';
import { Inter } from 'next/font/google';
import Providers from '../components/Providers';
import Nav from '../components/Nav';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata = {
  title: 'PYQ Analyzer',
  description: 'See which topics repeat in previous-year question papers and plan what to study first.',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <Nav />
          <main className="wrap">{children}</main>
        </Providers>
      </body>
    </html>
  );
}