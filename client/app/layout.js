import './globals.css';
import Providers from '../components/Providers';
import Nav from '../components/Nav';

export const metadata = {
  title: 'PYQ Analyzer',
  description: 'See which topics repeat in previous-year question papers and plan what to study first.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main className="wrap">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
