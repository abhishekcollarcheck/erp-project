-- -- ============================================================================
--  Department form definition — MySQL
--  One module ("Department"), one form_definition, 2 dynamic_fields — one for
--  Department, one for Sub-Department. Both entities share this single form,
--  same as Location's 5 entities sharing one form.
--
--  company_id is NULL throughout — shared across all companies, same as the
--  Location script.
--
--  If Department already exists as a module (e.g. from an earlier partial
--  run), delete step 1 and point @module_id at that row instead.
-- ============================================================================

START TRANSACTION;

-- 1. Module -------------------------------------------------------------------
-- hr_modules has NO company_id column — modules are a single global catalog
-- row (see HrModule model comment). Per-company access is granted via the
-- separate module_companies join table in step 1b below, not here.
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Department', 'department', '🏢', 'Departments and sub-departments, scoped by company', 2, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'department' LIMIT 1);

-- 1b. Enable the module for a company ------------------------------------------
-- module_companies is what actually grants a company access to this module.
-- Replace 1 with the real company_id (or loop this insert per company —
-- e.g. INSERT ... SELECT id FROM companies to enable for all of them at once).
INSERT INTO module_companies (module_id, company_id, created_at, updated_at)
VALUES
    (@module_id, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Form -----------------------------------------------------------------------
-- Single form for the whole module — both department and sub-department
-- fields hang off this one form_id.
INSERT INTO form_definitions
    (company_id, module_id, name, slug, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, @module_id, 'Department', 'department', 'Department and sub-department records', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'department' LIMIT 1);

-- 3. Fields -----------------------------------------------------------------------
-- One "name" field per entity, sectioned by entity so the permission-matrix
-- UI groups them clearly even though they both live in one form. max_length
-- mirrors each model's actual column length (Department.department_name and
-- SubDepartment.name are both STRING(200)).
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Department Name', 'department_name', 'Department',
     'Add new department...', NULL,
     1, 200, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Sub-Department Name', 'sub_department_name', 'Sub-Department',
     'Add new sub-department...', NULL,
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
--     field-level matrix above. Note: 'department' is used as the resource
--     name for BOTH department and sub-department actions (matching the
--     single-module design) — there's no separate 'subdepartment:*' slug set.
-- ============================================================================

START TRANSACTION;

INSERT INTO permissions (module, action, slug, description)
SELECT module, action, slug, description FROM (
    SELECT 'department' AS module, 'view'     AS action, 'department:view'     AS slug, NULL AS description
    UNION ALL SELECT 'department', 'create',   'department:create',   NULL
    UNION ALL SELECT 'department', 'edit',     'department:edit',     NULL
    UNION ALL SELECT 'department', 'delete',   'department:delete',   NULL
    UNION ALL SELECT 'department', 'download', 'department:download', NULL
) AS new_perms
WHERE NOT EXISTS (
    SELECT 1 FROM permissions sp WHERE sp.slug = new_perms.slug
);

COMMIT;