// import { Shift, DaySpan } from './shift.model';

import { DaySpan, Shift } from "../../database/models/Shift";
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

export interface CreateShiftInput {
  label: string;
  start_time?: string | null;
  end_time?: string | null;
  half_day_time?: string | null;
  day_span?: DaySpan;
}

export interface UpdateShiftInput {
  label?: string;
  start_time?: string | null;
  end_time?: string | null;
  half_day_time?: string | null;
  day_span?: DaySpan;
  is_active?: boolean;
}

export class ShiftService {
  public async getAllShifts(): Promise<Shift[]> {
    return Shift.findAll({
      order: [['id', 'ASC']],
    });
  }

  public async getShiftById(id: number): Promise<Shift | null> {
    return Shift.findByPk(id);
  }

  public async createShift(data: CreateShiftInput): Promise<Shift> {
    const label = requireName(data.label, 'Shift label');
    await assertUniqueMaster(Shift, { label }, 'Shift');
    return Shift.create({
      label,
      start_time: data.start_time ?? null,
      end_time: data.end_time ?? null,
      half_day_time: data.half_day_time ?? null,
      day_span: data.day_span ?? '1 day',
    });
  }

  public async updateShift(id: number, data: UpdateShiftInput): Promise<Shift> {
    const shift = assertFound(await Shift.findByPk(id), 'Shift');
    if (data.label !== undefined) {
      data.label = requireName(data.label, 'Shift label');
      await assertUniqueMaster(Shift, { label: data.label }, 'Shift', id);
    }
    return shift.update(data);
  }

  public async deleteShift(id: number): Promise<void> {
    const shift = assertFound(await Shift.findByPk(id), 'Shift');
    await shift.destroy();
  }
}

export const shiftService = new ShiftService();