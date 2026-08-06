-- ============================================================================
--  Designation form definition — MySQL
--  Same shape as the Department script.
--
--    1 row in hr_modules       (unique slug)
--    1 row in form_definitions (unique module_id + slug)
--    3 rows in dynamic_fields  (1 section: 'Basic Info')
--
--  company_id is NULL throughout — shared across all companies.
--
--  Set dynamic_source on department_id to a real DYNAMIC_SOURCES enum member
--  before running — 'departments' below is a placeholder, same as in the
--  department script.
--
--  If designations already belong to an existing module, delete step 1 and
--  point @module_id at that row instead.
-- ============================================================================

START TRANSACTION;

-- 1. Module -------------------------------------------------------------------
INSERT INTO hr_modules
    (company_id, name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, 'Designation', 'designation', '🏷️', 'Job titles, grades and levels', 3, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'designation' LIMIT 1);

-- 2. Form ---------------------------------------------------------------------
INSERT INTO form_definitions
    (company_id, module_id, name, slug, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, @module_id, 'Designation', 'designation', 'Create and edit designations', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'designation' LIMIT 1);

-- 3. Fields -------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, 3, 'text', 'Designation Name', 'designation_name', 'Basic Info',
     'e.g. Software Engineer, Product Manager, Analyst', NULL,
     1, 150, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW()),

ON DUPLICATE KEY UPDATE
    label       = VALUES(label),
    field_type  = VALUES(field_type),
    section     = VALUES(section),
    placeholder = VALUES(placeholder),
    help_text   = VALUES(help_text),
    is_required = VALUES(is_required),
    sort_order  = VALUES(sort_order),
    is_active   = VALUES(is_active),
    updated_at  = NOW();

COMMIT;
