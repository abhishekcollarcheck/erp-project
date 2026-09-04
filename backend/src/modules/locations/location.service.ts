// import { Country, State, City, Site, PayRegister } from '../models';
import { City, Country, PayRegister, Site, State } from '../../database/models/Location';
import { FindOptions, WhereOptions } from 'sequelize';

// ─── COUNTRY SERVICE ────────────────────────────────────────────────────────
export class CountryService {
  async create(data: any, userId?: number) {
    return await Country.create({ ...data, created_by: userId });
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
    return await State.create({ ...data, created_by: userId });
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
    return await City.create({ ...data, created_by: userId });
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
    return await Site.create({ ...data, created_by: userId });
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
    return await PayRegister.create({ ...data, created_by: userId });
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