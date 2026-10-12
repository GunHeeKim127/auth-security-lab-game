import "./globals.css";

export const metadata = { title: "Auth Security Lab", description: "Local authentication security experiments" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
