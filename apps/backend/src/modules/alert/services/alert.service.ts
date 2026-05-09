import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AlertRule } from '@/entities/alert-rule.entity';
import { Alert } from '@/entities/alert.entity';
import { GpsService } from '../gps/services/gps.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectQueue('alerts')
    private alertQueue: Queue,
    private gpsService: GpsService,
  ) {}

  /**
   * Create a new alert rule
   */
  async createRule(ruleData: any): Promise<AlertRule> {
    const rule = this.alertRuleRepository.create({
      name: ruleData.name,
      description: ruleData.description,
      condition: ruleData.condition,
      action: ruleData.action,
      enabled: true,
      priority: ruleData.priority || 'medium',
      createdBy: ruleData.createdBy,
    });

    return this.alertRuleRepository.save(rule);
  }

  /**
   * Evaluate all enabled rules against a location
   */
  async evaluateRules(vehicleId: string, location: any): Promise<Alert[]> {
    const rules = await this.alertRuleRepository.find({
      where: { enabled: true },
    });

    const triggeredAlerts: Alert[] = [];

    for (const rule of rules) {
      const isTriggered = this.evaluateCondition(rule.condition, location);

      if (isTriggered) {
        const alert = await this.createAlert(vehicleId, rule);
        triggeredAlerts.push(alert);

        // Queue for processing
        await this.alertQueue.add(
          'process-alert',
          {
            alertId: alert.id,
            vehicleId,
            ruleId: rule.id,
          },
          { delay: 0 },
        );
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: any, location: any): boolean {
    switch (condition.type) {
      case 'speed_threshold':
        return location.speed > condition.value;

      case 'geofence_exit':
        return condition.geofenceId && location.geofenceExited === condition.geofenceId;

      case 'harsh_acceleration':
        return location.acceleration > condition.value;

      case 'harsh_braking':
        return location.deceleration > condition.value;

      case 'harsh_cornering':
        return location.cornering > condition.value;

      case 'off_route':
        return location.offRoute === true;

      case 'idle_time':
        return location.idleSeconds > condition.value;

      default:
        return false;
    }
  }

  /**
   * Create alert
   */
  async createAlert(vehicleId: string, rule: AlertRule): Promise<Alert> {
    const alert = this.alertRepository.create({
      vehicleId,
      ruleId: rule.id,
      title: rule.name,
      description: rule.description,
      priority: rule.priority,
      status: 'open',
      riskScore: this.calculateRiskScore(rule.priority),
      createdAt: new Date(),
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Calculate risk score based on priority
   */
  private calculateRiskScore(priority: string): number {
    const scores = {
      low: 1,
      medium: 5,
      high: 8,
      critical: 10,
    };
    return scores[priority] || 5;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(vehicleId?: string, limit: number = 100): Promise<Alert[]> {
    const query = this.alertRepository.createQueryBuilder('alert');

    query.where('alert.status = :status', { status: 'open' });

    if (vehicleId) {
      query.andWhere('alert.vehicleId = :vehicleId', { vehicleId });
    }

    return query.orderBy('alert.createdAt', 'DESC').limit(limit).getMany();
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    return this.alertRepository.save(alert);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, userId: string, notes?: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = 'resolved';
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    alert.notes = notes;

    return this.alertRepository.save(alert);
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(vehicleId?: string, hours: number = 24): Promise<any> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const query = this.alertRepository.createQueryBuilder('alert');

    query.where('alert.createdAt > :since', { since });

    if (vehicleId) {
      query.andWhere('alert.vehicleId = :vehicleId', { vehicleId });
    }

    const total = await query.getCount();
    const byPriority = await query.select('alert.priority, COUNT(*) as count').groupBy('alert.priority').getRawMany();
    const byStatus = await query.select('alert.status, COUNT(*) as count').groupBy('alert.status').getRawMany();

    return {
      total,
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p.count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.count])),
    };
  }
}
