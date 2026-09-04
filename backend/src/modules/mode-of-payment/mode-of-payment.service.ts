import { ModeOfPayment } from '../../database/models/mode-of-payment.model';

export class ModeOfPaymentService {
  public async getAllModesOfPayment(): Promise<ModeOfPayment[]> {
    return ModeOfPayment.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createModeOfPayment(name: string): Promise<ModeOfPayment> {
    const count = await ModeOfPayment.count();
    const cleanName = name.trim();
    return ModeOfPayment.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateModeOfPayment(id: number, name: string): Promise<ModeOfPayment> {
    const item = await ModeOfPayment.findByPk(id);
    if (!item) throw new Error('Mode of payment not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    });
  }

  public async deleteModeOfPayment(id: number): Promise<void> {
    const item = await ModeOfPayment.findByPk(id);
    if (!item) throw new Error('Mode of payment not found');
    await item.destroy();
  }
}

export const modeOfPaymentService = new ModeOfPaymentService();