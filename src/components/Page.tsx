import React, { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import getClientEnv from "../utils/getClientEnv";
import { ToastContainer } from "react-toastify";
import InstallPwaPrompt from "./InstallPwaPrompt";
import Tabs, { useTabsController } from "./Tabs";
import Calculator from "./calculator-parts/Calculator";
import FermentList from "./ferment-list/FermentList";
import Spinner from "./Spinner";
import { PwaContext, NotificationsContext } from "./SpecialFeaturesContext";

declare global {
  interface Window {
    installPrompt?: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Page({ pageTitle, children }: { pageTitle: string; children?: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 900px)").matches;
  });
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== "undefined" ? window.visualViewport?.height || window.innerHeight : 0
  );
  const [debouncedViewportHeight] = useDebounce(viewportHeight, 150);
  const [isSoftwareKeyboardOpen, setIsSoftwareKeyboardOpen] = useState<boolean>(false);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean | null>(null);
  const [canReceiveNotifications, setCanReceiveNotifications] = useState<boolean | null>(null);
  const clientEnv = getClientEnv();
  const tabsController = useTabsController('calculator');

  // Set up PWA install prompt event listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const installPromptHandler = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.installPrompt = promptEvent;
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', installPromptHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', installPromptHandler);
    };
  }, []);

  // Check notification permission status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkNotificationPermission = () => {
      if (!('Notification' in window)) {
        setCanReceiveNotifications(false);
        return;
      }

      const permission = Notification.permission;
      if (permission === 'granted') {
        setCanReceiveNotifications(true);
      } else if (permission === 'denied') {
        setCanReceiveNotifications(false);
      } else {
        // permission === 'default' - not asked yet
        setCanReceiveNotifications(null);
      }
    };

    checkNotificationPermission();

    // Listen for permission changes
    const intervalId = setInterval(checkNotificationPermission, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Listen to visualViewport resize and update viewport height
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleViewportResize = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Update keyboard state based on debounced viewport height
  useEffect(() => {
    const keyboardOpen = debouncedViewportHeight < window.innerHeight - 50; // 50px threshold
    setIsSoftwareKeyboardOpen(keyboardOpen);
    
    if (import.meta.env.DEV) {
      console.log('[Page] Keyboard state:', {
        keyboardOpen,
        viewportHeight: debouncedViewportHeight,
        windowHeight: window.innerHeight,
      });
    }
  }, [debouncedViewportHeight]);

  const tabs = [
    {
      id: 'calculator',
      label: <h2>Calculator</h2>,
      content: <Calculator tabsController={tabsController} isSmallScreen={isSmallScreen} />,
    },
    {
      id: 'ferment-list',
      label: <h2>Saved Ferments</h2>,
      content: <FermentList />,
    }
  ];

  // Track screen size to switch tab orientation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = () => {
      setIsSmallScreen(mediaQuery.matches);
    };

    // Set initial value and subscribe to changes
    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Loading state management
  useEffect(() => {
    window.addEventListener('fermentDataUpdated', () => setIsLoading(false));

    setIsLoading(false);
    return () => {
      window.removeEventListener('fermentDataUpdated', () => setIsLoading(false));
    };

  }, []);

  return (
    <PwaContext.Provider value={canInstallPwa}>
      <NotificationsContext.Provider value={canReceiveNotifications}>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="page-wrapper" data-software-keyboard-visible={isSoftwareKeyboardOpen}>
            <main className="page-main" data-client-env={clientEnv}>
              <h1 className="visually-hidden">{pageTitle}</h1>
              <Tabs 
                tabs={tabs} 
                orientation={isSmallScreen ? "horizontal" : "vertical"}
                controller={tabsController}
              />
              {children}
              <ToastContainer theme="dark" autoClose={8000} />
            </main>
            <footer className="site-footer">
              <small>This little tool (BETA) was created by Kayla Pratt. <a href="https://github.com/KaylaPrattA11y/lft" target="_blank" rel="noopener noreferrer">View on Github</a></small>
              <InstallPwaPrompt />
            </footer>
          </div>
        )}
      </NotificationsContext.Provider>
    </PwaContext.Provider>
  );
}