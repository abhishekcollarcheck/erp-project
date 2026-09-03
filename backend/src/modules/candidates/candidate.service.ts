import { Op, WhereOptions, fn, col, DATE } from 'sequelize';
import crypto from 'crypto';
import { Candidate, CandidateStatus } from '../../database/models/Candidate';
import { CandidateEmployment } from '../../database/models/CandidateEmployment';
import { AppError }    from '../../middleware/errorHandler.middleware';
import { Employee }     from '../../database/models/Employee';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { logActivity } from '../../utils/activityLogger';
import { hashPassword, comparePassword } from '../../utils/hash';
import { mailer }      from '../../utils/mailer';
import type {
  CreateCandidateDto, UpdateCandidateDto,
  CandidateQueryParams, BulkCandidateRow, BulkUploadResult,
  CandidateEmploymentDto,
} from './candidate.types';

const VALID_SOURCES  = ['Naukri','LinkedIn','CollarCheck','Referral','Walk-in','Indeed','Direct','Other'];
const VALID_STATUSES = ['Applied','Shortlisted','Interview_Scheduled','Technical','HR_Round','Interview_Result','Offered','Hired','Rejected','Withdrawn','On_Hold'];
const VALID_GENDERS  = ['Male','Female','Other','Prefer not to say'];
const VALID_EDU_MODES = ['Regular','Non Regular','Not Applicable'];
const VALID_VEHICLE_TYPES = ['Car','Bike','Scooty'];

// Columns the generic PUT /candidates/:id endpoint is allowed to write. Anything
// else in the request body (company_id, reference_code, portal_*, converted_*,
// hired_at, created_by, …) is ignored so the client can't mass-assign it.
const UPDATABLE_FIELDS: readonly (keyof UpdateCandidateDto)[] = [
  'first_name', 'middle_name', 'last_name', 'email', 'phone_number', 'gender', 'date_of_birth',
  'current_state_id', 'current_city_id', 'ready_to_relocate',
  'perm_address_same_as_present', 'perm_state_id', 'perm_city_id',
  'current_company_name', 'current_company_designation',
  'qualification', 'course', 'institute', 'edu_mode', 'edu_start_date', 'edu_end_date',
  'edu_currently_pursuing', 'fresher', 'location', 'total_experience', 'relevant_experience',
  'apply_department', 'apply_designation', 'current_salary', 'expected_salary',
  'currently_working', 'notice_period', 'serving_notice_period', 'last_working_day',
  'immediate_joiner', 'expected_joining_date', 'own_vehicle', 'vehicle_types',
  'source', 'is_internal_referral', 'referred_by_employee_id', 'reference_source',
  'remarks', 'job_id', 'status',
];

export class CandidateService {

  // ─── List ───────────────────────────────────────────────────────────────────
  async getAll(query: CandidateQueryParams, companyId: number) {
    const { page, limit, offset } = parsePaginationParams(query as any);
    const where: WhereOptions = { company_id: companyId };

    if (query.search) {
      const s = `%${query.search.trim()}%`;
      (where as any)[Op.or] = [
        { candidate_name: { [Op.like]: s } },
        { first_name:     { [Op.like]: s } },
        { last_name:      { [Op.like]: s } },
        { email:          { [Op.like]: s } },
        { phone_number:   { [Op.like]: s } },
        { current_company_name: { [Op.like]: s } },
        { location:       { [Op.like]: s } },
      ];
    }

    if (query.status)   where['status']   = query.status;
    if (query.source)   where['source']   = query.source;
    if (query.min_experience !== undefined)
      where['total_experience'] = { ...(where['total_experience'] as any || {}), [Op.gte]: Number(query.min_experience) };
    if (query.max_experience !== undefined)
      where['total_experience'] = { ...(where['total_experience'] as any || {}), [Op.lte]: Number(query.max_experience) };

    const sortField = ['candidate_name','created_at','total_experience','expected_salary','status'].includes(String(query.sort)) ? String(query.sort) : 'created_at';
    const { count, rows } = await Candidate.findAndCountAll({
      where, limit, offset,
      order:      [[sortField, query.order === 'ASC' ? 'ASC' : 'DESC']],
      attributes: { exclude: ['portal_password_hash','portal_access_token'] },
    });
    return { rows, meta: buildPaginationMeta(page, limit, count) };
  }

