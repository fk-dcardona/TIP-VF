// Performance monitoring utility
export const performanceMonitor = {
  measureRender: (componentName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        if (renderTime > 100) {
          console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
        }
      };
    }
    return () => {};
  },
  
  detectMemoryLeaks: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        console.error('Memory usage is critically high!');
      }
    }
  }
};
