/**
 * Real-Time Observer Pattern - Advanced SOLID Implementation
 * Allows components to subscribe to real-time data updates
 * Follows Open/Closed Principle - new observers can be added without modifying existing code
 */

// Observer interface
export interface Observer {
  id: string;
  update(data: any): void;
  getSubscribedEvents(): string[];
}

// Subject interface
export interface Subject {
  attach(observer: Observer, events?: string[]): void;
  detach(observerId: string): void;
  notify(event: string, data: any): void;
  getObservers(): Observer[];
}

// Event types
export type EventType = 
  | 'metrics-update'
  | 'analytics-update'
  | 'document-update'
  | 'alert-update'
  | 'system-status'
  | 'user-activity'
  | 'performance-metrics'
  | 'error-notification';

// Event data interface
export interface EventData {
  type: EventType;
  timestamp: Date;
  data: any;
  source?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Real-time subject implementation
export class RealTimeSubject implements Subject {
  private observers: Map<string, Observer> = new Map();
  private eventSubscriptions: Map<string, Set<string>> = new Map(); // event -> observer IDs
  private observerEvents: Map<string, Set<string>> = new Map(); // observer ID -> events

  attach(observer: Observer, events?: string[]): void {
    this.observers.set(observer.id, observer);
    
    // Subscribe to specific events or all events
    const subscribedEvents = events || observer.getSubscribedEvents();
    
    for (const event of subscribedEvents) {
      // Add observer to event subscription
      if (!this.eventSubscriptions.has(event)) {
        this.eventSubscriptions.set(event, new Set());
      }
      this.eventSubscriptions.get(event)!.add(observer.id);
      
      // Add event to observer's subscription list
      if (!this.observerEvents.has(observer.id)) {
        this.observerEvents.set(observer.id, new Set());
      }
      this.observerEvents.get(observer.id)!.add(event);
    }
    
    console.log(`Observer ${observer.id} attached to events: ${subscribedEvents.join(', ')}`);
  }

  detach(observerId: string): void {
    const observer = this.observers.get(observerId);
    if (!observer) {
      console.warn(`Observer ${observerId} not found`);
      return;
    }

    // Remove observer from all event subscriptions
    const events = this.observerEvents.get(observerId);
    if (events) {
      for (const event of events) {
        const eventObservers = this.eventSubscriptions.get(event);
        if (eventObservers) {
          eventObservers.delete(observerId);
          if (eventObservers.size === 0) {
            this.eventSubscriptions.delete(event);
          }
        }
      }
      this.observerEvents.delete(observerId);
    }

    this.observers.delete(observerId);
    console.log(`Observer ${observerId} detached`);
  }

  notify(event: string, data: any): void {
    const eventObservers = this.eventSubscriptions.get(event);
    if (!eventObservers || eventObservers.size === 0) {
      return;
    }

    const eventData: EventData = {
      type: event as EventType,
      timestamp: new Date(),
      data,
      source: 'real-time-subject'
    };

    console.log(`Notifying ${eventObservers.size} observers of event: ${event}`);
    
    for (const observerId of eventObservers) {
      const observer = this.observers.get(observerId);
      if (observer) {
        try {
          observer.update(eventData);
        } catch (error) {
          console.error(`Error updating observer ${observerId}:`, error);
        }
      }
    }
  }

  getObservers(): Observer[] {
    return Array.from(this.observers.values());
  }

  /**
   * Get observers subscribed to a specific event
   */
  getObserversForEvent(event: string): Observer[] {
    const eventObservers = this.eventSubscriptions.get(event);
    if (!eventObservers) {
      return [];
    }

    return Array.from(eventObservers)
      .map(id => this.observers.get(id))
      .filter((observer): observer is Observer => observer !== undefined);
  }

  /**
   * Get events that an observer is subscribed to
   */
  getEventsForObserver(observerId: string): string[] {
    const events = this.observerEvents.get(observerId);
    return events ? Array.from(events) : [];
  }

  /**
   * Get all subscribed events
   */
  getAllSubscribedEvents(): string[] {
    return Array.from(this.eventSubscriptions.keys());
  }

  /**
   * Get observer statistics
   */
  getStats(): { totalObservers: number; totalEvents: number; eventSubscriptions: Record<string, number> } {
    const eventSubscriptions: Record<string, number> = {};
    
    for (const [event, observers] of this.eventSubscriptions) {
      eventSubscriptions[event] = observers.size;
    }

    return {
      totalObservers: this.observers.size,
      totalEvents: this.eventSubscriptions.size,
      eventSubscriptions
    };
  }
}

// Real-time data manager
export class RealTimeDataManager {
  private subject: RealTimeSubject;
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.subject = new RealTimeSubject();
  }

