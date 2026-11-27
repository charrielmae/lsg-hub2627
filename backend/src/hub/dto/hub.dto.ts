import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ClearanceStatus,
  MembershipStatus,
  OrgType,
} from '../erd.types';

export class CreateOrganizationDto {
  @IsOptional()
  @IsString()
  collegeId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsIn(['ORG', 'LSG', 'COUNCIL'])
  type: OrgType;
}

export class AssignOfficerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateRequirementDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class MembershipFileInputDto {
  @IsString()
  @IsNotEmpty()
  requirementId: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileKey: string;
}

export class ApplyMembershipDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MembershipFileInputDto)
  files?: MembershipFileInputDto[];
}

export class UpdateMembershipStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status: MembershipStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class CreateFeeItemDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(100)
  amountCentavos: number;

  @IsString()
  @IsNotEmpty()
  semester: string;

  @IsString()
  @IsNotEmpty()
  schoolYear: string;
}

export class CheckoutPaymentDto {
  @IsString()
  @IsNotEmpty()
  feeItemId: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class UpsertClearanceDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  collegeId?: string;

  @IsString()
  @IsNotEmpty()
  semester: string;

  @IsIn(['CLEARED', 'PENDING', 'HOLD'])
  status: ClearanceStatus;
}

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  studentNo?: string;

  @IsOptional()
  @IsString()
  contactNo?: string;

  @IsOptional()
  @IsString()
  regionCode?: string;

  @IsOptional()
  @IsString()
  regionName?: string;

  @IsOptional()
  @IsString()
  provinceCode?: string;

  @IsOptional()
  @IsString()
  provinceName?: string;

  @IsOptional()
  @IsString()
  cityCode?: string;

  @IsOptional()
  @IsString()
  cityName?: string;

  @IsOptional()
  @IsString()
  barangayCode?: string;

  @IsOptional()
  @IsString()
  barangayName?: string;
}
