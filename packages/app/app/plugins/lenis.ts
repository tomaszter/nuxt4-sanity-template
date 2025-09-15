import Lenis from 'lenis';
import type { LenisOptions } from 'lenis';

type LenisInstanceId = string | number | symbol;

// Copied from https://github.com/MilkshakeStudio/nuxt-lenis
export default defineNuxtPlugin({
  name: 'lenis',
  setup() {
    const scrollTrigger = useNuxtApp().$ScrollTrigger;

    // Storage for Lenis ticker raf callbacks to unsubscribe
    const tickerRafCallbacks = new Map<
      LenisInstanceId,
      (time: number) => void
    >();

    // Centralized storage for Lenis instances and their scroll states
    const instances = reactive(new Map<LenisInstanceId, Lenis>());
    const defaultInstanceId = ref<LenisInstanceId | null>(null);

    const createLenis = (
      id: LenisInstanceId,
      options: LenisOptions = {}
    ): Lenis => {
      if (instances.has(id)) {
        console.warn(
          `[Lenis] Instance with ID "${id.toString()}" already exists.`
        );
        return instances.get(id) as Lenis;
      }

      // Initialize a new Lenis instance for smooth scrolling
      const lenis = new Lenis(options);

      // Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
      lenis.on('scroll', scrollTrigger.update);

      // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
      // This ensures Lenis's smooth scroll animation updates on each GSAP tick
      const rafCb = (time: number) => {
        lenis.raf(time * 1000); // Convert time from seconds to milliseconds
      };
      gsap.ticker.add(rafCb);

      tickerRafCallbacks.set(id, rafCb);

      // Disable lag smoothing in GSAP to prevent any delay in scroll animations
      gsap.ticker.lagSmoothing(0);

      instances.set(id, lenis);

      // Automatically set as default instance
      if (!defaultInstanceId.value) {
        defaultInstanceId.value = id;
      }

      return lenis;
    };

    const getLenis = (id?: LenisInstanceId) => {
      const targetId = id || defaultInstanceId.value;
      if (!targetId) {
        console.warn(`[Lenis] No instances created.`);
        return null;
      } else if (!instances.has(targetId)) {
        console.warn(
          `[Lenis] No instance found for ID "${targetId.toString()}".`
        );
        return null;
      }

      return instances.get(targetId);
    };

    const destroyLenis = (id: LenisInstanceId) => {
      if (!instances.has(id)) {
        console.warn(`[Lenis] No instance found for ID "${id.toString()}".`);
        return;
      }

      const rafCb = tickerRafCallbacks.get(id);
      if (rafCb) {
        gsap.ticker.remove(rafCb);
      }

      instances.get(id)?.destroy();
      instances.delete(id);

      if (defaultInstanceId.value === id) {
        defaultInstanceId.value =
          instances.size > 0 ? (Array.from(instances.keys())[0] ?? null) : null;
      }
    };

    return {
      provide: {
        lenis: {
          create: createLenis,
          get: getLenis,
          destroy: destroyLenis,
        },
      },
    };
  },
});
