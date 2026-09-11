import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Creates the base `candidates` table — exact match of
 * `backend/src/database/models/Candidate.ts`'s `Candidate.init()`, which
 * already carries every column the later ATS migrations
 * (candidate-wizard-fields, candidate-reference-code, candidate-json-columns,
 * candidate-status-pipeline, add-candidate-job-fields, add-candidate-skills)
 * were written to add via `describeTable`+`addColumn` — so those all become
 * safe no-ops here, same pattern as `companies`/`company_modules`.
 *
 * Never created by a migration — only via `sequelize.sync()`. Must exist
 * before `20260903000000-candidate-wizard-fields.ts`, the first migration to
 * `describeTable('candidates')`.
 *
 * Idempotent, no `sync({ alter: true })`, real (not fake/minimal) schema.
 */

async function createTableIfMissing(
  queryInterface: QueryInterface,
  table: string,
  attributes: Parameters<QueryInterface['createTable']>[1],
): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : (t as any).tableName));
  if (names.includes(table)) return false;
  await queryInterface.createTable(table, attributes);
  return true;
}

async function addIndexIfMissing(
  queryInterface: QueryInterface,
  table: string,
  fields: string[],
  options: { unique?: boolean; name?: string; where?: any },
): Promise<void> {
  const indexes = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
  if (options.name && indexes.some((i) => i.name === options.name)) return;
  await queryInterface.addIndex(table, fields, options);
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const created = await createTableIfMissing(queryInterface, 'candidates', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    job_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reference_code: { type: DataTypes.STRING(20), allowNull: true },

    candidate_name: { type: DataTypes.STRING(200), allowNull: false },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    middle_name: { type: DataTypes.STRING(100), allowNull: true },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone_number: { type: DataTypes.STRING(20), allowNull: true },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other', 'Prefer not to say'), allowNull: true },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },

    current_state_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    current_city_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    ready_to_relocate: { type: DataTypes.BOOLEAN, allowNull: true },
    perm_address_same_as_present: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    perm_state_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    perm_city_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    current_company_name: { type: DataTypes.STRING(200), allowNull: true },
    current_company_designation: { type: DataTypes.STRING(200), allowNull: true },
    qualification: { type: DataTypes.STRING(200), allowNull: true },
    course: { type: DataTypes.STRING(200), allowNull: true },
    institute: { type: DataTypes.STRING(200), allowNull: true },
    edu_mode: { type: DataTypes.ENUM('Regular', 'Non Regular', 'Not Applicable'), allowNull: true },
    edu_start_date: { type: DataTypes.DATEONLY, allowNull: true },
    edu_end_date: { type: DataTypes.DATEONLY, allowNull: true },
    edu_currently_pursuing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    fresher: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    location: { type: DataTypes.STRING(200), allowNull: true },
    total_experience: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    relevant_experience: { type: DataTypes.DECIMAL(5, 1), allowNull: true },

    current_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    expected_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    apply_department: { type: DataTypes.STRING(200), allowNull: true },
    apply_designation: { type: DataTypes.STRING(200), allowNull: true },
    job_title: { type: DataTypes.STRING(200), allowNull: true },
    job_location: { type: DataTypes.STRING(200), allowNull: true },
    job_type: { type: DataTypes.STRING(40), allowNull: true },
    job_code: { type: DataTypes.STRING(40), allowNull: true },
    job_description: { type: DataTypes.TEXT, allowNull: true },
    skills: { type: DataTypes.JSON, allowNull: true },

    currently_working: { type: DataTypes.BOOLEAN, allowNull: true },
    notice_period: { type: DataTypes.INTEGER, allowNull: true },
    serving_notice_period: { type: DataTypes.BOOLEAN, allowNull: true },
    last_working_day: { type: DataTypes.DATEONLY, allowNull: true },
    immediate_joiner: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    expected_joining_date: { type: DataTypes.DATEONLY, allowNull: true },
    own_vehicle: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    vehicle_types: { type: DataTypes.JSON, allowNull: true },

    source: {
      type: DataTypes.ENUM('Naukri', 'LinkedIn', 'CollarCheck', 'Referral', 'Walk-in', 'Indeed', 'Direct', 'Other'),
      allowNull: true,
    },
    is_internal_referral: { type: DataTypes.BOOLEAN, allowNull: true },
    referred_by_employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reference_source: { type: DataTypes.STRING(300), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    resume_url: { type: DataTypes.STRING(500), allowNull: true },

    status: {
      type: DataTypes.ENUM('Sourced', 'Screened', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn', 'On_Hold'),
      allowNull: false,
      defaultValue: 'Sourced',
    },

    interview_date: { type: DataTypes.DATEONLY, allowNull: true },
    interview_time: { type: DataTypes.STRING(5), allowNull: true },
    interview_type: { type: DataTypes.ENUM('Online', 'Offline', 'Phone'), allowNull: true },
    interview_link: { type: DataTypes.STRING(500), allowNull: true },
    interview_instructions: { type: DataTypes.TEXT, allowNull: true },
    interview_accepted: { type: DataTypes.BOOLEAN, allowNull: true },
    interview_response_at: { type: DataTypes.DATE, allowNull: true },

    interview_result_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    interview_result_mode: { type: DataTypes.ENUM('Online', 'Offline'), allowNull: true },
    interview_result_date: { type: DataTypes.DATE, allowNull: true },
    interview_result_feedback: { type: DataTypes.TEXT, allowNull: true },
    candidate_decision: { type: DataTypes.ENUM('Select', 'Reject', 'On_Hold'), allowNull: true },
    decision_reason: { type: DataTypes.TEXT, allowNull: true },
    decision_joining_date: { type: DataTypes.DATEONLY, allowNull: true },

    reschedule_requested: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    reschedule_reason: { type: DataTypes.TEXT, allowNull: true },
    reschedule_status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), allowNull: true },
    reschedule_proposed_date: { type: DataTypes.DATEONLY, allowNull: true },
    reschedule_proposed_time: { type: DataTypes.STRING(5), allowNull: true },

    offered_ctc: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    offer_letter_url: { type: DataTypes.STRING(500), allowNull: true },
    offer_sent_at: { type: DataTypes.DATE, allowNull: true },
    offer_accepted: { type: DataTypes.BOOLEAN, allowNull: true },
    offer_valid_till: { type: DataTypes.DATE, allowNull: true },
    confirmed_joining_date: { type: DataTypes.DATEONLY, allowNull: true },
    hired_at: { type: DataTypes.DATE, allowNull: true },
    converted_employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    withdrawal_reason: { type: DataTypes.TEXT, allowNull: true },
    withdrawn_at: { type: DataTypes.DATE, allowNull: true },

    portal_password_hash: { type: DataTypes.STRING(255), allowNull: true },
    portal_access_token: { type: DataTypes.STRING(255), allowNull: true },
    portal_token_expires: { type: DataTypes.DATE, allowNull: true },
    is_portal_user: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    portal_last_login: { type: DataTypes.DATE, allowNull: true },

    preinterview_form_data: { type: DataTypes.JSON, allowNull: true },
    preinterview_form_status: { type: DataTypes.ENUM('Not_Started', 'Draft', 'Submitted'), allowNull: true, defaultValue: 'Not_Started' },
    preinterview_submitted_at: { type: DataTypes.DATE, allowNull: true },
    pre_interview_form_sent: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    pre_interview_form_sent_at: { type: DataTypes.DATE, allowNull: true },

    prejoining_form_data: { type: DataTypes.JSON, allowNull: true },
    prejoining_form_status: { type: DataTypes.ENUM('Not_Started', 'Draft', 'Submitted'), allowNull: true, defaultValue: 'Not_Started' },
    prejoining_submitted_at: { type: DataTypes.DATE, allowNull: true },
    pre_joining_form_sent: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    pre_joining_form_sent_at: { type: DataTypes.DATE, allowNull: true },

    aptitude_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    aptitude_attempted_at: { type: DataTypes.DATE, allowNull: true },
    aptitude_time_taken: { type: DataTypes.INTEGER, allowNull: true },
    aptitude_test_sent: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    aptitude_test_sent_at: { type: DataTypes.DATE, allowNull: true },
    aptitude_test_id: { type: DataTypes.INTEGER, allowNull: true },

    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid: true on the model
  });

  if (created) {
    await addIndexIfMissing(queryInterface, 'candidates', ['company_id'], { name: 'candidates_company_id' });
    await addIndexIfMissing(queryInterface, 'candidates', ['status'], { name: 'candidates_status' });
    await addIndexIfMissing(queryInterface, 'candidates', ['email'], { name: 'candidates_email' });
    await addIndexIfMissing(queryInterface, 'candidates', ['company_id', 'email'], { unique: true, name: 'candidates_company_id_email_unique', where: { deleted_at: null } });
    await addIndexIfMissing(queryInterface, 'candidates', ['portal_access_token'], { name: 'candidates_portal_access_token' });
    await addIndexIfMissing(queryInterface, 'candidates', ['referred_by_employee_id'], { name: 'candidates_referred_by_employee_id' });
    await addIndexIfMissing(queryInterface, 'candidates', ['reference_code'], { unique: true, name: 'candidates_reference_code_unique' });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('candidates').catch(() => { /* already absent */ });
}
