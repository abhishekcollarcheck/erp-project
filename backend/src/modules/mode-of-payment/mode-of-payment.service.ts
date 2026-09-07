import { ModeOfPayment } from '../../database/models/mode-of-payment.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export class ModeOfPaymentService {
  public async getAllModesOfPayment(): Promise<ModeOfPayment[]> {
    return ModeOfPayment.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createModeOfPayment(name: string): Promise<ModeOfPayment> {
    const cleanName = requireName(name, 'Mode of payment');
    const code = toCode(cleanName);
    await assertUniqueMaster(ModeOfPayment, { name: cleanName, code }, 'Mode of payment');
    const count = await ModeOfPayment.count();
    return ModeOfPayment.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateModeOfPayment(id: number, name: string): Promise<ModeOfPayment> {
    const cleanName = requireName(name, 'Mode of payment');
    const item = assertFound(await ModeOfPayment.findByPk(id), 'Mode of payment');
    const code = toCode(cleanName);
    await assertUniqueMaster(ModeOfPayment, { name: cleanName, code }, 'Mode of payment', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteModeOfPayment(id: number): Promise<void> {
    const item = assertFound(await ModeOfPayment.findByPk(id), 'Mode of payment');
    await item.destroy();
  }
}

export const modeOfPaymentService = new ModeOfPaymentService();
