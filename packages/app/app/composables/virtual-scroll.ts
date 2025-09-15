export function useVirtualScroll() {
  const isScrollActive = useState('isVirtualScrollActive', () => false);
  const scrollTop = useState('scrollTop', () => 0);

  return {
    isScrollActive: readonly(isScrollActive),
    enableVirtualScroll: () => {
      isScrollActive.value = true;
    },
    disableVirtualScroll: () => {
      isScrollActive.value = false;
    },
    scrollTop: readonly(scrollTop),
    setScrollTop: (newScrollTop: number) => {
      scrollTop.value = newScrollTop;
    },
  };
}
