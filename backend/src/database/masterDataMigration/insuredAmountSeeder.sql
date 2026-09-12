-- ============================================================================
--  Insured Amount form definition — MySQL
--  Same pattern as Bond/Exit Status: one hr_modules row, one
--  module_companies enablement row, one form_definition, one field.
--
--  Only InsuredAmount.name is modeled as a permissioned field. The salary
--  bracket table (InsuredAmountBracket: min_salary/max_salary/
--  insured_amount_id) isn't representable as a simple dynamic_field — it's
--  relational/numeric config rows in a separate table, not a form field —
--  so editing brackets rides on the master name field's can_edit, same
--  reasoning as Department's company-scope pickers. `code`/`display_order`
--  on InsuredAmount also excluded, not in the page UI.
--
--  Uses the `permissions` table (corrected name, not `system_permissions`).
-- ============================================================================

START TRANSACTION;

-- 1. Module ---------------------------------------------------------------------
INSERT INTO hr_modules
    (name, slug, icon, description, sort_order, is_active, is_system, created_at, updated_at)
VALUES
    ('Insured Amount', 'insured_amount', '🛡️', 'Insured covers by salary bracket', 13, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @module_id = (SELECT id FROM hr_modules WHERE slug = 'insured_amount' LIMIT 1);

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
    (NULL, @module_id, 'Insured Amount', 'insured_amount', 'Insured amount catalog entries', 1, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

SET @form_id = (SELECT id FROM form_definitions WHERE module_id = @module_id AND slug = 'insured_amount' LIMIT 1);

-- 3. Field ------------------------------------------------------------------------
INSERT INTO dynamic_fields
    (company_id, form_id, field_type, label, field_key, section, placeholder, help_text,
     is_required, max_length, dynamic_source, dynamic_source_label, dynamic_source_value,
     dynamic_source_filter, sort_order, column_span, is_active, created_at, updated_at)
VALUES
    (NULL, @form_id, 'text', 'Insured Amount Name', 'insured_amount_name', 'Insured Amount',
     'Add insured amount...', NULL,
     1, 100, NULL, NULL, NULL,
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
    SELECT 'insured_amount' AS module, 'view'     AS action, 'insured_amount:view'     AS slug, NULL AS description
    UNION ALL SELECT 'insured_amount', 'create',   'insured_amount:create',   NULL
    UNION ALL SELECT 'insured_amount', 'edit',     'insured_amount:edit',     NULL
    UNION ALL SELECT 'insured_amount', 'delete',   'insured_amount:delete',   NULL
    UNION ALL SELECT 'insured_amount', 'download', 'insured_amount:download', NULL
) AS new_perms
WHERE NOT EXISTS (
    SELECT 1 FROM permissions sp WHERE sp.slug = new_perms.slug
);

COMMIT;