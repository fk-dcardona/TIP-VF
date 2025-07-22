/**
 * 📱 WhatsApp Alert Service
 * SuperClaude Optimized for Colombian Traders
 * 
 * Features:
 * - Multi-language support (Spanish default)
 * - Template management
 * - Interactive buttons
 * - Delivery tracking
 */

import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { formatCOP, formatUSD } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';

// Initialize clients
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Message templates
const MESSAGE_TEMPLATES = {
  es: {
    // Document processing
    document_ready: {
      title: '📄 Documento Procesado',
      body: `*{{documentType}}* procesado exitosamente

Operación: {{operationRef}}
Proveedor: {{supplierName}}

✅ Datos extraídos correctamente
✅ Validación completada

Ver detalles: {{actionUrl}}`,
    },
    
    document_error: {
      title: '⚠️ Error en Documento',
      body: `Error procesando *{{documentType}}*

Operación: {{operationRef}}
Error: {{errorMessage}}

Se requiere revisión manual.

Revisar ahora: {{actionUrl}}`,
    },
    
    // Cost alerts
    cost_threshold: {
      title: '💰 Alerta de Costos',
      body: `El factor de importación excede el límite

Operación: {{operationRef}}
Factor actual: {{importFactor}}x
Límite configurado: {{threshold}}x

Impacto estimado: {{impact}}

¿Desea continuar con la operación?`,
      buttons: ['Aprobar', 'Revisar detalles', 'Rechazar'],
    },
    
    // Delivery updates
    delivery_update: {
      title: '🚚 Actualización de Entrega',
      body: `*{{status}}*

Operación: {{operationRef}}
{{statusDetails}}

ETA actualizado: {{etaDate}}
Puerto: {{port}}

Rastrear envío: {{trackingUrl}}`,
    },
    
    customs_hold: {
      title: '🛑 Retención en Aduana',
      body: `Su carga está retenida en aduana

Operación: {{operationRef}}
Motivo: {{reason}}
Documentos requeridos: {{documents}}

⏰ Acción requerida antes de: {{deadline}}

Subir documentos: {{actionUrl}}`,
      buttons: ['Ver requerimientos', 'Contactar agente'],
    },
    
    // Payment reminders
    payment_due: {
      title: '💳 Pago Pendiente',
      body: `Recordatorio de pago

Proveedor: {{supplierName}}
Monto: {{amount}}
Vencimiento: {{dueDate}}

{{paymentDetails}}

¿Proceder con el pago?`,
      buttons: ['Pagar ahora', 'Ver factura', 'Posponer'],
    },
    
    // Daily summary
    daily_summary: {
      title: '📊 Resumen Diario TIP',
      body: `Buenos días! Aquí está su resumen:

📦 *Importaciones Activas*: {{activeImports}}
⚠️ *Alertas Pendientes*: {{pendingAlerts}}
💰 *Pagos Esta Semana*: {{weeklyPayments}}
🚚 *Llegadas Próximas*: {{upcomingArrivals}}

*Destacados de Hoy:*
{{highlights}}

Ver dashboard completo: {{dashboardUrl}}`,
    },
    
    // Onboarding
    welcome: {
      title: '🎉 Bienvenido a TIP',
      body: `¡Hola {{userName}}!

Su cuenta TIP está lista para revolucionar sus importaciones.

✅ Dashboard personalizado activo
✅ Procesamiento AI habilitado
✅ Alertas configuradas

Empezar ahora: {{loginUrl}}

¿Necesita ayuda? Responda AYUDA`,
    },
  },
  
  en: {
    // English templates (abbreviated for space)
    document_ready: {
      title: '📄 Document Processed',
      body: `*{{documentType}}* processed successfully...`,
    },
    // ... other English templates
  },
};

// Alert type configuration
interface AlertConfig {
  type: string;
  template: keyof typeof MESSAGE_TEMPLATES.es;
  priority: 'high' | 'medium' | 'low';
  requiresAction: boolean;
  expiresIn?: number; // hours
}

const ALERT_CONFIGS: Record<string, AlertConfig> = {
  document_ready: {
    type: 'document_ready',
    template: 'document_ready',
    priority: 'medium',
    requiresAction: false,
  },
  document_error: {
    type: 'document_error',
    template: 'document_error',
    priority: 'high',
    requiresAction: true,
    expiresIn: 24,
  },
  cost_threshold: {
    type: 'cost_threshold',
    template: 'cost_threshold',
    priority: 'high',
    requiresAction: true,
    expiresIn: 48,
  },
  delivery_update: {
    type: 'delivery_update',
    template: 'delivery_update',
    priority: 'low',
    requiresAction: false,
  },
  customs_hold: {
    type: 'customs_hold',
    template: 'customs_hold',
    priority: 'high',
    requiresAction: true,
    expiresIn: 24,
  },
  payment_due: {
    type: 'payment_due',
    template: 'payment_due',
    priority: 'high',
    requiresAction: true,
    expiresIn: 72,
  },
};

