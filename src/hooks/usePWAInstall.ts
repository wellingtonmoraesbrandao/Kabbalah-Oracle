import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
                return true;
            }
            // @ts-ignore - navigator.standalone is iOS specific
            if (window.navigator.standalone === true) {
                setIsInstalled(true);
                return true;
            }
            return false;
        };

        if (checkInstalled()) {
            return;
        }

        const handler = (e: Event) => {
            // Prevent default browser install prompt
            e.preventDefault();
            // Store the event for later use
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;

        // Clear the stored event
        setDeferredPrompt(null);
        setIsInstallable(false);

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
    };

    return {
        isInstallable,
        isInstalled,
        installApp,
    };
}
