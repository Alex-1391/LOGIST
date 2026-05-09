import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: any = {},
    ipAddress: string = '',
    userAgent: string = '',
  ) {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getLogs(userId?: string, action?: string, limit: number = 100) {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (userId) {
      query.where('audit.userId = :userId', { userId });
    }

    if (action) {
      query.andWhere('audit.action = :action', { action });
    }

    return query.orderBy('audit.timestamp', 'DESC').limit(limit).getMany();
  }
}
