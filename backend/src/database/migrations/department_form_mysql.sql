-- ============================================================================
--  Department form definition — MySQL
--  Written against the real models: hr_modules / form_definitions / dynamic_fields
--
--    1 row in hr_modules       (unique slug)
--    1 row in form_definitions (unique module_id + slug)
--    4 rows in dynamic_fields  (1 section: 'Basic Info')
--
--  company_id is NULL throughout — shared across all companies.
--
--  Verify 'text' and 'select' are members of FIELD_TYPES, and set the
--  dynamic_source values in step 3 to real DYNAMIC_SOURCES enum members
--  before running (they are the only two placeholders in this file).
--
--  If departments already belong to an existing module, delete step 1 and
--  point @module_id at that row instead.
-- ============================================================================

START TRANSACTION;

-- 1. Module -------------------------------------------------------------------
INSERT INTO hr_modules
    (company_id, name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, 'Department', 'department', '🏢', 'Departments and organisational hierarchy', 2, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'department' LIMIT 1);

-- 2. Form ---------------------------------------------------------------------
INSERT INTO form_definitions
    (company_id, module_id, name, slug, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, @module_id, 'Department', 'department', 'Create and edit departments', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'department' LIMIT 1);

-- 3. Fields -------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Department Name', 'name', 'Basic Info',
     'e.g. Engineering, Finance, Product', NULL,
     1, 150, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Department Code', 'code', 'Basic Info',
     'e.g. ENG, FIN, OPS', 'Short code for reports and exports (optional)',
     0, 20, NULL, NULL, NULL,
     NULL, 1, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'select', 'Department Head', 'head_id', 'Basic Info',
     '— Assign a head later —', 'The employee responsible for this department',
     0, NULL, 'employees', 'name', 'id',
     NULL, 2, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'select', 'Parent Department', 'parent_id', 'Basic Info',
     '— Top-level department (no parent) —', 'For sub-departments within a larger team',
     0, NULL, 'departments', 'name', 'id',
     NULL, 3, 1, 1, NOW(), NOW())
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
