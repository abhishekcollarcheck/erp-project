// import { Country, State, City, Site, PayRegister } from '../models';
import { City, Country, PayRegister, Site, State } from '../../database/models/Location';
import { FindOptions, Op, WhereOptions } from 'sequelize';
import { requireName, assertUniqueMaster } from '../../utils/masterCrud';
import { AppError } from '../../middleware/errorHandler.middleware';

/**
 * A location name only has to be unique within its parent, not globally:
 * a State within its Country, a City within its State, a Site / Pay Register
 * within its Company. `scope` carries that parent key/value.
 */
async function assertUniqueWithin(
  Model: any, name: string, scope: Record<string, unknown>, label: string, excludeId?: number,
) {
  const where: any = { name };
  for (const [k, v] of Object.entries(scope)) if (v != null) where[k] = v;
  if (excludeId != null) where.id = { [Op.ne]: excludeId };
  if (await Model.findOne({ where })) throw new AppError(`${label} "${name}" already exists`, 409);
}

// ─── COUNTRY SERVICE ────────────────────────────────────────────────────────
export class CountryService {
  async create(data: any, userId?: number) {
    const name = requireName(data.name, 'Country');
    await assertUniqueMaster(Country, { name }, 'Country');
    return await Country.create({ ...data, name, created_by: userId });
  }

  async findAll(options: FindOptions = {}) {
    return await Country.findAndCountAll(options);
  }

  async findById(id: number) {
    return await Country.findByPk(id, {
      include: [{ model: State, as: 'states' }],
    });
  }

  async update(id: number, data: any, userId?: number) {
    const item = await Country.findByPk(id);
    if (!item) return null;
    if (data.name !== undefined) {
      data.name = requireName(data.name, 'Country');
      await assertUniqueMaster(Country, { name: data.name }, 'Country', id);
    }
    return await item.update({ ...data, updated_by: userId });
  }

  async delete(id: number, userId?: number) {
    const item = await Country.findByPk(id);
    if (!item) return false;
    if (userId) await item.update({ deleted_by: userId });
    await item.destroy();
    return true;
  }
}

// ─── STATE SERVICE ──────────────────────────────────────────────────────────
export class StateService {
  async create(data: any, userId?: number) {
    const name = requireName(data.name, 'State');
    await assertUniqueWithin(State, name, { country_id: data.country_id }, 'State');
    return await State.create({ ...data, name, created_by: userId });
  }

  async findAll(options: FindOptions = {}) {
    return await State.findAndCountAll({
      include: [{ model: Country, as: 'country', attributes: ['id', 'name', 'code'] }],
      ...options,
    });
  }

  async findById(id: number) {
    return await State.findByPk(id, {
      include: [
        { model: Country, as: 'country' },
        { model: City, as: 'cities' },
        { model: PayRegister, as: 'pay_registers' },
      ],
    });
  }

  async update(id: number, data: any, userId?: number) {
    const item = await State.findByPk(id);
    if (!item) return null;
    if (data.name !== undefined) {
      data.name = requireName(data.name, 'State');
      await assertUniqueWithin(State, data.name, { country_id: data.country_id ?? (item as any).country_id }, 'State', id);
    }
    return await item.update({ ...data, updated_by: userId });
  }

  async delete(id: number, userId?: number) {
    const item = await State.findByPk(id);
    if (!item) return false;
    if (userId) await item.update({ deleted_by: userId });
    await item.destroy();
    return true;
  }
}

// ─── CITY SERVICE ───────────────────────────────────────────────────────────
export class CityService {
  async create(data: any, userId?: number) {
    const name = requireName(data.name, 'City');
    await assertUniqueWithin(City, name, { state_id: data.state_id }, 'City');
    return await City.create({ ...data, name, created_by: userId });
  }

  async findAll(options: FindOptions = {}) {
    return await City.findAndCountAll({
      include: [{ model: State, as: 'state', attributes: ['id', 'name'] }],
      ...options,
    });
  }

  async findById(id: number) {
    return await City.findByPk(id, {
      include: [
        { model: State, as: 'state' },
        { model: Site, as: 'sites' },
      ],
    });
  }

  async update(id: number, data: any, userId?: number) {
    const item = await City.findByPk(id);
    if (!item) return null;
    if (data.name !== undefined) {
      data.name = requireName(data.name, 'City');
      await assertUniqueWithin(City, data.name, { state_id: data.state_id ?? (item as any).state_id }, 'City', id);
    }
    return await item.update({ ...data, updated_by: userId });
  }

  async delete(id: number, userId?: number) {
    const item = await City.findByPk(id);
    if (!item) return false;
    if (userId) await item.update({ deleted_by: userId });
    await item.destroy();
    return true;
  }
}

// ─── SITE SERVICE ───────────────────────────────────────────────────────────
export class SiteService {
  async create(data: any, userId?: number) {
    const name = requireName(data.name, 'Site');
    await assertUniqueWithin(Site, name, { company_id: data.company_id }, 'Site');
    return await Site.create({ ...data, name, created_by: userId });
  }

  async findAll(options: FindOptions = {}) {
    return await Site.findAndCountAll({
      include: [{ model: City, as: 'city', attributes: ['id', 'name'] }],
      ...options,
    });
  }

  async findById(id: number) {
    return await Site.findByPk(id, {
      include: [{ model: City, as: 'city' }],
    });
  }

  async update(id: number, data: any, userId?: number) {
    const item = await Site.findByPk(id);
    if (!item) return null;
    if (data.name !== undefined) {
      data.name = requireName(data.name, 'Site');
      await assertUniqueWithin(Site, data.name, { company_id: data.company_id ?? (item as any).company_id }, 'Site', id);
    }
    return await item.update({ ...data, updated_by: userId });
  }

  async delete(id: number, userId?: number) {
    const item = await Site.findByPk(id);
    if (!item) return false;
    if (userId) await item.update({ deleted_by: userId });
    await item.destroy();
    return true;
  }
}

// ─── PAY REGISTER SERVICE ────────────────────────────────────────────────────
export class PayRegisterService {
  async create(data: any, userId?: number) {
    const name = requireName(data.name, 'Pay register');
    await assertUniqueWithin(PayRegister, name, { company_id: data.company_id }, 'Pay register');
    return await PayRegister.create({ ...data, name, created_by: userId });
  }

  async findAll(options: FindOptions = {}) {
    return await PayRegister.findAndCountAll({
      include: [{ model: State, as: 'state', attributes: ['id', 'name'] }],
      ...options,
    });
  }

  async findById(id: number) {
    return await PayRegister.findByPk(id, {
      include: [{ model: State, as: 'state' }],
    });
  }

  async update(id: number, data: any, userId?: number) {
    const item = await PayRegister.findByPk(id);
    if (!item) return null;
    if (data.name !== undefined) {
      data.name = requireName(data.name, 'Pay register');
      await assertUniqueWithin(PayRegister, data.name, { company_id: data.company_id ?? (item as any).company_id }, 'Pay register', id);
    }
    return await item.update({ ...data, updated_by: userId });
  }

  async delete(id: number, userId?: number) {
    const item = await PayRegister.findByPk(id);
    if (!item) return false;
    if (userId) await item.update({ deleted_by: userId });
    await item.destroy();
    return true;
  }
}

export const countryService = new CountryService();
export const stateService = new StateService();
export const cityService = new CityService();
export const siteService = new SiteService();
export const payRegisterService = new PayRegisterService();
