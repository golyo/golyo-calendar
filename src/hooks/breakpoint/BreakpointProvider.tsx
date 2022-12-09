import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import facepaint from 'facepaint';

const breakpoints = [576, 768, 992, 1200];

export const mq = facepaint(breakpoints.map(bp => `@media (min-width: ${bp}px)`));

export enum Breakpoints {
  xs = 'xs',
  sm = 'sm',
  md = 'md',
  lg = 'lg',
}

const getDeviceConfig = (width: number) => {
  if (width < breakpoints[0]) {
    return Breakpoints.xs;
  } else if (width < breakpoints[1]) {
    return Breakpoints.sm;
  } else if (width < breakpoints[2]) {
    return Breakpoints.md;
  }
  return Breakpoints.lg;
};

const BreakpointContext = createContext<string>(getDeviceConfig(window.innerWidth));

const throttle = (callback: Function, delay: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        callback.call(this, ...args);
        timeout = null;
      }, delay);
    }
  };
};

const BreakpointProvider = ({ children }: { children: React.ReactNode }) => {
  const [breakpoint, setBreakpoint] = useState<string>(getDeviceConfig(window.innerWidth));

  const setupBreakpoint = useCallback(() => {
    const br = getDeviceConfig(window.innerWidth);
    setBreakpoint(br);
  }, []);

  useEffect(() => {
    const throttled = throttle(setupBreakpoint, 200);
    window.addEventListener('resize', throttled);
    return () => {
      window.removeEventListener('resize', throttled);
    };
  }, [setupBreakpoint]);

  return <BreakpointContext.Provider value={breakpoint}>{children}</BreakpointContext.Provider>;
};

const useBreakpoint = () => useContext<string>(BreakpointContext);

export { useBreakpoint };

export default BreakpointProvider;
