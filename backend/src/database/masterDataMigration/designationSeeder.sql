-- ============================================================================
--  Designation form definition — MySQL
--  Same pattern as Department: ONE hr_modules row (slug 'designation'), ONE
--  shared form_definition, TWO dynamic_fields (designation_name,
--  sub_designation_name), sectioned to tell them apart.
--
--  Company-scope/department-scope-style relationship pickers (which
--  departments a designation applies to, which designations a
--  sub-designation applies to) aren't modeled as separate fields, same
--  reasoning as Department — DYNAMIC_SOURCES has no entry that fits, and
--  scope-editing access rides on the same name field's can_edit.
--
--  max_length assumed 200 for both (not yet confirmed against the actual
--  Designation/SubDesignation Sequelize models — correct if those differ).
-- ============================================================================

START TRANSACTION;

-- 1. Module ---------------------------------------------------------------------
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Designation', 'designation', '🏷️', 'Designations and sub-designations, scoped by department', 3, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'designation' LIMIT 1);

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
    (NULL, @module_id, 'Designation', 'designation', 'Designation and sub-designation records', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'designation' LIMIT 1);

-- 3. Fields -----------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Designation Name', 'designation_name', 'Designation',
     'Add designation...', NULL,
     1, 200, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Sub-Designation Name', 'sub_designation_name', 'Sub-Designation',
     'Add sub-designation...', NULL,
     1, 200, NULL, NULL, NULL,
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
--  4. System permissions — coarse module:action slugs, separate from the
--     field-level matrix above. 'designation' covers both designation and
--     sub-designation actions (matching the single-module design) — no
--     separate 'subdesignation:*' slug set, same as Department.
-- ============================================================================

START TRANSACTION;

INSERT INTO permissions (module, action, slug, description)
SELECT module, action, slug, description FROM (
    SELECT 'designation' AS module, 'view'     AS action, 'designation:view'     AS slug, NULL AS description
    UNION ALL SELECT 'designation', 'create',   'designation:create',   NULL
    UNION ALL SELECT 'designation', 'edit',     'designation:edit',     NULL
    UNION ALL SELECT 'designation', 'delete',   'designation:delete',   NULL
    UNION ALL SELECT 'designation', 'download', 'designation:download', NULL
) AS new_perms
WHERE NOT EXISTS (
    SELECT 1 FROM permissions sp WHERE sp.slug = new_perms.slug
);

COMMIT;