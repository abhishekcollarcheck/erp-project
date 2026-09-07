import { SaturdayRule, GraceMinute, AttendanceType } from '../../database/models/AttendanceRules';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

export const attendanceRulesService = {
  // ─── SATURDAY RULES ────────────────────────────────────────────────────────
  async getAllSaturdayRules() {
    return await SaturdayRule.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  },

  async createSaturdayRule(name: string) {
    const cleanName = requireName(name, 'Saturday rule');
    await assertUniqueMaster(SaturdayRule, { name: cleanName }, 'Saturday rule');
    return await SaturdayRule.create({ name: cleanName });
  },

  async updateSaturdayRule(id: number, name: string) {
    const cleanName = requireName(name, 'Saturday rule');
    const record = assertFound(await SaturdayRule.findByPk(id), 'Saturday rule');
    await assertUniqueMaster(SaturdayRule, { name: cleanName }, 'Saturday rule', id);
    return await record.update({ name: cleanName });
  },

  async deleteSaturdayRule(id: number) {
    const record = assertFound(await SaturdayRule.findByPk(id), 'Saturday rule');
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
    const cleanName = requireName(name, 'Grace minute');
    await assertUniqueMaster(GraceMinute, { name: cleanName }, 'Grace minute');
    return await GraceMinute.create({ name: cleanName, minutes });
  },

  async updateGraceMinute(id: number, name: string, minutes?: number) {
    const cleanName = requireName(name, 'Grace minute');
    const record = assertFound(await GraceMinute.findByPk(id), 'Grace minute');
    await assertUniqueMaster(GraceMinute, { name: cleanName }, 'Grace minute', id);
    return await record.update({ name: cleanName, minutes });
  },

  async deleteGraceMinute(id: number) {
    const record = assertFound(await GraceMinute.findByPk(id), 'Grace minute');
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
    const cleanName = requireName(name, 'Attendance type');
    await assertUniqueMaster(AttendanceType, { name: cleanName }, 'Attendance type');
    return await AttendanceType.create({ name: cleanName, code });
  },

  async updateAttendanceType(id: number, name: string, code?: string) {
    const cleanName = requireName(name, 'Attendance type');
    const record = assertFound(await AttendanceType.findByPk(id), 'Attendance type');
    await assertUniqueMaster(AttendanceType, { name: cleanName }, 'Attendance type', id);
    return await record.update({ name: cleanName, code });
  },

  async deleteAttendanceType(id: number) {
    const record = assertFound(await AttendanceType.findByPk(id), 'Attendance type');
    await record.destroy();
    return true;
  },

  async deleteAllAttendanceTypes() {
    await AttendanceType.destroy({ where: {}, truncate: false });
    return true;
  },
};
