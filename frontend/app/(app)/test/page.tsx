'use client';
import { useState } from 'react';
import { MultiStepForm } from '../../../features/form-builder/components/MultiStepForm';
import { useCompany } from '../../../features/company/hooks/useCompany';

export default function TestMultiStepFormPage() {
  const { company } = useCompany();
  const [submittedValues, setSubmittedValues] = useState<Record<string, any> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    console.log('Form submitted with values:', values);
    setSubmittedValues(values);
    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Test: MultiStepForm (Core Info, form id 3)</h2>

      <MultiStepForm
        formId={1}
        initialValues={{ name: 'John', company: `${company?.name}`, status: 'Active', }}
        onSubmit={handleSubmit}
        mode="create"
        recordId={undefined}
        autoSaveEnabled={true}
      />

      {submittedValues && (
        <div style={{ marginTop: 30, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <strong>Submitted values:</strong>
          <pre>{JSON.stringify(submittedValues, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}