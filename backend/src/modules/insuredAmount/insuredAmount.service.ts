import { InsuredAmount, InsuredAmountBracket } from '../../database/models/insuredAmount.model';

export class InsuredAmountService {
  public async getAllMaster(): Promise<InsuredAmount[]> {
    return InsuredAmount.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async getAllBrackets(): Promise<InsuredAmountBracket[]> {
    return InsuredAmountBracket.findAll({
      include: [{ model: InsuredAmount, as: 'insuredAmount' }],
      order: [['display_order', 'ASC'], ['min_salary', 'ASC']],
    });
  }

  public async createMaster(name: string): Promise<InsuredAmount> {
    const count = await InsuredAmount.count();
    return InsuredAmount.create({
      name: name.trim(),
      code: name.trim().toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateMaster(id: number, name: string): Promise<InsuredAmount> {
    const item = await InsuredAmount.findByPk(id);
    if (!item) throw new Error('Insured amount not found');
    return item.update({ name: name.trim(), code: name.trim().toUpperCase().replace(/\s+/g, '_') });
  }

  public async deleteMaster(id: number): Promise<void> {
    const item = await InsuredAmount.findByPk(id);
    if (!item) throw new Error('Insured amount not found');
    await item.destroy();
  }

  public async createBracket(min_salary: number, max_salary: number | null, insured_amount_id: number): Promise<InsuredAmountBracket> {
    const count = await InsuredAmountBracket.count();
    return InsuredAmountBracket.create({ min_salary, max_salary, insured_amount_id, display_order: count + 1 });
  }

  public async updateBracket(id: number, payload: { min_salary?: number; max_salary?: number | null; insured_amount_id?: number }): Promise<InsuredAmountBracket> {
    const bracket = await InsuredAmountBracket.findByPk(id);
    if (!bracket) throw new Error('Bracket not found');
    return bracket.update(payload);
  }

  public async deleteBracket(id: number): Promise<void> {
    const bracket = await InsuredAmountBracket.findByPk(id);
    if (!bracket) throw new Error('Bracket not found');
    await bracket.destroy();
  }
}

export const insuredAmountService = new InsuredAmountService();