import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// HR ↔ candidate document exchange:
//   kind = 'Share'   → HR shares a file/link with the candidate (JD, policy, brief …)
//   kind = 'Request' → HR asks the candidate to provide something (ID proof, bank details …)
// The candidate acts on it from the portal: 'Read' (a shared file) or 'Completed' (a request).
export type CandidateDocumentKind   = 'Share' | 'Request';
export type CandidateDocumentStatus = 'Pending' | 'Read' | 'Completed';

export interface CandidateDocumentAttributes {
  id: number;
  company_id: number;
  candidate_id: number;
  kind: CandidateDocumentKind;
  title: string;
  category?: string | null;
  file_url?: string | null;
  note?: string | null;
  status: CandidateDocumentStatus;
  shared_by?: number | null;
  shared_at?: Date | null;
  responded_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type CandidateDocumentCreationAttributes = Optional<
  CandidateDocumentAttributes,
  'id' | 'status' | 'category' | 'file_url' | 'note' | 'shared_by' | 'shared_at' | 'responded_at'
>;

export class CandidateDocument
  extends Model<CandidateDocumentAttributes, CandidateDocumentCreationAttributes>
  implements CandidateDocumentAttributes {
  public id!: number;
  public company_id!: number;
  public candidate_id!: number;
  public kind!: CandidateDocumentKind;
  public title!: string;
  public category!: string | null;
  public file_url!: string | null;
  public note!: string | null;
  public status!: CandidateDocumentStatus;
  public shared_by!: number | null;
  public shared_at!: Date | null;
  public responded_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CandidateDocument.init(
  {
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
  },
  {
    sequelize,
    tableName: 'candidate_documents',
    modelName: 'CandidateDocument',
    underscored: true,
    // Named indexes only — never inline `unique: true` on a column (repeated
    // dev-boot sync() re-creates anonymous indexes until the 64-key ceiling).
    indexes: [
      { fields: ['candidate_id'], name: 'candidate_documents_candidate_idx' },
      { fields: ['company_id'],   name: 'candidate_documents_company_idx' },
    ],
  },
);
