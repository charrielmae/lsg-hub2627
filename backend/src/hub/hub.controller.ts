import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import {
  ApplyMembershipDto,
  AssignOfficerDto,
  CheckoutPaymentDto,
  CreateAnnouncementDto,
  CreateFeeItemDto,
  CreateOrganizationDto,
  CreateRequirementDto,
  UpdateMembershipStatusDto,
  UpdateStudentProfileDto,
  UpsertClearanceDto,
} from './dto/hub.dto';
import { AuthenticatedUser } from './erd.types';
import { HubService } from './hub.service';

@Controller('hub')
@UseGuards(AuthGuard)
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Get('snapshot')
  getSnapshot(@Req() req: { user: AuthenticatedUser }) {
    return this.hubService.getSnapshot(req.user);
  }

  @Post('organizations')
  createOrganization(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.hubService.createOrganization(req.user, dto);
  }

  @Post('organizations/:id/officers')
  assignOfficer(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') organizationId: string,
    @Body() dto: AssignOfficerDto,
  ) {
    return this.hubService.assignOfficer(req.user, organizationId, dto);
  }

  @Post('organizations/:id/requirements')
  addRequirement(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') organizationId: string,
    @Body() dto: CreateRequirementDto,
  ) {
    return this.hubService.addRequirement(req.user, organizationId, dto);
  }

  @Post('memberships')
  applyMembership(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: ApplyMembershipDto,
  ) {
    return this.hubService.applyMembership(req.user, dto);
  }

  @Patch('memberships/:id/status')
  updateMembershipStatus(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') membershipId: string,
    @Body() dto: UpdateMembershipStatusDto,
  ) {
    return this.hubService.updateMembershipStatus(req.user, membershipId, dto);
  }

  @Post('announcements')
  createAnnouncement(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.hubService.createAnnouncement(req.user, dto);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ) {
    return this.hubService.deleteAnnouncement(req.user, id);
  }

  @Post('fee-items')
  createFeeItem(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateFeeItemDto,
  ) {
    return this.hubService.createFeeItem(req.user, dto);
  }

  @Post('payments/checkout')
  checkoutPayment(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CheckoutPaymentDto,
  ) {
    return this.hubService.checkoutPayment(req.user, dto);
  }

  @Post('clearances')
  upsertClearance(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: UpsertClearanceDto,
  ) {
    return this.hubService.upsertClearance(req.user, dto);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: UpdateStudentProfileDto,
  ) {
    const user = await this.hubService.updateProfile(req.user, dto);
    return { user };
  }
}
