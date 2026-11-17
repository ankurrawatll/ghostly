import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseDocumentPipReturn {
  isPipActive: boolean;
  isSupported: boolean;
  pipContainer: HTMLElement | null;
  openPip: (width?: number, height?: number) => Promise<boolean>;
  closePip: () => void;
}

export function useDocumentPip(): UseDocumentPipReturn {
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const isSupported = typeof window !== 'undefined' && (
    'documentPictureInPicture' in window || typeof window.open === 'function'
  );

  const closePip = useCallback(() => {
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch (e) {
        // window may already be closed
      }
      pipWindowRef.current = null;
    }
    setPipContainer(null);
    setIsPipActive(false);
  }, []);

  const openPip = useCallback(async (width = 380, height = 560): Promise<boolean> => {
    // 1. Try Document Picture-in-Picture API (Chrome 116+, Edge)
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      try {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width,
          height,
          disallowReturnToOpener: false
        });

        pipWindowRef.current = pipWin;

        // Copy all stylesheets from host window so Tailwind and custom classes work seamlessly
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach((styleSheet) => {
          try {
            pipWin.document.head.appendChild(styleSheet.cloneNode(true));
          } catch (e) {
            console.warn('Could not copy stylesheet to PiP window', e);
          }
        });

        // Set PiP document attributes
        pipWin.document.title = 'GhostWing Mini-HUD (Webcam Teleprompter)';
        pipWin.document.body.className = 'bg-[#07080B] text-slate-100 p-0 m-0 overflow-y-auto selection:bg-purple-500/30 selection:text-white antialiased font-sans';

        // Auto close handler
        pipWin.addEventListener('pagehide', () => {
          pipWindowRef.current = null;
          setPipContainer(null);
          setIsPipActive(false);
        });

        setPipContainer(pipWin.document.body);
        setIsPipActive(true);
        return true;
      } catch (err) {
        console.warn('Native Document Picture-in-Picture failed, falling back to popup window:', err);
      }
    }

    // 2. Fallback: Compact pop-out window
    if (typeof window !== 'undefined') {
      try {
        const left = Math.max(0, (window.screen.availWidth || 1200) - width - 40);
        const top = 40;
        const popup = window.open(
          '',
          'GhostWingMiniHUD',
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
        );

        if (popup) {
          pipWindowRef.current = popup;
          document.querySelectorAll('style, link[rel="stylesheet"]').forEach((styleSheet) => {
            try {
              popup.document.head.appendChild(styleSheet.cloneNode(true));
            } catch (e) {
              console.warn('Could not copy stylesheet to popup', e);
            }
          });

          popup.document.title = 'GhostWing Mini-HUD (Webcam Teleprompter)';
          popup.document.body.className = 'bg-[#07080B] text-slate-100 p-0 m-0 overflow-y-auto selection:bg-purple-500/30 selection:text-white antialiased font-sans';

          popup.addEventListener('pagehide', () => {
            pipWindowRef.current = null;
            setPipContainer(null);
            setIsPipActive(false);
          });

          setPipContainer(popup.document.body);
          setIsPipActive(true);
          return true;
        }
      } catch (popupErr) {
        console.error('Popup window fallback failed:', popupErr);
      }
    }

    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        try {
          pipWindowRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isPipActive,
    isSupported,
    pipContainer,
    openPip,
    closePip
  };
}
