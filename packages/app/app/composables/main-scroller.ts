import type { ShallowRef } from 'vue';
import type Lenis from 'lenis';
import type { LenisOptions } from 'lenis';

const SCROLLER_INJECTION_KEY = 'mainScroller';
const LENIS_INSTANCE_ID = SCROLLER_INJECTION_KEY;

const isTouchDevice = () => useGsapScrollTrigger().isTouch === 1;

export function useMainScrollerSetup(
  contentRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
  wrapperRef: MaybeRefOrGetter<HTMLElement | null | undefined>
) {
  const nuxtApp = useNuxtApp();
  const gsap = useGsap();
  const lenis = useLenis();
  const scrollTrigger = useGsapScrollTrigger();
  const { enableVirtualScroll, disableVirtualScroll, setScrollTop } =
    useVirtualScroll();

  const mainScroller = shallowRef<Lenis | null>(null);

  provide(SCROLLER_INJECTION_KEY, shallowReadonly(mainScroller));

  let fallbackScrollListener: (() => void) | null = null;

  tryOnMounted(() => {
    nextTick(() => {
      setupScroller();
    });
  });

  // NOTE: we have some issue when the scroller in blinking
  // when navigating back through the browser history
  // Workaround: pause ScrollSmoother before page starts load to avoid page jump
  // and resume ScrollSmoother after page loaded
  const unregisterStartHook = nuxtApp.hooks.hook('page:loading:start', () => {
    mainScroller.value?.stop();
  });
  const unregisterEndHook = nuxtApp.hooks.hook('page:loading:end', () => {
    mainScroller.value?.start();
  });

  tryOnBeforeUnmount(() => {
    unregisterStartHook();
    unregisterEndHook();
    destroyScroller();
  });

  type SetupScrollerOptions = LenisOptions & { effects?: boolean };

  function setupScroller(config: SetupScrollerOptions = {}) {
    // scrollTrigger.config({
    //   limitCallbacks: true,
    //   ignoreMobileResize: true,
    // });

    const defaults: SetupScrollerOptions = {
      lerp: 0.8,
      // ease: 'power4',
      // effects: true,
      content: toValue(contentRef) ?? undefined,
      wrapper: toValue(wrapperRef) ?? undefined,
    };

    const settings: SetupScrollerOptions = {
      ...defaults,
      ...config,
    };

    if (isTouchDevice()) {
      // is touch device
      destroyScroller();

      fallbackScrollListener = registerFallbackScrollListener();
    } else {
      fallbackScrollListener?.();

      // is mouse device
      mainScroller.value = lenis.create(LENIS_INSTANCE_ID, settings);

      mainScroller.value.on('scroll', ({ scroll }) => {
        setScrollTop(scroll);
      });

      enableVirtualScroll();

      if (settings.effects) {
        nextTick(() => {
          document.querySelectorAll<HTMLElement>('[data-speed]').forEach(el => {
            mainScroller.value?.on('scroll', ({ scroll }) => {
              const speed = parseFloat(el.dataset.speed || '1');

              // Basic parallax effect: move based on scroll * speed
              el.style.transform = `translate3d(0, ${-scroll * (1 - speed)}px, 0)`;
            });
            scrollTrigger.refresh();
          });
        });
      }
    }
  }

  function destroyScroller() {
    if (mainScroller.value) {
      gsap.set(toValue(contentRef) ?? null, { clearProps: 'all' });
      lenis.destroy(LENIS_INSTANCE_ID);
    }
    mainScroller.value = null;
    disableVirtualScroll();
    fallbackScrollListener?.();
  }

  function registerFallbackScrollListener() {
    window.addEventListener('scroll', scrollListener, { passive: true });

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }

  function scrollListener() {
    setScrollTop(window.pageYOffset);
  }

  return {
    mainScroller,
  };
}

export function useMainScrollerInstance() {
  return inject<ShallowRef<ScrollSmoother | null>>(SCROLLER_INJECTION_KEY);
}

export function onMainScrollerReady(cb: (scroller?: ScrollSmoother) => void) {
  const mainScroller = useMainScrollerInstance();

  if (
    typeof mainScroller === 'undefined' ||
    mainScroller.value ||
    isTouchDevice()
  ) {
    tryOnMounted(() => {
      cb();
    });
  } else {
    watchOnce(mainScroller, scroller => {
      if (scroller) {
        cb(scroller);
      }
    });
  }
}
