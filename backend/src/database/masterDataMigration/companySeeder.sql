-- ============================================================================
--  Company form definition — MySQL
--  Same pattern as location-seed.sql: one hr_modules row, one module_companies
--  enablement row, one shared form_definition, and one dynamic_field per
--  editable input.
--
--  Fields are mapped against what CompanyPage.tsx actually renders as inputs
--  (handleField() bindings), NOT the full Company model — several model
--  columns (onboarding_step, setup_completed_at, employee_count, date_format,
--  timezone, currency, deleted_at, created_by) aren't exposed as editable
--  fields in that page at all, so they're intentionally left out here.
--  `status` (is_active) is also left out — it's driven by dedicated
--  suspend/activate endpoints in your controller, not a plain field.
--
--  max_length mirrors the actual Sequelize column lengths from Company.ts.
-- ============================================================================

START TRANSACTION;

-- 1. Module -------------------------------------------------------------------
-- hr_modules has no company_id — modules are global. Per-company access is
-- granted via module_companies (step 1b), same as Location.
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Company', 'company', '🏢', 'Company profile, registration & contact details', 0, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'company' LIMIT 1);

-- 1b. Enable the module for a company ------------------------------------------
-- Replace 1 with the real company_id, or use
--   INSERT INTO module_companies (module_id, company_id, created_at, updated_at)
--   SELECT @module_id, id, NOW(), NOW() FROM companies
-- to enable it for every existing company at once.
INSERT INTO module_companies (module_id, company_id, created_at, updated_at)
VALUES
    (@module_id, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 2. Form -----------------------------------------------------------------------
INSERT INTO form_definitions
    (company_id, module_id, name, slug, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    (NULL, @module_id, 'Company', 'company', 'Company profile fields (name, registration, address, contact, employee code range)', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'company' LIMIT 1);

-- 3. Fields -----------------------------------------------------------------------
-- Sectioned to match the visual groupings in CompanyPage.tsx (the unlabeled
-- "Basic Info" block, then Address / Contact / Employee Code Range headers
-- that already appear in that form).
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    -- ── Basic Info ──────────────────────────────────────────────────────────
    (NULL, @form_id, 'text', 'Company Name', 'company_name', 'Basic Info',
     'e.g. Narula Exports', NULL, 1, 200, NULL, NULL, NULL, NULL, 0, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Legal Name', 'legal_name', 'Basic Info',
     'Registered legal name', NULL, 0, 200, NULL, NULL, NULL, NULL, 1, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Tagline', 'tagline', 'Basic Info',
     'Short one-line positioning', NULL, 0, 300, NULL, NULL, NULL, NULL, 2, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Short Code', 'code', 'Basic Info',
     'e.g. NE', NULL, 0, 20, NULL, NULL, NULL, NULL, 3, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Slug', 'slug', 'Basic Info',
     'auto-generated from name if left blank', NULL, 0, 100, NULL, NULL, NULL, NULL, 4, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'number', 'Since (Year)', 'since_year', 'Basic Info',
     'e.g. 2010', NULL, 0, NULL, NULL, NULL, NULL, NULL, 5, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Industry', 'industry', 'Basic Info',
     'e.g. Export / Trading', NULL, 0, 100, NULL, NULL, NULL, NULL, 6, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Fiscal Year', 'fiscal_year', 'Basic Info',
     'Apr-Mar', NULL, 0, 10, NULL, NULL, NULL, NULL, 7, 1, 1, NOW(), NOW()),

    -- ── Registration ────────────────────────────────────────────────────────
    (NULL, @form_id, 'text', 'GST Number', 'gstin', 'Registration',
     '22AAAAA0000A1Z5', NULL, 1, 20, NULL, NULL, NULL, NULL, 8, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'PAN', 'pan', 'Registration',
     'AAAAA0000A', NULL, 0, 20, NULL, NULL, NULL, NULL, 9, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'CIN', 'cin', 'Registration',
     'U12345DL2010PTC000000', NULL, 0, 30, NULL, NULL, NULL, NULL, 10, 1, 1, NOW(), NOW()),

    -- ── Address ─────────────────────────────────────────────────────────────
    (NULL, @form_id, 'textarea', 'Registered Address', 'address', 'Address',
     'Full registered / office address', NULL, 1, NULL, NULL, NULL, NULL, NULL, 11, 2, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'City', 'company_city', 'Address',
     'e.g. New Delhi', NULL, 0, 100, NULL, NULL, NULL, NULL, 12, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'State', 'company_state', 'Address',
     'e.g. Delhi', NULL, 0, 100, NULL, NULL, NULL, NULL, 13, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Pincode', 'pincode', 'Address',
     '110026', NULL, 0, 10, NULL, NULL, NULL, NULL, 14, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Country', 'company_country', 'Address',
     'India', NULL, 0, 100, NULL, NULL, NULL, NULL, 15, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'url', 'Google Maps Link', 'google_maps_link', 'Address',
     'https://maps.google.com/...', NULL, 0, 1000, NULL, NULL, NULL, NULL, 16, 2, 1, NOW(), NOW()),

    -- ── Contact ─────────────────────────────────────────────────────────────
    (NULL, @form_id, 'phone', 'Phone', 'company_phone', 'Contact',
     '+91 ...', NULL, 0, 20, NULL, NULL, NULL, NULL, 17, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'email', 'Email', 'company_email', 'Contact',
     'info@company.com', NULL, 0, 255, NULL, NULL, NULL, NULL, 18, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'email', 'HR Email', 'hr_email', 'Contact',
     'hr@company.com', NULL, 0, 255, NULL, NULL, NULL, NULL, 19, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'url', 'Website', 'website', 'Contact',
     'https://...', NULL, 0, 300, NULL, NULL, NULL, NULL, 20, 1, 1, NOW(), NOW()),

    -- ── Employee Code Range ─────────────────────────────────────────────────
    (NULL, @form_id, 'text', 'Employee Code Start', 'employee_code_start', 'Employee Code Range',
     'e.g. 1', NULL, 0, 10, NULL, NULL, NULL, NULL, 21, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Employee Code End', 'employee_code_end', 'Employee Code Range',
     'e.g. 9999', NULL, 0, 10, NULL, NULL, NULL, NULL, 22, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Reserved / Skip Codes', 'employee_code_skip', 'Employee Code Range',
     'e.g. 13, 786', 'Comma-separated numbers within the range above to reserve/exclude from auto-assignment.',
     0, NULL, NULL, NULL, NULL, NULL, 23, 1, 1, NOW(), NOW()),

    -- ── Other ───────────────────────────────────────────────────────────────
    (NULL, @form_id, 'textarea', 'Notes', 'company_notes', 'Other',
     'Internal notes about this company (not shown on the portal)', NULL, 0, NULL, NULL, NULL, NULL, NULL, 24, 2, 1, NOW(), NOW()),

    (NULL, @form_id, 'textarea', 'About', 'about', 'Other',
     'Short company description for letters, portal & onboarding', NULL, 0, NULL, NULL, NULL, NULL, NULL, 25, 2, 1, NOW(), NOW()),

    (NULL, @form_id, 'image', 'Logo', 'logo_url', 'Other',
     NULL, 'PNG / JPG / WebP · under 800 KB', 0, 500, NULL, NULL, NULL, NULL, 26, 1, 1, NOW(), NOW()),

    (NULL, @form_id, 'text', 'Theme Color', 'theme_color', 'Other',
     '#1e56d9', 'Applied as the primary color across this company''s employee portal.',
     0, 20, NULL, NULL, NULL, NULL, 27, 1, 1, NOW(), NOW())

ON DUPLICATE KEY UPDATE
    label       = VALUES(label),
    field_type  = VALUES(field_type),
    section     = VALUES(section),
    placeholder = VALUES(placeholder),
    help_text   = VALUES(help_text),
    is_required = VALUES(is_required),
    max_length  = VALUES(max_length),
    sort_order  = VALUES(sort_order),
    column_span = VALUES(column_span),
    is_active   = VALUES(is_active),
    updated_at  = NOW();

COMMIT;


-- -- ============================================================================
-- --  Grant full field permissions — ⚠️ UNVERIFIED TABLE NAME
-- --  ----------------------------------------------------------------------
-- --  field_permissions_v2 is keyed by group_id, but I have never seen the
-- --  actual model/table that defines a "group" (referenced only in passing
-- --  as PermissionGroups.ts, never shared). `permission_groups` below is a
-- --  GUESS at that table's name and its primary key column (id). If that's
-- --  wrong, this block will fail with the same "Unknown column"/"doesn't
-- --  exist" error the earlier hr_modules.company_id mistake did — please
-- --  confirm the real table name (or paste PermissionGroups.ts) and I'll
-- --  correct this block in one pass rather than guessing further.
-- --
-- --  What this does: grants full permission (view/add/edit/copy/download,
-- --  no masking) on every Company field just inserted, to every existing
-- --  group, for company_id = 1 (same placeholder as module_companies above
-- --  — adjust or loop per company the same way).
-- -- ============================================================================

-- START TRANSACTION;

-- INSERT INTO field_permissions_v2
--     (group_id, field_id, company_id, can_view, can_add, can_edit, can_copy, can_download, is_masked, is_partial_masked)
-- SELECT
--     pg.id, df.id, 1, 1, 1, 1, 1, 1, 0, 0
-- FROM permission_groups pg
-- CROSS JOIN dynamic_fields df
-- WHERE df.form_id = @form_id
-- ON DUPLICATE KEY UPDATE
--     can_view = 1, can_add = 1, can_edit = 1, can_copy = 1, can_download = 1,
--     is_masked = 0, is_partial_masked = 0;

-- COMMIT;