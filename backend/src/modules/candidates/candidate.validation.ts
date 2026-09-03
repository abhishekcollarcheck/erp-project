import { body, param, query, ValidationChain } from 'express-validator';

const SOURCES  = ['Naukri','LinkedIn','CollarCheck','Referral','Walk-in','Indeed','Direct','Other'];
const STATUSES = ['Applied','Shortlisted','Interview_Scheduled','Technical','HR_Round','Interview_Result','Offered','Hired','Rejected','Withdrawn','On_Hold'];

export const listCandidateValidation: ValidationChain[] = [
  query('page').optional().toInt().isInt({ min: 1 }),
  query('limit').optional().toInt().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('status').optional().isIn(STATUSES),
  query('source').optional().isIn(SOURCES),
  query('min_experience').optional().toFloat().isFloat({ min: 0 }),
  query('max_experience').optional().toFloat().isFloat({ min: 0 }),
];

const EDU_MODES = ['Regular', 'Non Regular', 'Not Applicable'];
const VEHICLE_TYPES = ['Car', 'Bike', 'Scooty'];

export const createCandidateValidation: ValidationChain[] = [
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  body('middle_name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone_number').optional({ nullable: true, checkFalsy: true }).matches(/^[+\d\s\-()]{7,20}$/),
  body('gender').optional({ nullable: true, checkFalsy: true }).isIn(['Male','Female','Other','Prefer not to say']),

  body('current_state_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('current_city_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('ready_to_relocate').optional({ nullable: true }).toBoolean().isBoolean(),
  body('perm_address_same_as_present').optional().toBoolean().isBoolean(),
  body('perm_state_id')
    .if(body('perm_address_same_as_present').equals('false'))
    .optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('perm_city_id')
    .if(body('perm_address_same_as_present').equals('false'))
    .optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),

  body('qualification').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('course').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('institute').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('edu_mode').optional({ nullable: true, checkFalsy: true }).isIn(EDU_MODES),
  body('edu_start_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('edu_end_date')
    .if(body('edu_currently_pursuing').not().equals('true'))
    .optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('edu_currently_pursuing').optional().toBoolean().isBoolean(),

  body('fresher').optional().toBoolean().isBoolean(),
  body('total_experience').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0, max: 60 }),
  body('relevant_experience').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0, max: 60 }),
  body('employments').optional({ nullable: true }).isArray({ max: 20 }),
  body('employments.*.company').if(body('employments').exists()).trim().notEmpty().withMessage('Employment company is required').isLength({ max: 200 }),
  body('employments.*.designation').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('employments.*.joining_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('employments.*.leaving_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('employments.*.currently_working').optional().toBoolean().isBoolean(),

  body('apply_department').optional({nullable: true, checkFalsy: true}).isString().isLength({max: 200}),
  body('apply_designation').optional({nullable: true, checkFalsy: true}).isString().isLength({max: 200}),
  body('current_salary').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0 }),
  body('expected_salary').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0 }),
  body('currently_working').optional({ nullable: true }).toBoolean().isBoolean(),
  body('notice_period').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 0 }),
  body('serving_notice_period').optional({ nullable: true }).toBoolean().isBoolean(),
  body('last_working_day')
    .if(body('serving_notice_period').equals('true'))
    .optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('immediate_joiner').optional().toBoolean().isBoolean(),
  body('expected_joining_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),

  body('own_vehicle').optional().toBoolean().isBoolean(),
  body('vehicle_types')
    .if(body('own_vehicle').equals('true'))
    .optional({ nullable: true }).isArray(),
  body('vehicle_types.*').optional().isIn(VEHICLE_TYPES),
  body('source').optional({ nullable: true, checkFalsy: true }).isIn(SOURCES),
  body('is_internal_referral').optional({ nullable: true }).toBoolean().isBoolean(),
  body('referred_by_employee_id')
    .if(body('is_internal_referral').equals('true'))
    .toInt().isInt({ min: 1 }).withMessage('Referring employee is required'),
  body('reference_source')
    .if(body('is_internal_referral').equals('false'))
    .optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 300 }),
];

