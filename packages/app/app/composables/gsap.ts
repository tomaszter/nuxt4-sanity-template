export function useGsap() {
  return useNuxtApp().$gsap;
}

export function useGsapScrollTrigger() {
  return useNuxtApp().$ScrollTrigger;
}

// Replace with Lenis
// export function useGsapScrollSmoother() {
//   return useNuxtApp().$ScrollSmoother;
// }

export function useScrollTo() {
  const gsap = useGsap();
  //   const mainScroller = useMainScrollerInstance();

  const defaults = {
    offset: 0,
    duration: 600,
  };

  return (target: Element | string | number | null = null, config = {}) => {
    return new Promise<void>(resolve => {
      if (!target) {
        return resolve();
      }

      const settings = { ...defaults, ...config };

      // const scroller = toValue(mainScroller);

      // if (scroller) {
      //   scroller.scrollTo(
      //     target,
      //     true,
      //     `top ${settings.offset !== 0 ? settings.offset : 'top'}`
      //   );
      // } else {
      gsap.to(window, {
        duration: settings.duration / 1000,
        scrollTo: { y: target, offsetY: settings.offset },
        ease: 'expo.inOut',
        onComplete: () => {
          resolve();
        },
      });
      // }
    });
  };
}
