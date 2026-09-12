-- ============================================================================
--  Emergency Relationship form definition — MySQL
--  Same pattern as House Type/Gender: one hr_modules row, one
--  module_companies enablement row, one form_definition, one field.
--
--  Only `name` is modeled as a permissioned field — `code` exists on the
--  model but isn't exposed in EmergencyRelationshipPage.tsx's UI, so
--  excluded. max_length 50 matches EmergencyRelationship.name (STRING(50)).
--
--  Uses the `permissions` table (corrected name, not `system_permissions`).
-- ============================================================================

START TRANSACTION;

-- 1. Module ---------------------------------------------------------------------
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Emergency Relationship', 'emergency_relationship', '🚑', 'Emergency contact relationship catalog', 23, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'emergency_relationship' LIMIT 1);

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
    (NULL, @module_id, 'Emergency Relationship', 'emergency_relationship', 'Emergency relationship catalog entries', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'emergency_relationship' LIMIT 1);

-- 3. Field ------------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Emergency Relationship Name', 'emergency_relationship_name', 'Emergency Relationship',
     'Add emergency relationship...', NULL,
     1, 50, NULL, NULL, NULL,
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
    SELECT 'emergency_relationship' AS module, 'view'     AS action, 'emergency_relationship:view'     AS slug, NULL AS description
    UNION ALL SELECT 'emergency_relationship', 'create',   'emergency_relationship:create',   NULL
    UNION ALL SELECT 'emergency_relationship', 'edit',     'emergency_relationship:edit',     NULL
    UNION ALL SELECT 'emergency_relationship', 'delete',   'emergency_relationship:delete',   NULL
    UNION ALL SELECT 'emergency_relationship', 'download', 'emergency_relationship:download', NULL
) AS new_perms
WHERE NOT EXISTS (
    SELECT 1 FROM permissions sp WHERE sp.slug = new_perms.slug
);

COMMIT;