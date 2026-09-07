import { QueryInterface, DataTypes } from 'sequelize';

/**
 * `candidate_documents` — HR ↔ candidate document exchange (shared files the
 * candidate reads in the portal, and documents HR requests the candidate to
 * provide). Powers the Candidate View "Shared documents / Pending by candidate
 * / Completed by candidate" panels and the portal "Documents" card.
 *
 * Idempotent: on a dev DB the model's `sequelize.sync({ alter: false })` on
 * boot already creates this table, so `up()` skips when it exists. This
 * migration is for fresh / CI databases where migrations run before the app.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const existing = tables.map(t => (typeof t === 'string' ? t : (t as any).tableName));
  if (existing.includes('candidate_documents')) {
    console.log('[create-candidate-documents] table already exists — skipping.');
    return;
  }

  await queryInterface.createTable('candidate_documents', {
    id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    candidate_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    kind:         { type: DataTypes.ENUM('Share', 'Request'), allowNull: false, defaultValue: 'Share' },
    title:        { type: DataTypes.STRING(200), allowNull: false },
    category:     { type: DataTypes.STRING(60), allowNull: true },
    file_url:     { type: DataTypes.STRING(500), allowNull: true },
    note:         { type: DataTypes.TEXT, allowNull: true },
    status:       { type: DataTypes.ENUM('Pending', 'Read', 'Completed'), allowNull: false, defaultValue: 'Pending' },
    shared_by:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    shared_at:    { type: DataTypes.DATE, allowNull: true },
    responded_at: { type: DataTypes.DATE, allowNull: true },
    created_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('candidate_documents', {
    fields: ['candidate_id'], name: 'candidate_documents_candidate_idx',
  }).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
  await queryInterface.addIndex('candidate_documents', {
    fields: ['company_id'], name: 'candidate_documents_company_idx',
  }).catch((e: any) => {
    if (e?.parent?.code !== 'ER_DUP_KEYNAME' && e?.original?.code !== 'ER_DUP_KEYNAME') throw e;
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('candidate_documents');
}
