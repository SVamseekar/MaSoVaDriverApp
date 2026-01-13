/**
 * Performance Monitoring Utility
 *
 * Tracks app performance metrics for optimization.
 */

export interface PerformanceMetrics {
  screenName: string;
  renderTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private renderStartTimes: Map<string, number> = new Map();

  /**
   * Mark render start for a screen
   */
  markRenderStart(screenName: string): void {
    this.renderStartTimes.set(screenName, Date.now());
  }

  /**
   * Mark render end for a screen and calculate render time
   */
  markRenderEnd(screenName: string): void {
    const startTime = this.renderStartTimes.get(screenName);
    if (!startTime) {
      console.warn(`No start time found for screen: ${screenName}`);
      return;
    }

    const renderTime = Date.now() - startTime;

    const metric: PerformanceMetrics = {
      screenName,
      renderTime,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.renderStartTimes.delete(screenName);

    // Log slow renders
    if (renderTime > 1000) {
      console.warn(`Slow render detected: ${screenName} took ${renderTime}ms`);
    }

    // TODO: Send to analytics service
    // Analytics.logEvent('screen_render', metric);
  }

  /**
   * Get average render time for a screen
   */
  getAverageRenderTime(screenName: string): number {
    const screenMetrics = this.metrics.filter(m => m.screenName === screenName);
    if (screenMetrics.length === 0) return 0;

    const total = screenMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / screenMetrics.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.renderStartTimes.clear();
  }

  /**
   * Log memory usage (for debugging)
   */
  logMemoryUsage(): void {
    if (__DEV__) {
      // @ts-ignore - performance API may not be available
      if (global.performance && global.performance.memory) {
        // @ts-ignore
        const memory = global.performance.memory;
        console.log('Memory Usage:', {
          usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC to measure component render performance
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return class extends React.Component<P> {
    componentDidMount() {
      performanceMonitor.markRenderEnd(componentName);
    }

    componentWillMount() {
      performanceMonitor.markRenderStart(componentName);
    }

    render() {
      return <Component {...this.props} />;
    }
  };
}
