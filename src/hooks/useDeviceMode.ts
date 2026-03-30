import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '../lib/constants';

export type DeviceMode = 'metaverse' | 'mobile';

export function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>(
    window.innerWidth >= MOBILE_BREAKPOINT ? 'metaverse' : 'mobile'
  );

  useEffect(() => {
    const handleResize = () => {
      setMode(window.innerWidth >= MOBILE_BREAKPOINT ? 'metaverse' : 'mobile');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return mode;
}
