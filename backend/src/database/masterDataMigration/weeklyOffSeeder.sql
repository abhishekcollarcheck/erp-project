-- ============================================================================
--  Weekly Off form definition — MySQL
--  ONE hr_modules row (slug 'weekly_off'), ONE form_definition, ONE field
--  (preset_name). always_off (day checkboxes) and nth_off_rules (structured
--  week/day rules, stored as JSON) aren't modeled as separate permissioned
--  fields — same reasoning as Department/Company's relationship pickers:
--  no clean single FIELD_TYPES mapping for structured JSON, so editing them
--  rides on preset_name's can_edit.
--
--  max_length 150 matches WeeklyOffPreset.name (STRING(150)).
--
--  Uses the `permissions` table (not `system_permissions` — corrected).
-- ============================================================================

START TRANSACTION;

-- 1. Module ---------------------------------------------------------------------
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Weekly Off', 'weekly_off', '📅', 'Weekly off presets and nth-of-month rules', 6, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'weekly_off' LIMIT 1);

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
    (NULL, @module_id, 'Weekly Off', 'weekly_off', 'Weekly off preset records', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'weekly_off' LIMIT 1);

-- 3. Field ------------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Preset Name', 'preset_name', 'Weekly Off',
     'e.g. Sunday + 4th Saturday', NULL,
     1, 150, NULL, NULL, NULL,
     NULL, 0, 1, 1, NOW(), NOW())

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
--     field-level matrix above.
-- ============================================================================

START TRANSACTION;

INSERT INTO permissions (module, action, slug, description)
SELECT module, action, slug, description FROM (
    SELECT 'weekly_off' AS module, 'view'     AS action, 'weekly_off:view'     AS slug, NULL AS description
    UNION ALL SELECT 'weekly_off', 'create',   'weekly_off:create',   NULL
    UNION ALL SELECT 'weekly_off', 'edit',     'weekly_off:edit',     NULL
    UNION ALL SELECT 'weekly_off', 'delete',   'weekly_off:delete',   NULL
    UNION ALL SELECT 'weekly_off', 'download', 'weekly_off:download', NULL
) AS new_perms
WHERE NOT EXISTS (
    SELECT 1 FROM permissions sp WHERE sp.slug = new_perms.slug
);

COMMIT;