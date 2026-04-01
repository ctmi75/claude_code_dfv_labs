import './globals.css';

export const metadata = {
  title: 'DFV Advisory Sessions',
  description: 'Book advisory sessions with Dragon Fruit Ventures',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900">
        {children}
      </body>
    </html>
  );
}
