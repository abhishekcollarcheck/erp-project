import { Op, Transaction, WhereOptions } from 'sequelize';
import {
  Employee, EmployeeLocationAttendance, EmployeeManagersWorkContact,
  EmployeeCommitmentProbation, EmployeeSchemes, EmployeePersonal,
  EmployeeFamily, EmployeeFamilyMember, EmployeeAddress, EmployeeEmergencyContact, EmployeeStatutory,
  EmployeeVaccination, EmployeeDocument,
  EmployeeBankDetail, EmployeeSalary, EmployeeAssetDeduction, EmployeeExperience, EmployeeExperienceFlag,
  EmployeeEducation, EmployeeOnboardingDocs, EmployeeTransfer, EmployeeExit, EmployeeDraft,
} from '../../database/models/Employee';
import type { EmployeeQueryParams } from './employee.types';

// ─── Includes ────────────────────────────────────────────────────────────────
const MGR_ATTRS = ['id', 'employee_code', 'first_name', 'last_name'];

const DETAIL_INCLUDES: any[] = [
  { association: 'company',     attributes: ['id', 'name'] },
  { association: 'department',  attributes: ['id', ['department_name', 'name']] },
  { association: 'designation', attributes: ['id', 'name'] },
  { association: 'subDepartment',  attributes: ['id', 'name'] },
  { association: 'subDesignation', attributes: ['id', 'name'] },
  { association: 'locationAttendance' },
  {
    association: 'managersWorkContact',
    include: [
      { association: 'l1Manager', attributes: MGR_ATTRS },
      { association: 'l2Manager', attributes: MGR_ATTRS },
    ],
  },
  { association: 'commitmentProbation' },
  { association: 'schemes' },
  { association: 'personal' },
  { association: 'family' },
  { association: 'familyMembers' },
  { association: 'addresses', order: [['address_type', 'ASC']] },
  { association: 'emergencyContacts', order: [['is_primary', 'DESC']] },
  { association: 'experienceFlag' },
  { association: 'experience' },
  { association: 'education' },
  { association: 'onboardingDocs' },
  { association: 'assetDeduction' },
  { association: 'transfers', order: [['transfer_order', 'ASC']] },
  { association: 'exit' },
];

const SENSITIVE_INCLUDES: any[] = [
  { association: 'statutory' },
  { association: 'vaccinations' },
  { association: 'documents' },
  { association: 'bankDetails' },
  { association: 'salaries' },
];

const LIST_INCLUDES: any[] = [
  { association: 'company', attributes: ['id', 'name'] },
  { association: 'department', attributes: ['id', ['department_name', 'name']] },
  { association: 'designation', attributes: ['id', 'name'] },
  {
    association: 'managersWorkContact',
    include: [{ association: 'l1Manager', attributes: MGR_ATTRS }],
  },
  { association: 'locationAttendance' },
];

const ALWAYS_EXCLUDE = [
  'otp_hash', 'otp_expires', 'otp_attempts', 'otp_locked_until',
  'refresh_token', 'refresh_expires', 'must_change_password',
];

export class EmployeeRepository {

  async findAll(params: EmployeeQueryParams, companyId: number) {
    const page   = Math.max(1, Number(params.page) || 1);
    const limit  = Math.min(100, Number(params.limit) || 20);
    const offset = (page - 1) * limit;

    const where: any = { company_id: companyId };
    if (params.status)          where.status          = params.status;
    if (params.record_status)   where.record_status   = params.record_status;
    if (params.employment_type) where.employment_type = params.employment_type;
    if (params.department_id)   where.department_id   = Number(params.department_id);
    if (params.designation_id)  where.designation_id  = Number(params.designation_id);

    if (params.search) {
      const s = `%${params.search.trim()}%`;
      where[Op.or] = [
        { first_name:    { [Op.like]: s } },
        { last_name:     { [Op.like]: s } },
        { middle_name:   { [Op.like]: s } },
        { employee_code: { [Op.like]: s } },
        { email:         { [Op.like]: s } },
      ];
    }

    const VALID_SORT = ['created_at', 'first_name', 'last_name', 'employee_code'];
    const requestedSort = String(params.sort || 'created_at');
    const order = params.order === 'ASC' ? 'ASC' : 'DESC';

    let orderClause: any[];
    if (requestedSort === 'actual_doj') {
      orderClause = [[{ model: EmployeeLocationAttendance, as: 'locationAttendance' }, 'actual_doj', order]];
    } else if (VALID_SORT.includes(requestedSort)) {
      orderClause = [[requestedSort, order]];
    } else {
      orderClause = [['created_at', 'DESC']];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: LIST_INCLUDES,
      attributes: { exclude: ALWAYS_EXCLUDE },
      limit, offset,
      order: orderClause,
      distinct: true,
    });

