export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
};

export const sizes = Object.values(breakpoints).sort;

// For tailwind config
export const screens = (
  Object.keys(breakpoints) as (keyof typeof breakpoints)[]
).reduce(
  (results, breakpoint) => {
    results[breakpoint] = `${breakpoints[breakpoint]}px`;
    return results;
  },
  {} as Record<keyof typeof breakpoints, string>
);

// An object where the key is the name of the detected device, and the value is the breakpoint key.
export const defaultBreakpoints = {
  desktop: 'lg',
  mobile: 'xs',
  tablet: 'md',
};

export const fallbackBreakpoint = 'lg';
