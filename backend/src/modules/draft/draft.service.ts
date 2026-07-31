import { Op, WhereOptions, fn, col } from 'sequelize';
import { Draft } from '../../database/models/Draft';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

export interface SaveDraftDto {
  form_id: number;
  session_id: string;
  step: number;
  form_data: Record<string, any>;
  record_id?: number | null;
}

export interface UpdateDraftDto {
  step?: number;
  form_data?: Record<string, any>;
  current_step?: number;
}

export interface DraftQueryParams {
  form_id?: number | string;
  completed?: boolean | string;
  session_id?: string;
}

export class DraftService {

  // ─── List ──────────────────────────────────────────────────────────────────
  async getAll(userId: number, query: DraftQueryParams = {}) {
    const where: WhereOptions = { user_id: userId };

    if (query.form_id) {
      where['form_id'] = Number(query.form_id);
    }

    if (query.completed === 'true' || query.completed === true) {
      where['completed'] = true;
    } else if (query.completed === 'false' || query.completed === false) {
      where['completed'] = false;
    }
    // If not specified, return all (no filter)

    if (query.session_id) {
      where['session_id'] = query.session_id;
    }

    const drafts = await Draft.findAll({
      where,
      order: [['saved_at', 'DESC']],
    });

    return drafts;
  }

  // ─── Single ────────────────────────────────────────────────────────────────
  async getById(id: number, userId: number) {
    const draft = await Draft.findOne({
      where: { id, user_id: userId },
    });

    if (!draft) throw new AppError('Draft not found', 404);
    return draft;
  }

  // ─── Get by Session ────────────────────────────────────────────────────────
  async getBySession(formId: number, sessionId: string, userId: number) {
    const draft = await Draft.findOne({
      where: {
        form_id: formId,
        session_id: sessionId,
        user_id: userId,
      },
    });

    if (!draft) throw new AppError('Draft not found', 404);
    return draft;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats(userId: number) {
    const [total, completed, active] = await Promise.all([
      Draft.count({ where: { user_id: userId } }),
      Draft.count({ where: { user_id: userId, completed: true } }),
      Draft.count({ where: { user_id: userId, completed: false } }),
    ]);

    // Most recent draft
    const recent = await Draft.findOne({
      where: { user_id: userId },
      order: [['saved_at', 'DESC']],
    });

    return {
      total,
      completed,
      active,
      lastDraftAt: recent?.saved_at || null,
    };
  }

  // ─── Save Draft ────────────────────────────────────────────────────────────
  async saveDraft(companyId: number, userId: number, dto: SaveDraftDto): Promise<Draft> {
    // Validate required fields
    if (!dto.form_id || !dto.session_id || typeof dto.step !== 'number') {
      throw new AppError('Missing required fields: form_id, session_id, step', 400);
    }

    if (!dto.form_data || typeof dto.form_data !== 'object') {
      throw new AppError('form_data must be an object', 400);
    }

    // Validate session_id format
    if (!/^w_\d+_[a-z0-9]{6}$/.test(dto.session_id)) {
      throw new AppError('Invalid session_id format', 400);
    }

    // TODO: Verify user has access to this form
    // const form = await Form.findByPk(dto.form_id);
    // if (!form) throw new AppError('Form not found', 404);

    // Create or update draft (upsert)
    const [draft, created] = await Draft.findOrCreate({
      where: {
        session_id: dto.session_id,
        form_id: dto.form_id,
        user_id: userId,
      },
      defaults: {
        session_id: dto.session_id,
        form_id: dto.form_id,
        user_id: userId,
        current_step: dto.step,
        form_data: dto.form_data,
        record_id: dto.record_id || null,
        saved_at: new Date(),
        completed: false,
      },
    });

    // If already exists, update it
    if (!created) {
      await draft.update({
        current_step: dto.step,
        form_data: dto.form_data,
        record_id: dto.record_id || null,
        saved_at: new Date(),
      });
    }

    await logActivity({
      companyId,
      action: created ? 'DRAFT_CREATED' : 'DRAFT_UPDATED',
      module: 'drafts',
      entityId: draft.id,
      newValues: { form_id: draft.form_id, step: draft.current_step },
    });

    return draft;
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(companyId:number, id: number, userId: number, dto: UpdateDraftDto): Promise<Draft> {
    const draft = await this.getById(id, userId);

    const updateData: any = {};
    if (dto.step !== undefined) updateData.current_step = dto.step;
    if (dto.current_step !== undefined) updateData.current_step = dto.current_step;
    if (dto.form_data !== undefined) updateData.form_data = dto.form_data;
    updateData.saved_at = new Date();

    await draft.update(updateData);

    await logActivity({
      companyId,
      action: 'DRAFT_UPDATED',
      module: 'drafts',
      entityId: id,
      newValues: { step: draft.current_step },
    });

    return draft;
  }

  // ─── Mark as Complete ──────────────────────────────────────────────────────
  async markComplete(companyId:number, id: number, userId: number): Promise<Draft> {
    const draft = await this.getById(id, userId);

    await draft.update({
      completed: true,
      saved_at: new Date(),
    });

    await logActivity({
      companyId,
      action: 'DRAFT_COMPLETED',
      module: 'drafts',
      entityId: id,
      newValues: { completed: true },
    });

    return draft;
  }

  // ─── Delete ────────────────────────────────────────────────────────────────
  async delete(companyId:number, id: number, userId: number): Promise<void> {
    const draft = await this.getById(id, userId);

    await draft.destroy();

    await logActivity({
      companyId,
      action: 'DRAFT_DELETED',
      module: 'drafts',
      entityId: id,
      oldValues: { form_id: draft.form_id, session_id: draft.session_id },
    });
  }

  // ─── Delete by Form ────────────────────────────────────────────────────────
  async deleteByForm(companyId:number, formId: number, userId: number): Promise<void> {
    const drafts = await Draft.findAll({
      where: { form_id: formId, user_id: userId },
    });

    if (drafts.length === 0) {
      throw new AppError('No drafts found for this form', 404);
    }

    await Draft.destroy({
      where: { form_id: formId, user_id: userId },
    });

    await logActivity({
      companyId,
      action: 'DRAFTS_DELETED',
      module: 'drafts',
      entityId: formId,
      oldValues: { form_id: formId, count: drafts.length },
    });
  }

  // ─── Private ───────────────────────────────────────────────────────────────
  private async findOrFail(id: number, userId: number): Promise<Draft> {
    const draft = await Draft.findOne({ where: { id, user_id: userId } });
    if (!draft) throw new AppError('Draft not found', 404);
    return draft;
  }
}