    return { rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async findById(id: number, companyId: number, includeSensitive = false, t?: Transaction): Promise<Employee | null> {
    return Employee.findOne({
      where: { id, company_id: companyId },
      include: includeSensitive ? [...DETAIL_INCLUDES, ...SENSITIVE_INCLUDES] : DETAIL_INCLUDES,
      attributes: { exclude: ALWAYS_EXCLUDE },
      transaction: t,
    });
  }

  async create(data: object, t: Transaction): Promise<Employee> {
    return Employee.create(data as any, { transaction: t });
  }

  async update(id: number, companyId: number, data: object, t: Transaction) {
    return Employee.update(data as any, { where: { id, company_id: companyId }, transaction: t });
  }

  async softDelete(id: number, companyId: number, deletedBy: number): Promise<Employee | null> {
    const emp = await Employee.findOne({ where: { id, company_id: companyId } });
    if (!emp) return null;
    await emp.update({ deleted_by: deletedBy, portal_access: false });
    await emp.destroy();
    return emp;
  }

  async upsertLocationAttendance(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeLocationAttendance.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertManagersWorkContact(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeManagersWorkContact.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }

  async upsertCommitmentProbation(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeCommitmentProbation.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertSchemes(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeSchemes.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertPersonal(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeePersonal.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertFamily(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeFamily.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertStatutory(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeStatutory.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertAssetDeduction(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeAssetDeduction.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertOnboardingDocs(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeOnboardingDocs.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }
  async upsertExit(employeeId: number, data: object, t: Transaction) {
    const [r] = await EmployeeExit.upsert({ employee_id: employeeId, ...data }, { transaction: t });
    return r;
  }

  async upsertAddress(employeeId: number, type: 'present' | 'permanent', data: object, t: Transaction) {
    const existing = await EmployeeAddress.findOne({ where: { employee_id: employeeId, address_type: type } });
    if (existing) return existing.update(data as any, { transaction: t });
    return EmployeeAddress.create({ employee_id: employeeId, address_type: type, ...data } as any, { transaction: t });
  }

  async replaceEmergencyContacts(employeeId: number, contacts: object[], t: Transaction) {
    await EmployeeEmergencyContact.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!contacts.length) return [];
    return EmployeeEmergencyContact.bulkCreate(
      contacts.map((c, i) => ({ employee_id: employeeId, is_primary: i === 0, ...c })) as any,
      { transaction: t }
    );
  }

  async replaceFamilyMembers(employeeId: number, members: object[], t: Transaction) {
    await EmployeeFamilyMember.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!members.length) return [];
    return EmployeeFamilyMember.bulkCreate(
      members.map(m => ({ employee_id: employeeId, ...m })) as any,
      { transaction: t }
    );
  }

  async upsertBank(employeeId: number, bankType: 'personal' | 'official', data: object, t: Transaction) {
    const existing = await EmployeeBankDetail.findOne({ where: { employee_id: employeeId, bank_type: bankType } });
    if (existing) return existing.update(data as any, { transaction: t });
    return EmployeeBankDetail.create({ employee_id: employeeId, bank_type: bankType, ...data } as any, { transaction: t });
  }

  async upsertSalary(employeeId: number, salaryType: 'current' | 'joining', data: object, t: Transaction) {
    const existing = await EmployeeSalary.findOne({ where: { employee_id: employeeId, salary_type: salaryType } });
    if (existing) return existing.update(data as any, { transaction: t });
    return EmployeeSalary.create({ employee_id: employeeId, salary_type: salaryType, ...data } as any, { transaction: t });
  }

  async replaceVaccinations(employeeId: number, vaccinations: object[], t: Transaction) {
    await EmployeeVaccination.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!vaccinations.length) return [];
    return EmployeeVaccination.bulkCreate(
      vaccinations.map(v => ({ employee_id: employeeId, ...v })) as any,
      { transaction: t }
    );
  }

  async addDocument(employeeId: number, data: object) {
    return EmployeeDocument.create({ employee_id: employeeId, ...data } as any);
  }

  async replaceDocuments(employeeId: number, documents: object[], t: Transaction) {
    await EmployeeDocument.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!documents.length) return [];
    return EmployeeDocument.bulkCreate(
      documents.map(d => ({ employee_id: employeeId, ...d })) as any,
      { transaction: t }
    );
  }

  async replaceExperience(employeeId: number, experience: object[], t: Transaction) {
    await EmployeeExperience.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!experience.length) return [];
    return EmployeeExperience.bulkCreate(
      experience.map(e => ({ employee_id: employeeId, ...e })) as any,
      { transaction: t }
    );
  }

  async replaceEducation(employeeId: number, education: object[], t: Transaction) {
    await EmployeeEducation.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!education.length) return [];
    return EmployeeEducation.bulkCreate(
      education.map(ed => ({ employee_id: employeeId, ...ed })) as any,
      { transaction: t }
    );
  }

  async setExperienceFlag(employeeId: number, isExperienced: boolean, t: Transaction) {
    const [r] = await EmployeeExperienceFlag.upsert({ employee_id: employeeId, is_experienced: isExperienced }, { transaction: t });
    return r;
  }

  async replaceTransfers(employeeId: number, transfers: object[], t: Transaction) {
    await EmployeeTransfer.destroy({ where: { employee_id: employeeId }, transaction: t });
    if (!transfers.length) return [];
    return EmployeeTransfer.bulkCreate(
      transfers.map((tr, i) => ({ employee_id: employeeId, transfer_order: i + 1, ...tr })) as any,
      { transaction: t }
    );
  }

  async updateCompletionPct(id: number, pct: number, t: Transaction) {
    return Employee.update({ form_completion_pct: pct }, { where: { id }, transaction: t });
  }

  /** Correct a drifted form_completion_pct outside any transaction, without
   *  bumping updated_at (used by getById's self-heal on read). */
  async updateCompletionPctSilent(id: number, pct: number) {
    return Employee.update({ form_completion_pct: pct }, { where: { id }, silent: true });
  }

  /**
   * Copy every child record of `fromId` onto `toId` — used by the transfer flow
   * ("Personal / KYC details are copied"). EmployeeLocationAttendance is handled
   * separately by the caller (new DOJ / site), EmployeeTransfer / EmployeeExit
   * are transfer-specific and never cloned.
   */
  async cloneEmployeeChildren(fromId: number, toId: number, t: Transaction) {
    const strip = (r: any) => {
      const o = { ...r };
      delete o.id; delete o.created_at; delete o.updated_at; delete o.createdAt; delete o.updatedAt;
      return o;
    };
    const singleModels: any[] = [
      EmployeeManagersWorkContact, EmployeeCommitmentProbation, EmployeeSchemes,
      EmployeePersonal, EmployeeFamily, EmployeeStatutory, EmployeeAssetDeduction,
      EmployeeOnboardingDocs, EmployeeExperienceFlag,
    ];
    const listModels: any[] = [
      EmployeeFamilyMember, EmployeeAddress, EmployeeEmergencyContact, EmployeeVaccination,
      EmployeeDocument, EmployeeBankDetail, EmployeeSalary, EmployeeExperience, EmployeeEducation,
    ];

    for (const M of singleModels) {
      const row = await M.findOne({ where: { employee_id: fromId }, transaction: t });
      if (!row) continue;
      await M.create({ ...strip(row.toJSON()), employee_id: toId }, { transaction: t });
    }
    for (const M of listModels) {
      const rows = await M.findAll({ where: { employee_id: fromId }, transaction: t });
      if (!rows.length) continue;
      await M.bulkCreate(
        rows.map((r: any) => ({ ...strip(r.toJSON()), employee_id: toId })),
        { transaction: t },
      );
    }
  }

  async findByCode(code: string, excludeId?: number) {
    return Employee.findOne({
      where: { employee_code: code, ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}) },
    });
  }

