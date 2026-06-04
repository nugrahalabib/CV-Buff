import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  locale: string;
  bodyClassName?: string;
};

export default function Document({ children, locale, bodyClassName }: Props) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico?v=5" sizes="32x32" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png?v=5" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=5" />
      </head>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
