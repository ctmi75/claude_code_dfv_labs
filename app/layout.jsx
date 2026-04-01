import './globals.css';

export const metadata = {
  title: 'DFV — Advisory Sessions',
  description: 'Book 1:1 advisory sessions with the Dragon Fruit Ventures team.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