export const updateCandidateValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('status').optional().isIn(STATUSES),
  body('first_name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('middle_name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }),
  body('last_name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone_number').optional({ nullable: true, checkFalsy: true }).matches(/^[+\d\s\-()]{7,20}$/),

  body('current_state_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('current_city_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('ready_to_relocate').optional({ nullable: true }).toBoolean().isBoolean(),
  body('perm_address_same_as_present').optional().toBoolean().isBoolean(),
  body('perm_state_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('perm_city_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),

  body('qualification').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('course').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('institute').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('edu_mode').optional({ nullable: true, checkFalsy: true }).isIn(EDU_MODES),
  body('edu_start_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('edu_end_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('edu_currently_pursuing').optional().toBoolean().isBoolean(),
  body('fresher').optional().toBoolean().isBoolean(),
  body('total_experience').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0, max: 60 }),
  body('relevant_experience').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0, max: 60 }),
  body('employments').optional({ nullable: true }).isArray({ max: 20 }),
  body('employments.*.company').if(body('employments').exists()).trim().notEmpty().isLength({ max: 200 }),
  body('employments.*.designation').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('employments.*.joining_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('employments.*.leaving_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('employments.*.currently_working').optional().toBoolean().isBoolean(),

  body('apply_department').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('apply_designation').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 200 }),
  body('current_salary').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0 }),
  body('expected_salary').optional({ nullable: true, checkFalsy: true }).toFloat().isFloat({ min: 0 }),
  body('currently_working').optional({ nullable: true }).toBoolean().isBoolean(),
  body('notice_period').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 0 }),
  body('serving_notice_period').optional({ nullable: true }).toBoolean().isBoolean(),
  body('last_working_day').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('immediate_joiner').optional().toBoolean().isBoolean(),
  body('expected_joining_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),

  body('own_vehicle').optional().toBoolean().isBoolean(),
  body('vehicle_types').optional({ nullable: true }).isArray(),
  body('vehicle_types.*').optional().isIn(VEHICLE_TYPES),
  body('is_internal_referral').optional({ nullable: true }).toBoolean().isBoolean(),
  body('referred_by_employee_id').optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
  body('reference_source').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 300 }),
  body('source').optional({ nullable: true, checkFalsy: true }).isIn(SOURCES),
];

export const scheduleInterviewValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('interview_date').notEmpty().isISO8601().withMessage('Valid interview date required'),
  body('interview_time').notEmpty().matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM'),
  body('interview_type').notEmpty().isIn(['Online','Offline','Phone']),
  body('interview_link').optional({ nullable: true, checkFalsy: true }).isURL(),
  body('interview_instructions').optional({ nullable: true, checkFalsy: true }).isString(),
];

export const moveStatusValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('status').notEmpty().isIn(STATUSES),
  body('remarks').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 1000 }),
];

export const idValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
];


export const interviewResultValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }),
  body('interview_result_by')
    .toInt().isInt({ min: 1 }).withMessage('Interviewer (employee) is required'),
  body('interview_result_mode')
    .notEmpty().withMessage('Interview mode is required')
    .isIn(['Online','Offline']).withMessage('Mode must be Online or Offline'),
  body('interview_result_date')
    .notEmpty().withMessage('Interview date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('interview_result_feedback')
    .optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 2000 }),
  body('candidate_decision')
    .notEmpty().withMessage('Candidate decision is required')
    .isIn(['Select','Reject','On_Hold']).withMessage('Decision must be Select, Reject, or On_Hold'),
  body('decision_reason')
    .optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 1000 }),
  body('decision_joining_date')
    .optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid joining date format'),
];

export const portalLoginValidation: ValidationChain[] = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const rescheduleValidation: ValidationChain[] = [
  body('reason').notEmpty().withMessage('Reason is required').isLength({ max: 500 }),
  body('proposed_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('proposed_time').optional({ nullable: true, checkFalsy: true }).matches(/^\d{2}:\d{2}$/),
];

export const handleRescheduleValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('decision').notEmpty().isIn(['Approved','Rejected']),
  body('new_date').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('new_time').optional({ nullable: true, checkFalsy: true }).matches(/^\d{2}:\d{2}$/),
];

// ─── Send offer ───────────────────────────────────────────────────────────────
export const sendOfferValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('offered_ctc')
    .isFloat({ min: 1 }).withMessage('Offered CTC must be a positive number'),
  body('confirmed_joining_date')
    .notEmpty().withMessage('Confirmed joining date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('offer_valid_till')
    .notEmpty().withMessage('Offer valid till date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('offer_letter_url')
    .optional({ nullable: true, checkFalsy: true }).isURL().withMessage('Invalid URL for offer letter'),
];

// ─── Hire candidate ───────────────────────────────────────────────────────────
export const hireCandidateValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('department_id')
    .toInt().isInt({ min: 1 }).withMessage('Department is required'),
  body('designation_id')
    .toInt().isInt({ min: 1 }).withMessage('Designation is required'),
  body('employment_type')
    .notEmpty().withMessage('Employment type is required')
    .isIn(['Full-time','Part-time','Contract','Intern']),
  body('date_of_joining')
    .notEmpty().withMessage('Date of joining is required')
    .isISO8601().withMessage('Invalid date format'),
  body('reporting_manager_id')
    .optional({ nullable: true, checkFalsy: true }).toInt().isInt({ min: 1 }),
];

// ─── Withdraw ─────────────────────────────────────────────────────────────────
export const withdrawValidation: ValidationChain[] = [
  param('id').toInt().isInt({ min: 1 }),
  body('reason')
    .trim().notEmpty().withMessage('Withdrawal reason is required')
    .isLength({ min: 5, max: 1000 }).withMessage('Reason must be between 5 and 1000 characters'),
];