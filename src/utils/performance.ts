interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

const METRICS: Metric[] = [];
const MAX_METRICS = 1000;

class PerformanceMonitor {
  static markStart(name: string): number {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    return startTime;
  }

  static markEnd(name: string, startTime: number, tags: Record<string, string> = {}): void {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const duration = performance.now() - startTime;
    this.recordMetric({
      name,
      value: duration,
      tags,
      timestamp: Date.now()
    });
  }

  static recordMetric(metric: Omit<Metric, 'timestamp'>): void {
    if (METRICS.length >= MAX_METRICS) {
      METRICS.shift();
    }
    
    METRICS.push({
      ...metric,
      timestamp: Date.now()
    });
  }

  static getMetrics(filter?: (metric: Metric) => boolean): Metric[] {
    return filter ? METRICS.filter(filter) : [...METRICS];
  }

  static getMetricsByName(name: string): Metric[] {
    return this.getMetrics(m => m.name === name);
  }

  static getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.value, 0);
    return total / metrics.length;
  }

  static clearMetrics(): void {
    METRICS.length = 0;
  }

  static async sendMetricsToBackend(apiUrl: string): Promise<void> {
    if (METRICS.length === 0) return;
    
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: METRICS,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
      
      this.clearMetrics();
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}

// Auto-send metrics every 30 seconds
const METRICS_INTERVAL = 30 * 1000;
let metricsInterval: NodeJS.Timeout;

const startMetricsCollection = (apiUrl: string) => {
  if (metricsInterval) clearInterval(metricsInterval);
  
  metricsInterval = setInterval(
    () => PerformanceMonitor.sendMetricsToBackend(apiUrl),
    METRICS_INTERVAL
  );
  
  // Send final metrics when page unloads
  window.addEventListener('beforeunload', () => {
    PerformanceMonitor.sendMetricsToBackend(apiUrl);
  });
};

const stopMetricsCollection = () => {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
};

export { PerformanceMonitor, startMetricsCollection, stopMetricsCollection };