  /**
   * Start real-time updates
   */
  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      console.warn('Real-time updates already running');
      return;
    }

    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.generateRealTimeUpdates();
    }, intervalMs);

    console.log(`Real-time updates started with ${intervalMs}ms interval`);
  }

  /**
   * Stop real-time updates
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('Real-time updates stopped');
  }

  /**
   * Get the subject for attaching observers
   */
  getSubject(): RealTimeSubject {
    return this.subject;
  }

  /**
   * Manually trigger an update
   */
  triggerUpdate(event: EventType, data: any): void {
    this.subject.notify(event, data);
  }

  /**
   * Generate mock real-time updates
   */
  private generateRealTimeUpdates(): void {
    // Generate metrics update
    const metricsData = {
      totalInventory: Math.floor(Math.random() * 2000) + 1000,
      totalInventoryValue: Math.floor(Math.random() * 1000000) + 500000,
      criticalAlerts: Math.floor(Math.random() * 5),
      activeSuppliers: Math.floor(Math.random() * 20) + 10
    };
    this.subject.notify('metrics-update', metricsData);

    // Generate analytics update
    const analyticsData = {
      salesScore: Math.floor(Math.random() * 20) + 80,
      financialScore: Math.floor(Math.random() * 20) + 80,
      supplyChainScore: Math.floor(Math.random() * 20) + 80,
      documentScore: Math.floor(Math.random() * 20) + 80
    };
    this.subject.notify('analytics-update', analyticsData);

    // Generate document update (less frequent)
    if (Math.random() < 0.3) {
      const documentData = {
        totalDocuments: Math.floor(Math.random() * 10) + 40,
        validatedDocuments: Math.floor(Math.random() * 8) + 35,
        compromisedInventory: Math.floor(Math.random() * 3),
        crossReferenceScore: Math.floor(Math.random() * 20) + 80
      };
      this.subject.notify('document-update', documentData);
    }

    // Generate alert update (occasional)
    if (Math.random() < 0.1) {
      const alertData = {
        id: `alert-${Date.now()}`,
        type: 'inventory',
        message: 'Low stock alert: Product XYZ-123',
        priority: 'high' as const,
        timestamp: new Date()
      };
      this.subject.notify('alert-update', alertData);
    }

    // Generate system status update
    const systemData = {
      status: 'healthy',
      uptime: Math.floor(Math.random() * 100) + 900,
      responseTime: Math.floor(Math.random() * 100) + 50,
      memoryUsage: Math.floor(Math.random() * 20) + 60
    };
    this.subject.notify('system-status', systemData);
  }
}

// Dashboard observer implementation
export class DashboardObserver implements Observer {
  id: string;
  private updateCallback: (data: EventData) => void;
  private subscribedEvents: string[];

  constructor(id: string, updateCallback: (data: EventData) => void, events: string[] = []) {
    this.id = id;
    this.updateCallback = updateCallback;
    this.subscribedEvents = events;
  }

  update(data: EventData): void {
    this.updateCallback(data);
  }

  getSubscribedEvents(): string[] {
    return this.subscribedEvents;
  }

  /**
   * Update subscribed events
   */
  updateSubscriptions(events: string[]): void {
    this.subscribedEvents = events;
  }
}

// Metrics observer implementation
export class MetricsObserver implements Observer {
  id = 'metrics-observer';
  private metricsCallback: (metrics: any) => void;

  constructor(metricsCallback: (metrics: any) => void) {
    this.metricsCallback = metricsCallback;
  }

  update(data: EventData): void {
    if (data.type === 'metrics-update') {
      this.metricsCallback(data.data);
    }
  }

  getSubscribedEvents(): string[] {
    return ['metrics-update'];
  }
}

// Analytics observer implementation
export class AnalyticsObserver implements Observer {
  id = 'analytics-observer';
  private analyticsCallback: (analytics: any) => void;

  constructor(analyticsCallback: (analytics: any) => void) {
    this.analyticsCallback = analyticsCallback;
  }

  update(data: EventData): void {
    if (data.type === 'analytics-update') {
      this.analyticsCallback(data.data);
    }
  }

  getSubscribedEvents(): string[] {
    return ['analytics-update'];
  }
}

// Alert observer implementation
export class AlertObserver implements Observer {
  id = 'alert-observer';
  private alertCallback: (alert: any) => void;

  constructor(alertCallback: (alert: any) => void) {
    this.alertCallback = alertCallback;
  }

  update(data: EventData): void {
    if (data.type === 'alert-update') {
      this.alertCallback(data.data);
    }
  }

  getSubscribedEvents(): string[] {
    return ['alert-update'];
  }
}

// Export singleton instances
export const realTimeDataManager = new RealTimeDataManager();
export const realTimeSubject = realTimeDataManager.getSubject(); 