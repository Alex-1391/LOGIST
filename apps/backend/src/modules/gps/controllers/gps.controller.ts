import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GpsService } from '../services/gps.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('GPS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gps')
export class GpsController {
  constructor(private gpsService: GpsService) {}

  @Post('location')
  async ingestLocation(@Body() locationData: any, @Req() req) {
    const { vehicleId, latitude, longitude, altitude, accuracy, speed, heading, metadata } =
      locationData;

    return this.gpsService.ingestLocation(
      vehicleId,
      {
        latitude,
        longitude,
        altitude,
        accuracy,
        speed,
        heading,
        metadata,
      },
      req.user.id,
    );
  }

  @Get('location/:vehicleId')
  async getLastLocation(@Param('vehicleId') vehicleId: string) {
    return this.gpsService.getLastLocation(vehicleId);
  }

  @Get('history/:vehicleId')
  async getHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('limit') limit: number = 100,
    @Query('hours') hours: number = 24,
  ) {
    return this.gpsService.getLocationHistory(vehicleId, limit, hours);
  }

  @Get('nearby')
  async getNearby(
    @Query('lat') latitude: number,
    @Query('lon') longitude: number,
    @Query('radius') radius: number = 5,
  ) {
    return this.gpsService.getNearbyVehicles(latitude, longitude, radius);
  }

  @Get('stats/:vehicleId')
  async getStats(@Param('vehicleId') vehicleId: string, @Query('hours') hours: number = 24) {
    return this.gpsService.getVehicleStats(vehicleId, hours);
  }
}
