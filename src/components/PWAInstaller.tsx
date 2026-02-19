'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  // استخدام useMemo للقيم الأولية لتجنب setState في useEffect
  const initialState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isStandalone: false, isIOS: false };
    }
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return { isStandalone: standalone, isIOS: iosDevice };
  }, []);

  const [isStandalone, setIsStandalone] = useState(initialState.isStandalone);
  const [isIOS, setIsIOS] = useState(initialState.isIOS);

  useEffect(() => {
    if (isStandalone) return;

    // استماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // عرض البانر بعد 3 ثواني
      const timer = setTimeout(() => {
        // التحقق من رفض التثبيت سابقاً
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
          const dismissedTime = parseInt(dismissed);
          if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
            return;
          }
        }
        setShowInstallBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    };

    // استماع لحدث التثبيت
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    // عرض نافذة التثبيت
    await deferredPrompt.prompt();

    // انتظار قرار المستخدم
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsStandalone(true);
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // لا تعرض شيئاً إذا كان التطبيق مثبتاً
  if (isStandalone) return null;

  // بانر التثبيت لأجهزة Android و Desktop
  if (showInstallBanner && deferredPrompt && !isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="border-emerald-200 shadow-lg bg-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Smartphone className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-700">تثبيت التطبيق</h3>
                <p className="text-sm text-gray-600 mt-1">
                  ثبّت تطبيق الخدمات الطبية إحسان على جهازك للوصول السريع والعمل بدون إنترنت
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleInstallClick}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تثبيت
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-gray-500"
                  >
                    ليست الآن
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // تعليمات iOS
  if (showInstallBanner && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="border-emerald-200 shadow-lg bg-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Smartphone className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-700">تثبيت التطبيق</h3>
                <p className="text-sm text-gray-600 mt-1">
                  لإضافة التطبيق على الشاشة الرئيسية:
                </p>
                <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                  <li>اضغط على زر المشاركة</li>
                  <li>اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</li>
                  <li>اضغط &quot;إضافة&quot;</li>
                </ol>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-gray-500 mt-3"
                >
                  فهمت
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
