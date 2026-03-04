import { PIPELINE_STATUSES } from "@/lib/constants";

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export type ApplicationInput = {
  company: string;
  role: string;
  jobUrl?: string;
  platform: string;
  status?: PipelineStatus;
  salary?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  appliedAt?: string;
};

export type ApplicationCard = {
  id: string;
  company: string;
  role: string;
  platform: string;
  status: PipelineStatus;
  appliedAt: string | null;
  updatedAt: string;
  notes: string | null;
};

export type StatusChangePayload = {
  fromStatus: PipelineStatus;
  toStatus: PipelineStatus;
};

export type EmailTemplateInput = {
  name: string;
  subject: string;
  body: string;
};

export type ParsedExcelRow = {
  companyName: string;
  hrEmail?: string;
  hrName?: string;
  jobTitle: string;
  jobUrl?: string;
};