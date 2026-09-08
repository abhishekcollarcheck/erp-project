import { InsuredAmount, InsuredAmountBracket } from '../../database/models/insuredAmount.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

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
    const cleanName = requireName(name, 'Insured amount');
    const code = toCode(cleanName);
    await assertUniqueMaster(InsuredAmount, { name: cleanName, code }, 'Insured amount');
    const count = await InsuredAmount.count();
    return InsuredAmount.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateMaster(id: number, name: string): Promise<InsuredAmount> {
    const cleanName = requireName(name, 'Insured amount');
    const item = assertFound(await InsuredAmount.findByPk(id), 'Insured amount');
    const code = toCode(cleanName);
    await assertUniqueMaster(InsuredAmount, { name: cleanName, code }, 'Insured amount', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteMaster(id: number): Promise<void> {
    const item = assertFound(await InsuredAmount.findByPk(id), 'Insured amount');
    await item.destroy();
  }

  public async createBracket(min_salary: number, max_salary: number | null, insured_amount_id: number): Promise<InsuredAmountBracket> {
    const count = await InsuredAmountBracket.count();
    return InsuredAmountBracket.create({ min_salary, max_salary, insured_amount_id, display_order: count + 1 });
  }

  public async updateBracket(id: number, payload: { min_salary?: number; max_salary?: number | null; insured_amount_id?: number }): Promise<InsuredAmountBracket> {
    const bracket = assertFound(await InsuredAmountBracket.findByPk(id), 'Bracket');
    return bracket.update(payload);
  }

  public async deleteBracket(id: number): Promise<void> {
    const bracket = assertFound(await InsuredAmountBracket.findByPk(id), 'Bracket');
    await bracket.destroy();
  }
}

export const insuredAmountService = new InsuredAmountService();