  /** Fetch by primary key, not scoped to a company — used by the bulk importer
   *  when an existing employee matched by employee_code is being updated. */
  async findAnyById(id: number, t?: Transaction) {
    return Employee.findByPk(id, { transaction: t });
  }

  async findByEmail(email: string, excludeId?: number) {
    return Employee.findOne({
      where: {
        email: email.toLowerCase().trim(),
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
      attributes: ['id', 'employee_code', 'first_name', 'last_name'],
    });
  }

  async findByMobile(mobile: string, excludeId?: number) {
    return Employee.findOne({
      where: {
        phone: mobile.trim(),
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
      attributes: ['id', 'employee_code', 'first_name', 'last_name'],
    });
  }

  async findManagerById(managerId: number, companyId: number) {
    return Employee.findOne({
      where: { id: managerId, company_id: companyId, status: 'Active', portal_access: true },
      attributes: ['id', 'employee_code', 'first_name', 'last_name'],
    });
  }

  async searchManagers(query: string, companyId: number, excludeId?: number) {
    const s = `%${query}%`;
    return Employee.findAll({
      where: {
        company_id: companyId,
        status: 'Active',
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
        [Op.or]: [
          { first_name:    { [Op.like]: s } },
          { last_name:     { [Op.like]: s } },
          { employee_code: { [Op.like]: s } },
        ],
      },
      attributes: ['id', 'employee_code', 'first_name', 'last_name'],
      limit: 20,
    });
  }

  // NOTE: EmployeeDraft has no unique index besides its PK, so a plain
  // Model.upsert() (with no `id` supplied) can never match an existing row —
  // it would INSERT a fresh employee_drafts row on every autosave tick
  // instead of updating the current session/step's draft. We match manually
  // on (session_id, step), which is the natural key for "this wizard
  // session's draft data for this step", and carry employee_id forward once
  // it becomes known (draft starts with employee_id = null, then gets linked
  // once the employee row is created).
  async upsertDraft(data: { employeeId?: number | null; createdBy: number; step: string; formData: object; sessionId: string }) {
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const existing = await EmployeeDraft.findOne({
      where: { session_id: data.sessionId, step: data.step },
    });
    if (existing) {
      await existing.update({
        employee_id: data.employeeId ?? existing.get('employee_id') ?? null,
        form_data:   data.formData,
        expires_at,
      });
      return existing;
    }
    return EmployeeDraft.create({
      employee_id: data.employeeId ?? null,
      created_by:  data.createdBy,
      step:        data.step,
      form_data:   data.formData,
      session_id:  data.sessionId,
      expires_at,
    } as any);
  }

  async getDraft(sessionId: string, createdBy: number) {
    return EmployeeDraft.findOne({
      where: { session_id: sessionId, created_by: createdBy, expires_at: { [Op.gt]: new Date() } },
    });
  }

  async deleteDraft(sessionId: string, createdBy: number) {
    return EmployeeDraft.destroy({ where: { session_id: sessionId, created_by: createdBy } });
  }

  async findForLogin(emailOrMobile: string, companyId: number) {
    const isPhone = /^\+?[0-9]{7,15}$/.test(emailOrMobile.replace(/\s/g, ''));
    return Employee.findOne({
      where: {
        company_id: companyId,
        portal_access: true,
        [Op.or]: isPhone
          ? [{ phone: emailOrMobile }]
          : [{ email: emailOrMobile.toLowerCase() }],
      },
    });
  }

  async updateAuthFields(id: number, data: Partial<{
    otp_hash: string | null; otp_expires: Date | null; otp_attempts: number;
    otp_locked_until: Date | null; refresh_token: string | null;
    refresh_expires: Date | null; last_login_at: Date;
    portal_access: boolean; must_change_password: boolean;
  }>) {
    return Employee.update(data as any, { where: { id } });
  }

  async getSummary(companyId: number) {
    const [active, left, retired, onNotice, relieved, absconded, inactive, draft, total] = await Promise.all([
      Employee.count({ where: { company_id: companyId, status: 'Active' } }),
      Employee.count({ where: { company_id: companyId, status: 'Left' } }),
      Employee.count({ where: { company_id: companyId, status: 'Retired' } }),
      Employee.count({ where: { company_id: companyId, status: 'On Notice' } }),
      Employee.count({ where: { company_id: companyId, status: 'Relieved' } }),
      Employee.count({ where: { company_id: companyId, status: 'Absconded' } }),
      Employee.count({ where: { company_id: companyId, status: 'Inactive' } }),
      Employee.count({ where: { company_id: companyId, record_status: 'Draft' } }),
      Employee.count({ where: { company_id: companyId } }),
    ]);
    return { active, left, retired, onNotice, relieved, absconded, inactive, draft, total };
  }
}

export const employeeRepository = new EmployeeRepository();