// Main WhatsApp Alert Service
export class WhatsAppAlertService {
  private rateLimiter: Map<string, number> = new Map();
  
  /**
   * Send alert to user
   */
  async sendAlert(
    phoneNumber: string,
    alertType: keyof typeof ALERT_CONFIGS,
    data: Record<string, any>,
    options: {
      language?: 'es' | 'en';
      buttons?: string[];
      mediaUrl?: string;
      scheduleFor?: Date;
    } = {}
  ) {
    try {
      // Check rate limits
      if (!this.checkRateLimit(phoneNumber)) {
        logger.warn('Rate limit exceeded', { phoneNumber, alertType });
        return { success: false, error: 'Rate limit exceeded' };
      }
      
      // Get alert configuration
      const config = ALERT_CONFIGS[alertType];
      if (!config) {
        throw new Error(`Unknown alert type: ${alertType}`);
      }
      
      // Get template
      const language = options.language || 'es';
      const templates = MESSAGE_TEMPLATES[language];
      const template = templates[config.template];
      
      // Prepare message
      const message = this.prepareMessage(template, data, options.buttons);
      
      // Send message
      const result = await this.sendWhatsAppMessage(
        phoneNumber,
        message,
        options.mediaUrl,
        options.scheduleFor
      );
      
      // Track delivery
      await this.trackDelivery(phoneNumber, alertType, result, data);
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp alert', { error, phoneNumber, alertType });
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Send daily summary to all active users
   */
  async sendDailySummaries() {
    logger.info('Starting daily summary distribution');
    
    // Get all active users with WhatsApp enabled
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        phone,
        full_name,
        preferences,
        company:companies!inner(
          id,
          name,
          settings
        )
      `)
      .eq('is_active', true)
      .not('phone', 'is', null);
    
    if (error) {
      logger.error('Failed to fetch users for daily summary', { error });
      return;
    }
    
    // Send summaries
    const results = await Promise.allSettled(
      users.map(async (user: any) => {
        // Check if user wants WhatsApp summaries
        if (!user.preferences?.notifications?.whatsapp_alerts) {
          return { userId: user.id, skipped: true };
        }
        
        // Get user's metrics
        const metrics = await this.getUserDailyMetrics(user.company?.id || '');
        
        // Send summary
        return this.sendAlert(
          user.phone,
          'daily_summary',
          {
            userName: user.full_name.split(' ')[0],
            ...metrics,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
          { language: user.company?.settings?.language || 'es' }
        );
      })
    );
    
    // Log results
    const sent = results.filter(r => r.status === 'fulfilled' && r.value && 'success' in r.value && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.value && 'success' in r.value && !r.value.success)).length;
    
    logger.info('Daily summary distribution completed', { sent, failed, total: users.length });
  }
  
  /**
   * Handle incoming WhatsApp messages
   */
  async handleIncomingMessage(
    from: string,
    body: string,
    messageId: string
  ) {
    const normalizedBody = body.trim().toUpperCase();
    
    // Handle common commands
    switch (normalizedBody) {
      case 'AYUDA':
      case 'HELP':
        await this.sendHelpMessage(from);
        break;
        
      case 'ESTADO':
      case 'STATUS':
        await this.sendStatusUpdate(from);
        break;
        
      case 'ALERTAS':
      case 'ALERTS':
        await this.sendPendingAlerts(from);
        break;
        
      case 'STOP':
      case 'PARAR':
        await this.unsubscribeUser(from);
        break;
        
      default:
        // Check if it's a button response
        await this.handleButtonResponse(from, body, messageId);
    }
  }
  
  /**
   * Send WhatsApp message via Twilio
   */
  private async sendWhatsAppMessage(
    to: string,
    message: string,
    mediaUrl?: string,
    scheduleAt?: Date
  ) {
    const messageOptions: any = {
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    };
    
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }
    
    if (scheduleAt && scheduleAt > new Date()) {
      messageOptions.scheduleType = 'fixed';
      messageOptions.sendAt = scheduleAt;
    }
    
    return twilioClient.messages.create(messageOptions);
  }
  
  /**
   * Prepare message from template
   */
  private prepareMessage(
    template: any,
    data: Record<string, any>,
    buttons?: string[]
  ): string {
    let message = `${template.title}\n\n${template.body}`;
    
    // Replace variables
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, String(value));
    });
    
    // Add buttons if provided
    if (buttons && buttons.length > 0) {
      message += '\n\n*Responda con:*\n';
      buttons.forEach((button, index) => {
        message += `${index + 1}. ${button}\n`;
      });
    }
    
    return message;
  }
  
  /**
   * Check rate limits
   */
  private checkRateLimit(phoneNumber: string): boolean {
    const lastSent = this.rateLimiter.get(phoneNumber);
    const now = Date.now();
    
    // Allow 1 message per minute per number
    if (lastSent && now - lastSent < 60000) {
      return false;
    }
    
    this.rateLimiter.set(phoneNumber, now);
    return true;
  }
  
  /**
   * Track message delivery
   */
  private async trackDelivery(
    phoneNumber: string,
    alertType: string,
    result: any,
    data: Record<string, any>
  ) {
    // Find user by phone
    const { data: user } = await supabase
      .from('users')
      .select('id, company_id')
      .eq('phone', phoneNumber)
      .single();
    
    if (!user) return;
    
    // Update alert delivery status
    await supabase
      .from('alerts')
      .update({
        delivery_status: {
          whatsapp: {
            sent: true,
            messageId: result.sid,
            sentAt: new Date().toISOString(),
            status: result.status,
          },
        },
      })
      .eq('company_id', user.company_id)
      .eq('type', alertType)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour
  }
  
  /**
   * Get user's daily metrics
   */
  private async getUserDailyMetrics(companyId: string) {
    // Get active imports
    const { data: operations } = await supabase
      .from('import_operations')
      .select('id, status, eta_destination')
      .eq('company_id', companyId)
      .not('status', 'in', '(completed,cancelled)');
    
    // Get pending alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('id')
      .eq('company_id', companyId)
      .eq('resolved', false);
    
    // Get upcoming payments
    const { data: payments } = await supabase
      .from('operation_costs')
      .select('amount_cop, due_date')
      .eq('payment_status', 'pending')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
    
    // Calculate metrics
    const activeImports = operations?.length || 0;
    const pendingAlerts = alerts?.length || 0;
    const weeklyPayments = payments
      ? formatCOP(payments.reduce((sum, p) => sum + (p.amount_cop || 0), 0))
      : formatCOP(0);
    
    // Get upcoming arrivals
    const upcomingArrivals = operations?.filter(op => {
      if (!op.eta_destination) return false;
      const eta = new Date(op.eta_destination);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return eta <= weekFromNow;
    }).length || 0;
    
    // Build highlights
    const highlights = [];
    if (pendingAlerts > 0) {
      highlights.push(`• ${pendingAlerts} alertas requieren su atención`);
    }
    if (upcomingArrivals > 0) {
      highlights.push(`• ${upcomingArrivals} cargas llegarán esta semana`);
    }
    if (payments && payments.length > 0) {
      highlights.push(`• ${payments.length} pagos por realizar`);
    }
    
    return {
      activeImports,
      pendingAlerts,
      weeklyPayments,
      upcomingArrivals,
      highlights: highlights.join('\n') || '• Todo al día ✅',
    };
  }
  
  /**
   * Send help message
   */
  private async sendHelpMessage(to: string) {
    const helpMessage = `🤖 *Comandos Disponibles*

• ESTADO - Ver resumen de operaciones
• ALERTAS - Ver alertas pendientes
• AYUDA - Ver este mensaje
• STOP - Dejar de recibir mensajes

También puede visitar:
${process.env.NEXT_PUBLIC_APP_URL}

¿Necesita soporte humano?
📧 soporte@tip.app
📱 +57 300 123 4567`;
    
    await this.sendWhatsAppMessage(to, helpMessage);
  }
  
  /**
   * Send status update
   */
  private async sendStatusUpdate(phoneNumber: string) {
    // Get user and company
    const { data: user } = await supabase
      .from('users')
      .select('company_id')
      .eq('phone', phoneNumber)
      .single();
    
    if (!user) {
      await this.sendWhatsAppMessage(
        phoneNumber,
        'No encontramos una cuenta asociada a este número. Por favor contacte soporte.'
      );
      return;
    }
    
    // Get metrics
    const metrics = await this.getUserDailyMetrics(user.company_id);
    
    // Send update
    await this.sendAlert(phoneNumber, 'daily_summary', {
      ...metrics,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
  }
  
  /**
   * Send pending alerts
   */
  private async sendPendingAlerts(phoneNumber: string) {
    // Implementation for sending all pending alerts
    // This would fetch and send a summary of unresolved alerts
  }
  
  /**
   * Unsubscribe user from WhatsApp alerts
   */
  private async unsubscribeUser(phoneNumber: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phoneNumber)
      .single();
    
    if (user) {
      await supabase
        .from('users')
        .update({
          preferences: {
            notifications: {
              whatsapp_alerts: false,
            },
          },
        })
        .eq('id', user.id);
    }
    
    await this.sendWhatsAppMessage(
      phoneNumber,
      'Has sido desuscrito de las alertas por WhatsApp. Puedes reactivarlas en cualquier momento desde tu dashboard.'
    );
  }
  
  /**
   * Handle button responses
   */
  private async handleButtonResponse(
    from: string,
    body: string,
    messageId: string
  ) {
    // Implementation for handling button responses
    // This would map numeric responses to button actions
  }
}

// Export singleton instance
export const whatsAppAlerts = new WhatsAppAlertService();

// Schedule daily summaries
if (process.env.NODE_ENV === 'production') {
  // Schedule for 8 AM Colombia time
  const scheduleDailySummaries = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(8, 0, 0, 0); // 8 AM
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeout = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      whatsAppAlerts.sendDailySummaries();
      scheduleDailySummaries(); // Schedule next day
    }, timeout);
  };
  
  scheduleDailySummaries();
}