import { Bank } from '../../database/models/bank.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export class BankService {
  public async getAllBanks(): Promise<Bank[]> {
    return Bank.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createBank(name: string): Promise<Bank> {
    const cleanName = requireName(name, 'Bank');
    const code = toCode(cleanName);
    await assertUniqueMaster(Bank, { name: cleanName, code }, 'Bank');
    const count = await Bank.count();
    return Bank.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateBank(id: number, name: string): Promise<Bank> {
    const cleanName = requireName(name, 'Bank');
    const item = assertFound(await Bank.findByPk(id), 'Bank');
    const code = toCode(cleanName);
    await assertUniqueMaster(Bank, { name: cleanName, code }, 'Bank', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteBank(id: number): Promise<void> {
    const item = assertFound(await Bank.findByPk(id), 'Bank');
    await item.destroy();
  }
}

export const bankService = new BankService();
