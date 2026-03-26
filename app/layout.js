import "./globals.css";

export const metadata = {
  title: "タロットコーチング 継続サービス",
  description: "占い師とお客さんの継続的な関係を作るタロットコーチングサービス",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
