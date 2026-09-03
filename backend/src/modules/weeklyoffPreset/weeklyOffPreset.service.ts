import { WeeklyOffPreset, WeekDay, NthRule } from '../../database/models/weeklyOffPreset';

// import { WeekDay } from "@/database/models/weeklyOffPreset";

export interface CreateWeeklyOffPresetInput {
  name: string;
  always_off?: WeekDay[];
  nth_off_rules?: NthRule[];
}

export interface UpdateWeeklyOffPresetInput {
  name?: string;
  always_off?: WeekDay[];
  nth_off_rules?: NthRule[];
  is_active?: boolean;
}

export class WeeklyOffPresetService {
  public async getAllPresets(): Promise<WeeklyOffPreset[]> {
    return WeeklyOffPreset.findAll({
      order: [['id', 'ASC']],
    });
  }

  public async getPresetById(id: number): Promise<WeeklyOffPreset | null> {
    return WeeklyOffPreset.findByPk(id);
  }

  public async createPreset(data: CreateWeeklyOffPresetInput): Promise<WeeklyOffPreset> {
    return WeeklyOffPreset.create({
      name: data.name,
      always_off: data.always_off ?? [],
      nth_off_rules: data.nth_off_rules ?? [],
    });
  }

  public async updatePreset(
    id: number,
    data: UpdateWeeklyOffPresetInput
  ): Promise<WeeklyOffPreset> {
    const preset = await WeeklyOffPreset.findByPk(id);
    if (!preset) {
      throw new Error('Weekly off preset not found');
    }

    return preset.update(data);
  }

  public async deletePreset(id: number): Promise<void> {
    const preset = await WeeklyOffPreset.findByPk(id);
    if (!preset) {
      throw new Error('Weekly off preset not found');
    }

    await preset.destroy();
  }
}

export const weeklyOffPresetService = new WeeklyOffPresetService();