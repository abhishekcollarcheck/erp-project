import { Shift } from '../../database/models/Shift';

export class ShiftService {
  async listActive() {
    return Shift.findAll({
      where: { is_active: true },
      order: [['id', 'ASC']],
      attributes: ['id', 'label', 'category', 'start_time', 'end_time', 'duration_minutes', 'crosses_midnight'],
    });
  }
}

export const shiftService = new ShiftService();