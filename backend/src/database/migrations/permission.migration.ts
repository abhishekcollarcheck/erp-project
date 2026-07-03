// ALTER TABLE user_groups
// DROP INDEX user_groups_employee_id_group_id_unique;

// ALTER TABLE departments
// DROP INDEX departments_company_id_name;

// ALTER TABLE departments
// DROP COLUMN company_id;

// CREATE UNIQUE INDEX departments_name_unique
// ON departments(name);

// ALTER TABLE designations
// DROP INDEX designations_company_id_name;

// ALTER TABLE designations
// DROP INDEX designations_company_id;

// ALTER TABLE designations
// DROP COLUMN company_id;

// ALTER TABLE designations
// ADD CONSTRAINT designations_name_unique
// UNIQUE (name);