-- ============================================================================
--  Location form definition — MySQL
--  One module ("Location"), one form_definition, 5 dynamic_fields — one per
--  underlying entity (Country / State / City / Site / Pay Register). The
--  frontend's 7 tabs collapse to 5 fields because address_state and
--  address_city are just alternate views onto the SAME state/city records
--  as state_country and city — not separate entities, so they don't get
--  separate fields.
--
--  company_id is NULL throughout — shared across all companies, same as
--  the Designation script.
--
--  If Location already exists as a module (e.g. from an earlier partial
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
    ('Location', 'location', '📍', 'Country, state, city, site and pay register hierarchy', 4, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'location' LIMIT 1);

-- 1b. Enable the module for a company ------------------------------------------
-- module_companies is what actually grants a company access to this module.
-- Replace 1 with the real company_id (or loop this insert per company —
-- e.g. INSERT ... SELECT id FROM companies to enable for all of them at once).
INSERT INTO module_companies (module_id, company_id, created_at, updated_at)
VALUES
    (@module_id, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Form -----------------------------------------------------------------------
-- Single form for the whole module — every location-related field (across
-- every tab in LocationsPage) hangs off this one form_id.
INSERT INTO form_definitions
    (company_id, module_id, name, slug, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, @module_id, 'Location', 'location', 'Country / state / city / site / pay register records', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'location' LIMIT 1);

-- 3. Fields -----------------------------------------------------------------------
-- One "name" field per entity, sectioned by entity so the permission-matrix
-- UI groups them clearly even though they all live in one form. max_length
-- mirrors each model's actual column length (Country/State/City/PayRegister
-- name = STRING(100), Site.name = STRING(150)).
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Country Name', 'country_name', 'Country',
     'e.g. India, United States', NULL,
     1, 100, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'State Name', 'state_name', 'State',
     'e.g. Maharashtra, California', NULL,
     1, 100, NULL, NULL, NULL,
     NULL, 1, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'City Name', 'city_name', 'City',
     'e.g. Mumbai, San Francisco', NULL,
     1, 100, NULL, NULL, NULL,
     NULL, 2, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Site Name', 'site_name', 'Site',
     'e.g. HQ, Warehouse 2', NULL,
     1, 150, NULL, NULL, NULL,
     NULL, 3, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Pay Register Name', 'pay_register_name', 'Pay Register',
     'e.g. Maharashtra Payroll', NULL,
     1, 100, NULL, NULL, NULL,
     NULL, 4, 1, 1, NOW(), NOW())

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