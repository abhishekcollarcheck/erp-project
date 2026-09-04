import { SaturdayRule, GraceMinute, AttendanceType } from '../../database/models/AttendanceRules';

// import { SaturdayRule } from "@/database/models/AttendanceRules";

export const attendanceRulesService = {
  // ─── SATURDAY RULES ────────────────────────────────────────────────────────
  async getAllSaturdayRules() {
    return await SaturdayRule.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  },

  async createSaturdayRule(name: string) {
    return await SaturdayRule.create({ name });
  },

  async updateSaturdayRule(id: number, name: string) {
    const record = await SaturdayRule.findByPk(id);
    if (!record) throw new Error('Saturday rule not found');
    return await record.update({ name });
  },

  async deleteSaturdayRule(id: number) {
    const record = await SaturdayRule.findByPk(id);
    if (!record) throw new Error('Saturday rule not found');
    await record.destroy();
    return true;
  },

  async deleteAllSaturdayRules() {
    await SaturdayRule.destroy({ where: {}, truncate: false });
    return true;
  },

  // ─── GRACE MINUTES ─────────────────────────────────────────────────────────
  async getAllGraceMinutes() {
    return await GraceMinute.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  },

  async createGraceMinute(name: string, minutes?: number) {
    return await GraceMinute.create({ name, minutes });
  },

  async updateGraceMinute(id: number, name: string, minutes?: number) {
    const record = await GraceMinute.findByPk(id);
    if (!record) throw new Error('Grace minute not found');
    return await record.update({ name, minutes });
  },

  async deleteGraceMinute(id: number) {
    const record = await GraceMinute.findByPk(id);
    if (!record) throw new Error('Grace minute not found');
    await record.destroy();
    return true;
  },

  async deleteAllGraceMinutes() {
    await GraceMinute.destroy({ where: {}, truncate: false });
    return true;
  },

  // ─── ATTENDANCE TYPES ──────────────────────────────────────────────────────
  async getAllAttendanceTypes() {
    return await AttendanceType.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  },

  async createAttendanceType(name: string, code?: string) {
    return await AttendanceType.create({ name, code });
  },

  async updateAttendanceType(id: number, name: string, code?: string) {
    const record = await AttendanceType.findByPk(id);
    if (!record) throw new Error('Attendance type not found');
    return await record.update({ name, code });
  },

  async deleteAttendanceType(id: number) {
    const record = await AttendanceType.findByPk(id);
    if (!record) throw new Error('Attendance type not found');
    await record.destroy();
    return true;
  },

  async deleteAllAttendanceTypes() {
    await AttendanceType.destroy({ where: {}, truncate: false });
    return true;
  },
};