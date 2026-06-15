'use client';
import { useRef, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  name:         string;
  label:        string;
  accept?:      string;          // e.g. '.pdf,.jpg,.png'
  maxSizeMB?:   number;          // default 10
  required?:    boolean;
  hint?:        string;
  // Called with the selected File; should upload and return the URL
  onUpload?:    (file: File) => Promise<string>;
  // If no onUpload, stores File object directly in RHF (for local preview)
  fieldPerm?:   { can_view?: boolean; can_edit?: boolean };
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export function FormFileUpload({
  name, label, accept, maxSizeMB = 10, required, hint, onUpload, fieldPerm,
}: Props) {
  const { control, formState: { errors }, setValue } = useFormContext();
  const error     = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = fieldPerm?.can_edit === false;

  const inputRef              = useRef<HTMLInputElement>(null);
  const [status, setStatus]   = useState<UploadStatus>('idle');
  const [errMsg, setErrMsg]   = useState('');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrMsg(`File must be under ${maxSizeMB}MB`);
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setErrMsg('');

    if (onUpload) {
      setStatus('uploading');
      setProgress(0);
      // Fake progress animation
      const timer = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 200);
      try {
        const url = await onUpload(file);
        clearInterval(timer);
        setProgress(100);
        setValue(name, url, { shouldValidate: true, shouldDirty: true });
        setStatus('done');
      } catch (e: any) {
        clearInterval(timer);
        setErrMsg(e?.message || 'Upload failed. Try again.');
        setStatus('error');
      }
    } else {
      // Store file object directly
      setValue(name, file, { shouldValidate: true, shouldDirty: true });
      setStatus('done');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus('idle');
    setFileName('');
    setErrMsg('');
    setProgress(0);
    setValue(name, null, { shouldDirty: true });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Controller name={name} control={control} render={() => (
      <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`}>
        <label className="field-label">
          {label}
          {required && <span className="req-mark">*</span>}
        </label>

        <div
          className={`file-upload-zone${status === 'done' ? ' done' : ''}${status === 'error' ? ' error' : ''}`}
          onClick={() => !isDisabled && status !== 'uploading' && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={handleDrop}
          style={{
            border:       `2px dashed ${status === 'error' ? 'var(--red-bd)' : status === 'done' ? 'var(--green-bd)' : 'var(--border2)'}`,
            borderRadius: 'var(--r2)',
            padding:      '20px 16px',
            textAlign:    'center',
            cursor:       isDisabled || status === 'uploading' ? 'not-allowed' : 'pointer',
            background:   status === 'done' ? 'var(--green-lt)' : status === 'error' ? 'var(--red-lt)' : 'var(--surface2)',
            transition:   'all .2s',
            opacity:      isDisabled ? 0.6 : 1,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={handleChange}
          />

          {status === 'idle' && (
            <>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink3)' }}>
                Drop file here or <span style={{ color: 'var(--blue)', textDecoration: 'underline' }}>browse</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 4 }}>
                {accept ? `Allowed: ${accept.replace(/\./g, '').toUpperCase()}` : 'Any file'} · Max {maxSizeMB}MB
              </div>
            </>
          )}

          {status === 'uploading' && (
            <>
              <div style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 10, fontWeight: 500 }}>
                Uploading {fileName}…
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', borderRadius: 2, transition: 'width .2s' }} />
              </div>
            </>
          )}

          {status === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>{fileName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Uploaded successfully</div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); reset(); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink4)', cursor: 'pointer', fontSize: 16 }}
              >×</button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div style={{ fontSize: 18, marginBottom: 4 }}>❌</div>
              <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>{errMsg}</div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); reset(); }}
                style={{ marginTop: 6, fontSize: 11, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {hint && !error && <p className="field-hint">{hint}</p>}
        {(error || errMsg) && <p className="field-error" role="alert">{error || errMsg}</p>}
      </div>
    )} />
  );
}