  // ─── Single ─────────────────────────────────────────────────────────────────
  async getById(id: number, companyId: number, forPortal = false) {
    const exclude = forPortal ? ['portal_password_hash'] : ['portal_password_hash','portal_access_token'];
    const c = await Candidate.findOne({
      where: { id, company_id: companyId },
      attributes: { exclude },
    });
    if (!c) throw new AppError('Candidate not found', 404);
    return c;
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────
  async getSummaryStats(companyId: number) {
    const [total, hired, active, thisMonth] = await Promise.all([
      Candidate.count({ where: { company_id: companyId } }),
      Candidate.count({ where: { company_id: companyId, status: 'Hired' } }),
      Candidate.count({ where: { company_id: companyId, status: ['Applied','Shortlisted','Interview_Scheduled','Technical','HR_Round','Offered','On_Hold'] } }),
      Candidate.count({ where: { company_id: companyId, created_at: { [Op.gte]: new Date(new Date().setDate(1)) } } }),
    ]);
    const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;
    return { total, hired, active, rejected: total - hired - active, thisMonth, conversionRate };
  }

  async getPipelineStats(companyId: number) {
    const results = await Candidate.findAll({
      where: { company_id: companyId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const statsMap = new Map((results as any[]).map(r => [r.status, Number(r.count)]));
    return VALID_STATUSES.map(status => ({ status, count: statsMap.get(status) ?? 0 }));
  }

  async getSourceBreakdown(companyId: number) {
    const results = await Candidate.findAll({
      where: { company_id: companyId },
      attributes: ['source', [fn('COUNT', col('id')), 'count']],
      group: ['source'],
      raw: true,
    });
    return (results as any[]).map(r => ({ source: r.source || 'Unknown', count: Number(r.count) }));
  }

  // ─── Conditional-field cleanup ────────────────────────────────────────────
  // Clears dependent fields the client may still send when their controlling
  // flag says they shouldn't apply, so stale values never persist.
  private cleanConditionalFields<T extends CreateCandidateDto | UpdateCandidateDto>(dto: T): T {
    if (dto.perm_address_same_as_present === true) {
      dto.perm_state_id = null;
      dto.perm_city_id  = null;
    }
    if (dto.own_vehicle === false) {
      dto.vehicle_types = null;
    }
    if (dto.is_internal_referral === true) {
      dto.reference_source = null;
    }
    if (dto.is_internal_referral === false) {
      dto.referred_by_employee_id = null;
    }
    if (dto.serving_notice_period === false) {
      dto.last_working_day = null;
    }
    if (dto.fresher === true) {
      dto.current_company_name = null;
      dto.current_company_designation = null;
      // Only clear rows when the client actually sent the employments list;
      // an absent key means "leave existing employment history untouched".
      if ('employments' in dto) dto.employments = [];
    }
    return dto;
  }

  // ─── Employment rows sync (replace-all on write) ──────────────────────────
  private async syncEmployments(candidateId: number, employments: CandidateEmploymentDto[] | undefined, transaction?: any) {
    if (employments === undefined) return;
    await CandidateEmployment.destroy({ where: { candidate_id: candidateId }, transaction });
    if (!employments.length) return;
    await CandidateEmployment.bulkCreate(
      employments.map((row, idx) => ({
        candidate_id: candidateId,
        company: row.company.trim(),
        designation: row.designation?.trim() || null,
        joining_date: row.joining_date ? new Date(row.joining_date) : null,
        leaving_date: row.currently_working ? null : (row.leaving_date ? new Date(row.leaving_date) : null),
        currently_working: !!row.currently_working,
        sort_order: idx,
      })),
      { transaction },
    );
  }

  // ─── Create ─────────────────────────────────────────────────────────────────
  // ─── Reference code generation ─────────────────────────────────────────────
  // Format: CAND-{year}-{4-digit seq}, sequence counted per company per year.
  // Never derived from client input — generated here only, immediately before insert.
  private async generateReferenceCode(companyId: number, offset = 0): Promise<string> {
    const year = new Date().getFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const countThisYear = await Candidate.count({
      where: { company_id: companyId, created_at: { [Op.gte]: yearStart, [Op.lt]: yearEnd } },
      paranoid: false, // count soft-deleted too so codes are never reused
    });

    return `CAND-${year}-${String(countThisYear + 1 + offset).padStart(4, '0')}`;
  }

  async create(companyId: number, dto: CreateCandidateDto, createdBy?: number) {
    dto = this.cleanConditionalFields(dto);
    // Uniqueness check: email AND phone
    if (dto.email) {
      const dup = await Candidate.findOne({ where: { company_id: companyId, email: dto.email.toLowerCase().trim() } });
      if (dup) throw new AppError(`Email "${dto.email}" already exists`, 409);
    }
    if (dto.phone_number) {
      const dup = await Candidate.findOne({ where: { company_id: companyId, phone_number: dto.phone_number.trim() } });
      if (dup) throw new AppError(`Phone "${dto.phone_number}" already exists`, 409);
    }
    // Joining date must not be in the past
    if (dto.expected_joining_date) {
      const today = new Date(); today.setHours(0,0,0,0);
      if (new Date(dto.expected_joining_date) < today)
        throw new AppError('Expected joining date cannot be in the past', 400);
    }

    let candidate: Candidate;
    let attempt = 0;
    const maxAttempts = 5;

    while (true) {
      const referenceCode = await this.generateReferenceCode(companyId, attempt);
      try {
        candidate = await Candidate.create({
      company_id:               companyId,
      reference_code:           referenceCode,
      first_name:               dto.first_name.trim(),
      middle_name:              dto.middle_name?.trim()        || null,
      last_name:                dto.last_name.trim(),
      email:                    dto.email?.toLowerCase().trim() || null,
      phone_number:             dto.phone_number?.trim()       || null,
      gender:                   (dto.gender || null) as any,
      date_of_birth:            dto.date_of_birth ? new Date(dto.date_of_birth) : null,

      current_state_id:         dto.current_state_id      ?? null,
      current_city_id:          dto.current_city_id       ?? null,
      ready_to_relocate:        dto.ready_to_relocate      ?? null,
      perm_address_same_as_present: dto.perm_address_same_as_present ?? true,
      perm_state_id:            dto.perm_state_id          ?? null,
      perm_city_id:             dto.perm_city_id           ?? null,

      current_company_name:     dto.current_company_name?.trim()     || null,
      current_company_designation: dto.current_company_designation?.trim() || null,
      qualification:            dto.qualification?.trim()            || null,
      course:                   dto.course?.trim()                   || null,
      institute:                dto.institute?.trim()                || null,
      edu_mode:                 (dto.edu_mode || null)     as any,
      edu_start_date:           dto.edu_start_date ? new Date(dto.edu_start_date) : null,
      edu_end_date:             dto.edu_currently_pursuing ? null : (dto.edu_end_date ? new Date(dto.edu_end_date) : null),
      edu_currently_pursuing:   dto.edu_currently_pursuing ?? false,
      fresher:                  dto.fresher                ?? false,
      location:                 dto.location?.trim()                 || null,
      total_experience:         dto.total_experience      ?? null,
      relevant_experience:      dto.relevant_experience   ?? null,

      apply_department:         dto.apply_department      ?? null,
      apply_designation:        dto.apply_designation     ?? null,
      current_salary:           dto.current_salary        ?? null,
      expected_salary:          dto.expected_salary       ?? null,
      currently_working:        dto.currently_working      ?? null,
      notice_period:            dto.notice_period         ?? null,
      serving_notice_period:    dto.serving_notice_period  ?? null,
      last_working_day:         dto.last_working_day ? new Date(dto.last_working_day) : null,
      immediate_joiner:         dto.immediate_joiner      ?? false,
      expected_joining_date:    dto.expected_joining_date ? new Date(dto.expected_joining_date) : null,

      own_vehicle:              dto.own_vehicle           ?? false,
      vehicle_types:            dto.vehicle_types           ?? null,
      source:                   (dto.source || null)      as any,
      is_internal_referral:     dto.is_internal_referral   ?? null,
      referred_by_employee_id:  dto.referred_by_employee_id ?? null,
      reference_source:         dto.reference_source?.trim() || null,
      remarks:                  dto.remarks?.trim()           || null,
      job_id:                   dto.job_id                ?? null,
      status:                   'Applied',
      preinterview_form_status: 'Not_Started',
      created_by:               createdBy                 ?? null,
        } as any);
        break;
      } catch (err: any) {
        attempt++;
        const isRefCodeCollision =
          err?.name === 'SequelizeUniqueConstraintError' &&
          (err.errors?.some((e: any) => e.path === 'reference_code') ?? false);
        if (isRefCodeCollision && attempt < maxAttempts) continue;
        throw err;
      }
    }

    await this.syncEmployments(candidate.id, dto.employments);

    await logActivity({ companyId, employeeId: createdBy, action: 'CANDIDATE_CREATED', module: 'candidates', entityId: candidate.id });
    return candidate;
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  async update(id: number, companyId: number, dto: UpdateCandidateDto, updatedBy?: number) {
    const candidate = await this.getById(id, companyId);

    if (dto.email && dto.email !== candidate.email) {
      const dup = await Candidate.findOne({ where: { company_id: companyId, email: dto.email.toLowerCase().trim(), id: { [Op.ne]: id } } });
      if (dup) throw new AppError(`Email "${dto.email}" already exists`, 409);
    }
    if (dto.phone_number && dto.phone_number !== candidate.phone_number) {
      const dup = await Candidate.findOne({ where: { company_id: companyId, phone_number: dto.phone_number.trim(), id: { [Op.ne]: id } } });
      if (dup) throw new AppError(`Phone "${dto.phone_number}" already exists`, 409);
    }
    if (dto.expected_joining_date) {
      const today = new Date(); today.setHours(0,0,0,0);
      if (new Date(dto.expected_joining_date) < today)
        throw new AppError('Expected joining date cannot be in the past', 400);
    }

    dto = this.cleanConditionalFields(dto);

    // Whitelist: copy only known, client-writable fields onto the update payload.
    const candidateFields: Record<string, unknown> = {};
    for (const key of UPDATABLE_FIELDS) {
      if (key in dto) candidateFields[key] = (dto as any)[key];
    }

    await candidate.update({
      ...candidateFields,
      email: dto.email?.toLowerCase().trim() || candidate.email,
      updated_by: updatedBy,
    } as any);

    await this.syncEmployments(id, dto.employments);

    await logActivity({ companyId, employeeId: updatedBy, action: 'CANDIDATE_UPDATED', module: 'candidates', entityId: id });
    return candidate;
  }

  // ─── Get with employment history (HR detail view / portal profile) ────────
  async getByIdWithEmployments(id: number, companyId: number, forPortal = false) {
    const candidate = await this.getById(id, companyId, forPortal);
    const employments = await CandidateEmployment.findAll({
      where: { candidate_id: id },
      order: [['sort_order', 'ASC']],
    });
    return { ...candidate.get({ plain: true }), employments };
  }

  // ─── Activity feed for one candidate (HR detail view → Activity tab) ──────
  async getActivity(id: number, companyId: number) {
    await this.getById(id, companyId); // 404s if the candidate isn't in this company

    const { ActivityLog } = await import('../../database/models/ActivityLog');
    const logs = await ActivityLog.findAll({
      where: { company_id: companyId, module: 'candidates', entity_id: id },
      order: [['created_at', 'DESC']],
      limit: 200,
    });

    const actorIds = [...new Set(logs.map(l => l.employee_id).filter((v): v is number => v != null))];
    const actors = actorIds.length
      ? await Employee.findAll({ where: { id: actorIds }, attributes: ['id', 'first_name', 'last_name'] })
      : [];
    const actorMap = new Map(actors.map(a => [a.id, `${a.first_name} ${a.last_name}`.trim()]));

    return logs.map(l => ({
      id:         l.id,
      action:     l.action,
      actor_id:   l.employee_id,
      actor_name: l.employee_id != null ? (actorMap.get(l.employee_id) || 'System') : 'System',
      old_values: l.old_values || null,
      new_values: l.new_values || null,
      created_at: l.created_at,
    }));
  }

  // ─── Move status ─────────────────────────────────────────────────────────────
  async moveStatus(id: number, companyId: number, status: CandidateStatus, updatedBy?: number, remarks?: string) {
    const candidate = await this.getById(id, companyId);
    await candidate.update({ status, remarks: remarks ?? candidate.remarks, updated_by: updatedBy });
    await logActivity({ companyId, employeeId: updatedBy, action: 'CANDIDATE_STATUS_CHANGED', module: 'candidates', entityId: id, oldValues: { status: candidate.status }, newValues: { status, remarks } });
    return candidate;
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  async delete(id: number, companyId: number, deletedBy?: number) {
    const candidate = await this.getById(id, companyId);
    await candidate.update({ deleted_by: deletedBy });
    await candidate.destroy();
    await logActivity({ companyId, employeeId: deletedBy, action: 'CANDIDATE_DELETED', module: 'candidates', entityId: id });
  }

  // ─── Resume ─────────────────────────────────────────────────────────────────
  async updateResume(id: number, companyId: number, resumeUrl: string, updatedBy?: number) {
    const candidate = await this.getById(id, companyId);
    await candidate.update({ resume_url: resumeUrl, updated_by: updatedBy });
    return candidate;
  }

  // ─── Interview scheduling ─────────────────────────────────────────────────
  async scheduleInterview(
    id: number, companyId: number,
    dto: {
      interview_date:         string;
      interview_time:         string;
      interview_type:         'Online' | 'Offline' | 'Phone';
      interview_link?:        string;
      interview_instructions?: string;
    },
    scheduledBy?: number,
  ) {
    const candidate = await this.getById(id, companyId);

    const intDate = new Date(dto.interview_date);
    const today   = new Date(); today.setHours(0,0,0,0);
    if (intDate < today) throw new AppError('Interview date cannot be in the past', 400);

    await candidate.update({
      interview_date:        new Date(dto.interview_date) as any,
      interview_time:        dto.interview_time,
      interview_type:        dto.interview_type as any,
      interview_link:        dto.interview_link          || null,
      interview_instructions: dto.interview_instructions || null,
      interview_accepted:    null,   // reset response
      reschedule_requested:  false,
      reschedule_status:     null,
      status:                'Interview_Scheduled',
      updated_by:            scheduledBy,
    });

    // Send email to candidate
    if (candidate.email) {
      await mailer.sendInterviewScheduled(
        candidate.email,
        candidate.candidate_name,
        'Vacancy',  // job title placeholder until jobs module
        1,
        dto.interview_type,
        `${dto.interview_date} at ${dto.interview_time}`,
        60,
        'HR Team',
        dto.interview_link,
      );
    }

    await logActivity({ companyId, employeeId: scheduledBy, action: 'INTERVIEW_SCHEDULED', module: 'candidates', entityId: id });
    return candidate;
  }

  // ─── Candidate respond to interview (accept/reject) ───────────────────────
  async respondToInterview(id: number, companyId: number, accepted: boolean) {
    const candidate = await this.getById(id, companyId);
    if (candidate.status !== 'Interview_Scheduled')
      throw new AppError('No interview scheduled for this candidate', 400);

    await candidate.update({
      interview_accepted:    accepted,
      interview_response_at: new Date(),
    });

    return candidate;
  }

  // ─── Reschedule request ───────────────────────────────────────────────────
  async requestReschedule(
    id: number, companyId: number,
    reason: string,
    proposed_date?: string,
    proposed_time?: string,
  ) {
    const candidate = await this.getById(id, companyId);
    if (candidate.status !== 'Interview_Scheduled')
      throw new AppError('No interview scheduled', 400);

    await candidate.update({
      reschedule_requested:     true,
      reschedule_reason:        reason,
      reschedule_status:        'Pending',
      reschedule_proposed_date: proposed_date ? new Date(proposed_date) as any : null,
      reschedule_proposed_time: proposed_time || null,
    });

    // Notify HR
    await logActivity({ companyId, action: 'RESCHEDULE_REQUESTED', module: 'candidates', entityId: id, newValues: { reason, proposed_date, proposed_time } });

    // Email HR (use generic HR notification — real HR email would come from User table in future)
    // mailer.sendRescheduleRequestToHR(hrEmail, candidate.candidate_name, reason, proposed_date, proposed_time);

    return candidate;
  }

  // ─── HR approves/rejects reschedule ──────────────────────────────────────
  async handleReschedule(
    id: number, companyId: number,
    decision: 'Approved' | 'Rejected',
    newDate?: string,
    newTime?: string,
    updatedBy?: number,
  ) {
    const candidate = await this.getById(id, companyId);
    if (!candidate.reschedule_requested || candidate.reschedule_status !== 'Pending')
      throw new AppError('No pending reschedule request', 400);

    const update: any = {
      reschedule_status: decision,
      reschedule_requested: decision === 'Rejected' ? false : true,
      updated_by: updatedBy,
    };

    if (decision === 'Approved' && newDate && newTime) {
      update.interview_date = new Date(newDate);
      update.interview_time = newTime;
      update.interview_accepted = null;
    }

    await candidate.update(update);
    return candidate;
  }

  // ─── Portal auth ─────────────────────────────────────────────────────────
  async portalLogin(email: string, password: string, companyId: number) {
    const candidate = await Candidate.findOne({ where: { email: email.toLowerCase(), company_id: companyId, is_portal_user: true } });
    if (!candidate || !candidate.portal_password_hash)
      throw new AppError('Invalid email or password', 401);

    const valid = await comparePassword(password, candidate.portal_password_hash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    await candidate.update({ portal_last_login: new Date() });
    return candidate;
  }

  async sendMagicLink(email: string, companyId: number) {
    const candidate = await Candidate.findOne({ where: { email: email.toLowerCase(), company_id: companyId } });
    if (!candidate) return; // always return OK

    const token = crypto.randomBytes(32).toString('hex');
    await candidate.update({
      portal_access_token:  token,
      portal_token_expires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      is_portal_user:       true,
    });

    const link = `${process.env.FRONTEND_URL}/portal/magic?token=${token}`;
    await mailer.sendPortalMagicLink(email, candidate.candidate_name, link);

    return token; // dev only
  }

  async verifyMagicToken(token: string, companyId: number) {
    const candidate = await Candidate.findOne({
      where: {
        company_id: companyId,
        portal_access_token: token,
        portal_token_expires: { [Op.gt]: new Date() },
      },
    });
    if (!candidate) throw new AppError('Invalid or expired login link', 401);

    await candidate.update({
      portal_access_token:  null,
      portal_token_expires: null,
      is_portal_user:       true,
      portal_last_login:    new Date(),
    });

    return candidate;
  }

  // ─── Submit interview result & auto-advance status ────────────────────────
  async submitInterviewResult(
    id:        number,
    companyId: number,
    dto: {
      interview_result_by:        number;
      interview_result_mode:      'Online' | 'Offline';
      interview_result_date:      string;
      interview_result_feedback?: string;
      candidate_decision:         'Select' | 'Reject' | 'On_Hold';
      decision_reason?:           string;
      decision_joining_date?:     string;
    },
    updatedBy?: number,
  ) {
    const candidate = await this.getById(id, companyId);

    // Decision → next status mapping
    const nextStatus: Record<string, string> = {
      Select:  'Offered',
      Reject:  'Rejected',
      On_Hold: 'On_Hold',
    };
    const targetStatus = nextStatus[dto.candidate_decision];
    if (!targetStatus) throw new AppError('Invalid candidate decision', 400);

    // Joining date must not be in the past when selecting
    if (dto.candidate_decision === 'Select' && dto.decision_joining_date) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(dto.decision_joining_date) < today)
        throw new AppError('Expected joining date cannot be in the past', 400);
    }

    await candidate.update({
      interview_result_by:        dto.interview_result_by,
      interview_result_mode:      dto.interview_result_mode as any,
      interview_result_date:      dto.interview_result_date ? new Date(dto.interview_result_date) : null,
      interview_result_feedback:  dto.interview_result_feedback || null,
      candidate_decision:         dto.candidate_decision as any,
      decision_reason:            dto.decision_reason       || null,
      decision_joining_date:      dto.decision_joining_date ? new Date(dto.decision_joining_date) as any : null,
      status:                     targetStatus as any,
      updated_by:                 updatedBy ?? null,
    });

    await logActivity({
      companyId,
      employeeId:    updatedBy,
      action:    'INTERVIEW_RESULT_SUBMITTED',
      module:    'candidates',
      entityId:  id,
      oldValues: { status: candidate.status },
      newValues: { status: targetStatus, candidate_decision: dto.candidate_decision },
    });

    return candidate;
  }

  // ─── Send offer letter ────────────────────────────────────────────────────
  async sendOffer(
    id:        number,
    companyId: number,
    dto: {
      offered_ctc:          number;
      confirmed_joining_date: string;
      offer_valid_till:     string;
      offer_letter_url?:    string;
    },
    updatedBy?: number,
  ) {
    const candidate = await this.getById(id, companyId);
    if (candidate.status !== 'Offered')
      throw new AppError('Candidate must be in Offered status', 400);

    const today = new Date(); today.setHours(0,0,0,0);
    if (new Date(dto.confirmed_joining_date) < today)
      throw new AppError('Joining date cannot be in the past', 400);

    await candidate.update({
      offered_ctc:            dto.offered_ctc,
      confirmed_joining_date: new Date(dto.confirmed_joining_date) as any,
      offer_valid_till:       new Date(dto.offer_valid_till),
      offer_letter_url:       dto.offer_letter_url || null,
      offer_sent_at:          new Date(),
      updated_by:             updatedBy ?? null,
    });

    // Grant portal access if not already done
    if (!candidate.is_portal_user && candidate.email) {
      const crypto = await import('crypto');
      const rawPwd = crypto.randomBytes(6).toString('hex');
      await candidate.update({
        portal_password_hash: await hashPassword(rawPwd),
        is_portal_user:       true,
      });
    }

    // Email offer letter
    if (candidate.email) {
      const joiningFormatted = new Date(dto.confirmed_joining_date).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
      const validTillFormatted = new Date(dto.offer_valid_till).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
      const ctcFormatted = `₹${(dto.offered_ctc * 12 / 100000).toFixed(2)}L/yr`;
      await mailer.sendOfferLetter(
        candidate.email,
        candidate.candidate_name,
        candidate.current_company_designation || 'the position',
        ctcFormatted,
        joiningFormatted,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/dashboard`,
        validTillFormatted,
      );
    }

    await logActivity({ companyId, employeeId: updatedBy, action: 'OFFER_SENT', module: 'candidates', entityId: id });
    return candidate;
  }

  // ─── Mark as hired & convert to employee ─────────────────────────────────
  async hireCandidate(
    id:        number,
    companyId: number,
    dto: {
      department_id?:         number;
      designation_id?:        number;
      employment_type?:       string;
      reporting_manager_id?:  number;
      date_of_joining?:       string;
    },
    createdBy?: number,
  ) {
    const candidate = await this.getById(id, companyId);

    // Create employee record from candidate data
    const employee = await Employee.create({
      employee_code: `EMP${Date.now()}`,
      company_id:           companyId,
      first_name:           candidate.first_name,
      last_name:            candidate.last_name,
      email:                candidate.email || `candidate${candidate.id}@placeholder.com`,
      phone:                candidate.phone_number || null,
      date_of_birth:        candidate.date_of_birth || null,
      gender:               (candidate.gender as any) || null,
      department_id:        dto.department_id    || null,
      designation_id:       dto.designation_id   || null,
      employment_type:      (dto.employment_type as any) || 'Full-time',
      work_location:        'Office' as any,
      date_of_joining:      dto.date_of_joining
                              ? new Date(dto.date_of_joining)
                              : (candidate.confirmed_joining_date || new Date()),
      reporting_manager_id: dto.reporting_manager_id || null,
      status:               'On_Probation' as any,
      created_by:           createdBy ?? null,
    } as any);

    // Mark candidate as hired
    await candidate.update({
      status:                'Hired',
      hired_at:              new Date(),
      converted_employee_id: employee.id,
      updated_by:            createdBy ?? null,
    });

    await logActivity({ companyId, employeeId: createdBy, action: 'CANDIDATE_HIRED', module: 'candidates', entityId: id, newValues: { employee_id: employee.id } });
    return { candidate, employee };
  }

  // ─── Withdraw candidate ───────────────────────────────────────────────────
  async withdrawCandidate(
    id:        number,
    companyId: number,
    reason:    string,
    updatedBy?: number,
  ) {
    const candidate = await this.getById(id, companyId);

    // Can withdraw from most active stages
    const terminalStatuses = ['Hired', 'Withdrawn'];
    if (terminalStatuses.includes(candidate.status))
      throw new AppError(`Cannot withdraw a ${candidate.status} candidate`, 400);

    await candidate.update({
      status:            'Withdrawn',
      withdrawal_reason: reason.trim(),
      withdrawn_at:      new Date(),
      updated_by:        updatedBy ?? null,
    });

    await logActivity({ companyId, employeeId: updatedBy, action: 'CANDIDATE_WITHDRAWN', module: 'candidates', entityId: id, oldValues: { status: candidate.status }, newValues: { withdrawal_reason: reason } });
    return candidate;
  }

  // ─── Send aptitude test link (any status, HR triggered) ──────────────────
  async sendAptitudeTestLink(
    id:        number,
    companyId: number,
    testId:    number,
    sentBy?:   number,
  ) {
    const candidate = await this.getById(id, companyId);
    if (!candidate.email) throw new AppError('Candidate has no email address', 400);

    // Ensure portal access
    if (!candidate.is_portal_user) {
      const crypto = await import('crypto');
      const rawPwd = crypto.randomBytes(6).toString('hex');
      await candidate.update({
        portal_password_hash: await hashPassword(rawPwd),
        is_portal_user:       true,
      });
    }

    const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/test/${testId}`;

    await mailer.sendAptitudeTestInvite(
      candidate.email,
      candidate.candidate_name,
      `Aptitude Test`,
      45,
      testUrl,
    );

    // Mark as sent
    await candidate.update({
      aptitude_test_sent:    true,
      aptitude_test_id: testId,
      aptitude_test_sent_at: new Date(),
    });

    await logActivity({ companyId, employeeId: sentBy, action: 'APTITUDE_TEST_SENT', module: 'candidates', entityId: id, newValues: { testId } });
    return { sent: true, testUrl };
  }

  // ─── Send pre-interview form link (after interview accepted) ─────────────
  async sendPreInterviewForm(id: number, companyId: number, sentBy?: number) {
    const candidate = await this.getById(id, companyId);
    if (!candidate.email) throw new AppError('Candidate has no email address', 400);

    const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/dashboard`;

    // Ensure portal access exists
    if (!candidate.is_portal_user) {
      const crypto = await import('crypto');
      const rawPwd = crypto.randomBytes(6).toString('hex');
      await candidate.update({
        portal_password_hash: await hashPassword(rawPwd),
        is_portal_user:       true,
      });
    }

    await mailer.sendSystemNotification(
      candidate.email,
      'Pre-Interview Form — Action Required',
      'Complete Your Pre-Interview Form',
      `Dear ${candidate.candidate_name},<br/><br/>
      Congratulations on your upcoming interview! To help us prepare, please complete the
      <strong>Pre-Interview Declaration Form</strong> on the candidate portal before your interview.<br/><br/>
      This form includes your personal details, experience summary, and a declaration that is
      required for our onboarding records.`,
      'Open Candidate Portal →',
      portalUrl,
      'blue',
    );

    // Mark as sent
    await candidate.update({
      pre_interview_form_sent:    true,
      pre_interview_form_sent_at: new Date(),
    });

    await logActivity({ companyId, employeeId: sentBy, action: 'PRE_INTERVIEW_FORM_SENT', module: 'candidates', entityId: id });
    return { sent: true };
  }

  // ─── Pre-interview form ─────────────────────────────────────────────────────
  async savePreInterviewForm(id: number, companyId: number, data: Record<string, unknown>, isDraft: boolean) {
    const candidate = await this.getById(id, companyId);
    const update: any = {
      preinterview_form_data:   data,
      preinterview_form_status: isDraft ? 'Draft' : 'Submitted',
    };
    if (!isDraft) update.preinterview_submitted_at = new Date();
    await candidate.update(update);
    return candidate;
  }


  // ─── Save pre-joining form (separate from pre-interview) ─────────────────
  async savePreJoiningForm(id: number, companyId: number, data: Record<string, unknown>, isDraft: boolean) {
    const candidate = await this.getById(id, companyId);
    const update: any = {
      prejoining_form_data:   data,
      prejoining_form_status: isDraft ? 'Draft' : 'Submitted',
    };
    if (!isDraft) update.prejoining_submitted_at = new Date();
    await candidate.update(update);
    await logActivity({ companyId, employeeId: undefined, action: isDraft ? 'PREJOINING_DRAFT_SAVED' : 'PREJOINING_SUBMITTED', module: 'candidates', entityId: id });
    return candidate;
  }

    // ─── Get pre-interview form data (HR view) ────────────────────────────────
  async getPreInterviewForm(id: number, companyId: number) {
    const candidate = await this.getById(id, companyId);
    return {
      candidate_name:       candidate.candidate_name,
      candidate_id:         candidate.id,
      apply_designation:     candidate.apply_designation,
      status:               candidate.status,
      form_status:          candidate.preinterview_form_status || 'Not_Started',
      submitted_at:         candidate.preinterview_submitted_at,
      form_data:            candidate.preinterview_form_data || null,
    };
  }

  // ─── Get pre-joining form data (HR view) ─────────────────────────────────
  async getPreJoiningForm(id: number, companyId: number) {
    const candidate = await this.getById(id, companyId);
    return {
      candidate_name:       candidate.candidate_name,
      candidate_id:         candidate.id,
      apply_designation:     candidate.apply_designation,
      status:               candidate.status,
      form_status:          candidate.prejoining_form_status || 'Not_Started',
      submitted_at:         candidate.prejoining_submitted_at,
      form_data:            candidate.prejoining_form_data || null,
    };
  }

 async sendPreJoiningFormLink(id: number, companyId: number, sentBy?: number) {
    const candidate = await this.getById(id, companyId);
    if (!candidate.email) throw new AppError('Candidate has no email address', 400);

    // Ensure portal access exists
    if (!candidate.is_portal_user) {
      const crypto = await import('crypto');
      const rawPwd = crypto.randomBytes(6).toString('hex');
      const { hashPassword } = await import('../../utils/hash');
      await candidate.update({
        portal_password_hash: await hashPassword(rawPwd),
        is_portal_user:       true,
      });
    }

    const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/prejoining`;

    await mailer.sendSystemNotification(
      candidate.email,
      'Pre-Joining Form — Action Required',
      'Complete Your Pre-Joining Form',
      `Dear ${candidate.candidate_name},<br/><br/>
      Congratulations on receiving your offer! Please complete the
      <strong>Pre-Joining & Personal Data Form</strong> on the candidate portal
      to proceed with your onboarding.<br/><br/>
      This form captures your personal details, address, educational history,
      employment background, and statutory information required for HR records.`,
      'Open Pre-Joining Form →',
      portalUrl,
      'green',
    );

    await candidate.update({
      pre_joining_form_sent:    true,
      pre_joining_form_sent_at: new Date(),
    });

    await logActivity({
      companyId, employeeId: sentBy,
      action: 'PRE_JOINING_FORM_SENT', module: 'candidates', entityId: id,
    });

    return { sent: true, email: candidate.email };
  }

  // ─── Bulk upload ─────────────────────────────────────────────────────────
  async bulkUpload(rows: BulkCandidateRow[], companyId: number, createdBy?: number): Promise<BulkUploadResult> {
    const result: BulkUploadResult = { total: rows.length, success: 0, failed: 0, errors: [], inserted: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const bool = (v: unknown) => ['true','1','yes'].includes(String(v ?? '').toLowerCase());

        const firstName = row.first_name?.toString().trim()
          || row.candidate_name?.toString().trim().split(' ')[0];
        const lastName = row.last_name?.toString().trim()
          || row.candidate_name?.toString().trim().split(' ').slice(1).join(' ');
        if (!firstName) throw new Error('first_name (or candidate_name) is required');
        if (!lastName) throw new Error('last_name (or a candidate_name with a space) is required');

        if (row.email) {
          const dup = await Candidate.findOne({ where: { company_id: companyId, email: String(row.email).toLowerCase().trim() } });
          if (dup) throw new Error(`Email "${row.email}" already exists`);
        }
        if (row.phone_number) {
          const dup = await Candidate.findOne({ where: { company_id: companyId, phone_number: String(row.phone_number).trim() } });
          if (dup) throw new Error(`Phone "${row.phone_number}" already exists`);
        }

        const employments: CandidateEmploymentDto[] = [];
        for (const n of [1, 2, 3] as const) {
          const company = (row as any)[`employment_${n}_company`]?.toString().trim();
          if (!company) continue;
          employments.push({
            company,
            designation: (row as any)[`employment_${n}_designation`]?.toString().trim() || null,
            joining_date: (row as any)[`employment_${n}_joining_date`] ? new Date((row as any)[`employment_${n}_joining_date`]) : null,
            leaving_date: (row as any)[`employment_${n}_leaving_date`] ? new Date((row as any)[`employment_${n}_leaving_date`]) : null,
            currently_working: bool((row as any)[`employment_${n}_currently_working`]),
          });
        }

        const gender = row.gender?.toString().trim();
        const vehicleTypes = row.vehicle_types
          ? String(row.vehicle_types).split(',').map(v => v.trim()).filter(v => VALID_VEHICLE_TYPES.includes(v))
          : [];

        const dto: CreateCandidateDto = {
          first_name:               firstName,
          middle_name:              row.middle_name?.toString().trim() || null,
          last_name:                lastName,
          email:                    row.email?.toString().trim()       || null,
          phone_number:             row.phone_number?.toString().trim() || null,
          gender:                   (gender && VALID_GENDERS.includes(gender) ? gender : null) as any,
          date_of_birth:            row.date_of_birth ? new Date(row.date_of_birth) : null,

          current_state_id:         row.current_state_id != null ? Number(row.current_state_id) : null,
          current_city_id:          row.current_city_id != null ? Number(row.current_city_id) : null,
          ready_to_relocate:        row.ready_to_relocate != null ? bool(row.ready_to_relocate) : null,
          perm_address_same_as_present: row.perm_address_same_as_present != null ? bool(row.perm_address_same_as_present) : true,
          perm_state_id:            row.perm_state_id != null ? Number(row.perm_state_id) : null,
          perm_city_id:             row.perm_city_id != null ? Number(row.perm_city_id) : null,

          current_company_name:     row.current_company_name?.toString().trim() || null,
          current_company_designation: row.current_company_designation?.toString().trim() || null,
          qualification:            row.qualification?.toString().trim()  || null,
          course:                   row.course?.toString().trim()          || null,
          institute:                row.institute?.toString().trim()       || null,
          edu_mode:                 (row.edu_mode && VALID_EDU_MODES.includes(String(row.edu_mode).trim()) ? String(row.edu_mode).trim() : null) as any,
          edu_start_date:           row.edu_start_date ? new Date(row.edu_start_date) : null,
          edu_end_date:             row.edu_end_date ? new Date(row.edu_end_date) : null,
          edu_currently_pursuing:   bool(row.edu_currently_pursuing),
          fresher:                  bool(row.fresher),
          location:                 row.location?.toString().trim()       || null,
          total_experience:         row.total_experience != null ? Number(row.total_experience) : null,
          relevant_experience:      row.relevant_experience != null ? Number(row.relevant_experience) : null,
          employments,

          apply_department:         row.apply_department?.toString().trim() || null,
          apply_designation:        row.apply_designation?.toString().trim() || null,
          current_salary:           row.current_salary != null ? Number(row.current_salary) : null,
          expected_salary:          row.expected_salary != null ? Number(row.expected_salary) : null,
          currently_working:        row.currently_working != null ? bool(row.currently_working) : null,
          notice_period:            row.notice_period != null ? Number(row.notice_period) : null,
          serving_notice_period:    row.serving_notice_period != null ? bool(row.serving_notice_period) : null,
          last_working_day:         row.last_working_day ? new Date(row.last_working_day) : null,
          immediate_joiner:         bool(row.immediate_joiner),
          expected_joining_date:    row.expected_joining_date ? new Date(row.expected_joining_date) : null,

          own_vehicle:              bool(row.own_vehicle),
          vehicle_types:            vehicleTypes.length ? vehicleTypes : null,
          source:                   (VALID_SOURCES.includes(String(row.source)) ? row.source : 'Other') as any,
          is_internal_referral:     row.is_internal_referral != null ? bool(row.is_internal_referral) : null,
          referred_by_employee_id:  row.referred_by_employee_id != null ? Number(row.referred_by_employee_id) : null,
          reference_source:         row.reference_source?.toString().trim() || null,
          remarks:                  row.remarks?.toString().trim()           || null,
        };

        const created = await this.create(companyId, dto, createdBy);
        result.inserted.push(created.id);
        result.success++;
      } catch (err: any) {
        result.failed++;
        const fallbackName = row.candidate_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Unknown';
        result.errors.push({ row: rowNum, name: String(fallbackName), reason: err?.message || 'Unknown error' });
      }
    }

    return result;
  }
}