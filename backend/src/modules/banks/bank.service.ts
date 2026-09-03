import { Bank } from '../../database/models/bank.model';

export class BankService {
  public async getAllBanks(): Promise<Bank[]> {
    return Bank.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createBank(name: string): Promise<Bank> {
    const count = await Bank.count();
    const cleanName = name.trim();
    return Bank.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateBank(id: number, name: string): Promise<Bank> {
    const item = await Bank.findByPk(id);
    if (!item) throw new Error('Bank not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    });
  }

  public async deleteBank(id: number): Promise<void> {
    const item = await Bank.findByPk(id);
    if (!item) throw new Error('Bank not found');
    await item.destroy();
  }
}

export const bankService = new BankService();