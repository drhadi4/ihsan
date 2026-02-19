import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PWAInstaller from "@/components/PWAInstaller";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "الخدمات الطبية إحسان - نظام إدارة المنشآت الصحية الخاصة",
    template: "%s | الخدمات الطبية إحسان",
  },
  description: "نظام متكامل لإدارة طلبات تسجيل المنشآت الصحية الخاصة - وزارة الصحة والبيئة اليمنية",
  keywords: [
    "الخدمات الطبية",
    "إحسان",
    "المنشآت الصحية",
    "وزارة الصحة",
    "تراخيص طبية",
    "اليمن",
    "ترخيص مستشفى",
    "ترخيص عيادة",
    "ترخيص مختبر",
  ],
  authors: [{ name: "وزارة الصحة والبيئة - اليمن" }],
  creator: "وزارة الصحة والبيئة",
  publisher: "وزارة الصحة والبيئة",
  
  // PWA Configuration
  manifest: "/manifest.json",
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/icon-512x512.png", color: "#059669" },
    ],
  },
  
  // Apple PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "الخدمات الطبية إحسان",
  },
  
  // Mobile
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "ar_YE",
    url: "https://ihsan.moh.gov.ye",
    siteName: "الخدمات الطبية إحسان",
    title: "الخدمات الطبية إحسان - نظام إدارة المنشآت الصحية الخاصة",
    description: "نظام متكامل لإدارة طلبات تسجيل المنشآت الصحية الخاصة - وزارة الصحة والبيئة",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "شعار الخدمات الطبية إحسان",
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "الخدمات الطبية إحسان",
    description: "نظام متكامل لإدارة طلبات تسجيل المنشآت الصحية الخاصة",
    images: ["/icons/icon-512x512.png"],
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Other
  applicationName: "الخدمات الطبية إحسان",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "medical",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="إحسان" />
        <meta name="application-name" content="الخدمات الطبية إحسان" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#059669" />
        <meta name="msapplication-navbutton-color" content="#059669" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration.scope);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
        <PWAInstaller />
      </body>
    </html>
  );
}
