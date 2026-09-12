-- ============================================================================
--  Probation form definition — MySQL
--  ONE hr_modules row (slug 'probation'), ONE shared form_definition, TWO
--  dynamic_fields — one per tab (Period / Status), same one-module-
--  multiple-fields pattern as Attendance Rules / Location.
--
--  max_length 100 matches both models' name column (STRING(100)).
--  `code` and `display_order` aren't exposed in ProbationPage.tsx's UI
--  (SimpleMasterList/the rebuild only binds `name`), so excluded — same
--  principle as every prior seed script.
--
--  Uses the `permissions` table (corrected name, not `system_permissions`).
-- ============================================================================

START TRANSACTION;

-- 1. Module ---------------------------------------------------------------------
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Probation', 'probation', '⏳', 'Probation periods and status options', 9, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'probation' LIMIT 1);

-- 1b. Enable the module for a company --------------------------------------------
-- Replace 1 with the real company_id, or use
--   INSERT INTO module_companies (module_id, company_id, created_at, updated_at)
--   SELECT @module_id, id, NOW(), NOW() FROM companies
-- to enable for every existing company at once.
INSERT INTO module_companies (module_id, company_id, created_at, updated_at)
VALUES
    (@module_id, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Form -----------------------------------------------------------------------
INSERT INTO form_definitions
    (company_id, module_id, name, slug, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, @module_id, 'Probation', 'probation', 'Probation period and status records', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'probation' LIMIT 1);

-- 3. Fields -----------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Probation Period Name', 'probation_period_name', 'Period',
     'Add probation period...', NULL,
     1, 100, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Probation Status Name', 'probation_status_name', 'Status',
     'Add probation status...', NULL,
     1, 100, NULL, NULL, NULL,
     NULL, 1, 1, 1, NOW(), NOW())

ON DUPLICATE KEY UPDATE
    label       = VALUES(label),
    field_type  = VALUES(field_type),
    section     = VALUES(section),
    placeholder = VALUES(placeholder),
    help_text   = VALUES(help_text),
    is_required = VALUES(is_required),
    max_length  = VALUES(max_length),
    sort_order  = VALUES(sort_order),
    is_active   = VALUES(is_active),
    updated_at  = NOW();

COMMIT;


-- ============================================================================
--  4. Permissions — coarse module:action slugs, separate from the
--     field-level matrix above. 'probation' covers both Period and Status
--     actions (matching the single-module design) — no separate per-tab
--     slug sets.
-- ============================================================================

START TRANSACTION;

INSERT INTO permissions (module, action, slug, description)
SELECT module, action, slug, description FROM (
    SELECT 'probation' AS module, 'view'     AS action, 'probation:view'     AS slug, NULL AS description
    UNION ALL SELECT 'probation', 'create',   'probation:create',   NULL
    UNION ALL SELECT 'probation', 'edit',     'probation:edit',     NULL
    UNION ALL SELECT 'probation', 'delete',   'probation:delete',   NULL
    UNION ALL SELECT 'probation', 'download', 'probation:download', NULL
) AS new_perms
WHERE NOT EXISTS (
    SELECT 1 FROM permissions sp WHERE sp.slug = new_perms.slug
);

COMMIT;