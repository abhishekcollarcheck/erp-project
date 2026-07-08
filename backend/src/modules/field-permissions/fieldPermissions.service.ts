import { HrModule, FormDefinition, DynamicField, FieldOption } from "../../database/models/FormBuilder";
import { PermissionGroup } from "../../database/models/PermissionGroups";
import { GroupFieldPermission } from "../../database/models/GroupFieldPermission";
import { AppError } from "../../middleware/errorHandler.middleware";

export class GroupFieldPermissionServices {
    async getFormWithFields(formId: number, companyId: number) {
        const form = await FormDefinition.findOne({
            where: { id: formId, company_id: companyId },
            include: [{
                model: DynamicField, as: 'fields',
                where: { is_active: true }, required: false,
                order: [['sort_order', 'ASC']]
            }]
        })
        if (!form) throw new AppError('Form not found', 404)
        return form;
    }

    async getGroupPermissionMatrix(companyId: number, formId: number) {
        const [form, groups] = await Promise.all([
            this.getFormWithFields(formId, companyId),
            PermissionGroup.findAll({ where: { company_id: companyId }, order: [['is_system', 'DESC'], ['name', 'ASC']] })
        ])

        const fields = (form as any).fields || []
        if (!fields.length) return { groups, fields, matrix: {} };

        const fieldIds = fields.map((f: any) => f.id);
        const perms = await GroupFieldPermission.findAll({
            where: { company_id: companyId, field_id: fieldIds },
        })

        const matrix: Record<number, Record<number, any>> = {};
        for (const group of groups) {
            matrix[group.id] = {};
            for (const field of fields) {
                const existing = perms.find((p) => p.group_id === group.id && p.field_id === field.id);
                matrix[group.id][field.id] = existing
                    ? { can_view: existing.can_view, can_edit: existing.can_edit, can_copy: existing.can_copy, can_download: existing.can_download, is_masked: existing.is_masked }
                    : { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
            }
        }
        return { groups, fields, matrix };
    }

    async setGroupFieldPermission(companyId: number, groupId: number, fieldId: number, dto: {
        can_view?: boolean; can_edit?: boolean; can_copy?: boolean; can_download?: boolean; is_masked?: boolean;
    }, updatedBy?: number) {
        const [perm, created] = await GroupFieldPermission.findOrCreate({
            where: { group_id: groupId, field_id: fieldId },
            defaults: { group_id: groupId, field_id: fieldId, company_id: companyId, ...dto },
        });
        if (!created) await perm.update(dto as any);
        return perm;
    }
}