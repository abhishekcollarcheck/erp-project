// import { Shift, DaySpan } from './shift.model';

import { DaySpan, Shift } from "../../database/models/Shift";

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
    return Shift.create({
      label: data.label,
      start_time: data.start_time ?? null,
      end_time: data.end_time ?? null,
      half_day_time: data.half_day_time ?? null,
      day_span: data.day_span ?? '1 day',
    });
  }

  public async updateShift(id: number, data: UpdateShiftInput): Promise<Shift> {
    const shift = await Shift.findByPk(id);
    if (!shift) {
      throw new Error('Shift not found');
    }

    return shift.update(data);
  }

  public async deleteShift(id: number): Promise<void> {
    const shift = await Shift.findByPk(id);
    if (!shift) {
      throw new Error('Shift not found');
    }

    await shift.destroy();
  }
}

export const shiftService = new ShiftService();