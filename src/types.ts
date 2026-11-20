// Definisi tipe data TypeScript untuk seluruh entitas domain SKPFlow sesuai model data PRD.

export type UserRole = 'employee' | 'supervisor' | 'admin';

export type ActivityStatus = 'Belum dimulai' | 'Sedang dikerjakan' | 'Selesai';
export type ActivityPriority = 'Rendah' | 'Sedang' | 'Tinggi';
export type TargetStatus = 'Aktif' | 'Selesai' | 'Diarsipkan';
export type ReportStatus =
  | 'Draft'
  | 'Diajukan'
  | 'Dalam Review'
  | 'Perlu Revisi'
  | 'Disetujui';

export interface Unit {
  id: string;
  name: string;
  parent_unit_id: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  demo_password: string;
  full_name: string;
  nip: string;
  job_title: string;
  unit_id: string;
  supervisor_id: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface PerformanceTarget {
  id: string;
  user_id: string;
  title: string;
  description: string;
  indicator: string;
  target_value: number;
  unit: string;
  period_start: string;
  period_end: string;
  status: TargetStatus;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  target_id: string | null;
  activity_date: string;
  title: string;
  description: string;
  category: string;
  output_description: string;
  output_quantity: number | null;
  output_unit: string;
  duration_minutes: number | null;
  status: ActivityStatus;
  priority: ActivityPriority;
  tags: string[];
  challenges: string;
  follow_up: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityAttachment {
  id: string;
  activity_id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  data_url: string;
  created_at: string;
}

export interface ReportActivityRow {
  activity_id: string;
  activity_date: string;
  title: string;
  output_text: string;
  has_output: boolean;
  target_title: string;
}

export interface ReportTargetRow {
  target_id: string;
  target_title: string;
  indicator: string;
  target_display: string;
  realization_display: string;
  supporting_count: number;
}

export interface ReportChallengeRow {
  activity_date: string;
  activity_title: string;
  challenge: string;
  follow_up: string;
}

export interface MonthlyReportContent {
  header_title: string;
  executive_summary: string;
  activities_table: ReportActivityRow[];
  targets_table: ReportTargetRow[];
  output_recap: string;
  challenges_list: ReportChallengeRow[];
  closing_note: string;
  has_manual_edits: boolean;
}

export interface MonthlyReport {
  id: string;
  user_id: string;
  month: number;
  year: number;
  summary: string;
  report_content: MonthlyReportContent;
  status: ReportStatus;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportReview {
  id: string;
  report_id: string;
  reviewer_id: string;
  comments: string;
  status: ReportStatus;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
}

export interface WeeklySummaryNote {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  summary: string;
  updated_at: string;
}

export interface ReportTemplateConfig {
  header_title: string;
  default_closing: string;
  include_nip: boolean;
  organization_name: string;
}

export interface AppSettings {
  app_name: string;
  work_hours_label: string;
  max_attachment_mb: number;
  ai_assistant_enabled: boolean;
}

export interface AppState {
  currentUserId: string | null;
  units: Unit[];
  profiles: Profile[];
  categories: string[];
  targets: PerformanceTarget[];
  activities: Activity[];
  attachments: ActivityAttachment[];
  reports: MonthlyReport[];
  reviews: ReportReview[];
  weeklySummaries: WeeklySummaryNote[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  reportTemplate: ReportTemplateConfig;
  appSettings: AppSettings;
}

export interface QuickAddItem {
  id: string;
  selected: boolean;
  activity_date: string;
  title: string;
  description: string;
  category: string;
  target_id: string | null;
  output_description: string;
  output_quantity: number | null;
  output_unit: string;
  status: ActivityStatus;
}
