class ResizeObserverPolyfillForJsdom {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const installResizeObserverPolyfill = () => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = ResizeObserverPolyfillForJsdom as unknown as typeof ResizeObserver
  }
}

const installVisualViewportPolyfill = () => {
  if (typeof window === 'undefined' || typeof window.visualViewport !== 'undefined') return

  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    writable: true,
    value: {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetLeft: 0,
      offsetTop: 0,
      scale: 1,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  })
}

installResizeObserverPolyfill()
installVisualViewportPolyfill()
