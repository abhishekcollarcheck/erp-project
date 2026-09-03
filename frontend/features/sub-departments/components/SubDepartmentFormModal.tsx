// 'use client';
// import { useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { Modal } from '../../../components/ui/Modal';
// import {
//   useCreateSubDepartment,
//   useUpdateSubDepartment,
// } from '../hooks/useSubDepartments';
// import {
//   createSubDepartmentSchema,
//   type CreateSubDepartmentFormData,
// } from '../validations/subdepartment.schema';
// import type { SubDepartment } from '../../../services/api/subDepartment.service';

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   subDepartment?: SubDepartment | null;
//   departments: { value: number; label: string }[];
//   managers: { value: number; label: string }[];
// }

// export function SubDepartmentFormModal({
//   open,
//   onClose,
//   subDepartment,
//   departments,
//   managers,
// }: Props) {
//   const isEdit = !!subDepartment;
//   const createMutation = useCreateSubDepartment();
//   const updateMutation = useUpdateSubDepartment(subDepartment?.id ?? 0);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     formState: { errors },
//   } = useForm<CreateSubDepartmentFormData>({
//     resolver: zodResolver(createSubDepartmentSchema),
//   });

//   useEffect(() => {
//     if (open && subDepartment) {
//       reset({
//         name: subDepartment.name,
//         // description: subDepartment.description ?? '',
//       });
//     } else if (open) {
//       reset({
//         name: '',
//         description: '',
//       });
//     }
//   }, [open, subDepartment, reset]);

//   const onSubmit = async (data: CreateSubDepartmentFormData) => {
//     const payload = {
//       name: data.name,
//       description: data.description || null,
//     };

//     if (isEdit) {
//       await updateMutation.mutateAsync(payload);
//     } else {
//       await createMutation.mutateAsync(payload as any);
//     }
//     onClose();
//   };

//   const isSaving = createMutation.isPending || updateMutation.isPending;

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={
//         isEdit
//           ? `Edit — ${subDepartment?.name}`
//           : 'Add Sub-Department'
//       }
//       subtitle={
//         isEdit
//           ? 'Update sub-department details'
//           : 'Create a new sub-department under a department'
//       }
//       width={460}
//       footer={
//         <>
//           <button
//             className="btn btn-sec"
//             onClick={onClose}
//             disabled={isSaving}
//           >
//             Cancel
//           </button>
//           <button
//             className="btn btn-pri"
//             onClick={handleSubmit(onSubmit)}
//             disabled={isSaving}
//             style={{ display: 'flex', alignItems: 'center', gap: 6 }}
//           >
//             {isSaving && (
//               <span
//                 style={{
//                   width: 12,
//                   height: 12,
//                   border: '2px solid rgba(255,255,255,.4)',
//                   borderTopColor: '#fff',
//                   borderRadius: '50%',
//                   display: 'inline-block',
//                   animation: 'spin .7s linear infinite',
//                 }}
//               />
//             )}
//             {isSaving
//               ? 'Saving…'
//               : isEdit
//                 ? '✓ Save Changes'
//                 : '✓ Create Sub-Department'}
//           </button>
//         </>
//       }
//     >
//       <div className="fg">
//         <label>Sub-Department Name *</label>
//         <input
//           placeholder="e.g. Backend, Frontend, QA"
//           {...register('name')}
//           autoFocus
//         />
//         {errors.name && (
//           <span className="err">{errors.name.message}</span>
//         )}
//       </div>

//       <div className="fg">
//         <label>Description</label>
//         <textarea
//           placeholder="What does this sub-department do?"
//           {...register('description')}
//           style={{ minHeight: 60, resize: 'vertical' }}
//         />
//         {errors.description && (
//           <span className="err">{errors.description.message}</span>
//         )}
//       </div>

//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </Modal>
//   );
// }




'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import {
  useCreateSubDepartment,
  useUpdateSubDepartment,
} from '../hooks/useSubDepartments';
import {
  createSubDepartmentSchema,
  type CreateSubDepartmentFormData,
} from '../validations/subdepartment.schema';
import type {
  SubDepartment,
  CreateSubDepartmentDto,
  UpdateSubDepartmentDto,
} from '../../../services/api/subDepartment.service';

interface Props {
  open: boolean;
  onClose: () => void;
  subDepartment?: SubDepartment | null;
  departments: { value: number; label: string }[];
  managers: { value: number; label: string }[];
}

export function SubDepartmentFormModal({
  open,
  onClose,
  subDepartment,
  departments,
  managers,
}: Props) {
  const isEdit = !!subDepartment;
  const createMutation = useCreateSubDepartment();
  const updateMutation = useUpdateSubDepartment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSubDepartmentFormData>({
    resolver: zodResolver(createSubDepartmentSchema),
  });

  useEffect(() => {
    if (open && subDepartment) {
      reset({
        name: subDepartment.name,
        description: subDepartment.description ?? '',
      });
    } else if (open) {
      reset({
        name: '',
        description: '',
      });
    }
  }, [open, subDepartment, reset]);

  const onSubmit = async (data: CreateSubDepartmentFormData) => {
    if (isEdit && subDepartment) {
      const updatePayload: UpdateSubDepartmentDto = {
        name: data.name,
        description: data.description || null,
      };
      await updateMutation.mutateAsync({
        id: subDepartment.id,
        data: updatePayload,
      });
    } else {
      const createPayload: CreateSubDepartmentDto = {
        name: data.name,
        description: data.description || null,
      };
      await createMutation.mutateAsync(createPayload);
    }
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? `Edit — ${subDepartment?.name}`
          : 'Add Sub-Department'
      }
      subtitle={
        isEdit
          ? 'Update sub-department details'
          : 'Create a new sub-department under a department'
      }
      width={460}
      footer={
        <>
          <button
            className="btn btn-sec"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-pri"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isSaving && (
              <span
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid rgba(255,255,255,.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin .7s linear infinite',
                }}
              />
            )}
            {isSaving
              ? 'Saving…'
              : isEdit
                ? '✓ Save Changes'
                : '✓ Create Sub-Department'}
          </button>
        </>
      }
    >
      <div className="fg">
        <label>Sub-Department Name *</label>
        <input
          placeholder="e.g. Backend, Frontend, QA"
          {...register('name')}
          autoFocus
        />
        {errors.name && (
          <span className="err">{errors.name.message}</span>
        )}
      </div>

      <div className="fg">
        <label>Description</label>
        <textarea
          placeholder="What does this sub-department do?"
          {...register('description')}
          style={{ minHeight: 60, resize: 'vertical' }}
        />
        {errors.description && (
          <span className="err">{errors.description.message}</span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}