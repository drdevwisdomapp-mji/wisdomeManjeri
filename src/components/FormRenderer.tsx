import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { FormField } from '../types';

interface FormRendererProps {
  fields: FormField[];
  onSubmit: (responses: Record<string, string | string[]>) => Promise<void>;
  submitButtonText?: string;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  fields,
  onSubmit,
  submitButtonText = 'Register Now',
}) => {
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Handle single-value changes (text, textarea, select, radio)
  const handleValueChange = (fieldId: string, value: string) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    // Clear errors as user edits
    if (errors[fieldId]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Handle multi-value checkbox changes
  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentAnswers = (responses[fieldId] as string[]) || [];
    let updatedAnswers: string[];

    if (checked) {
      updatedAnswers = [...currentAnswers, option];
    } else {
      updatedAnswers = currentAnswers.filter(ans => ans !== option);
    }

    setResponses(prev => ({ ...prev, [fieldId]: updatedAnswers }));

    if (errors[fieldId] && updatedAnswers.length > 0) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Validate form entries
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const val = responses[field.id];

      if (field.required) {
        if (field.type === 'checkbox') {
          if (!val || (val as string[]).length === 0) {
            newErrors[field.id] = 'Please select at least one option.';
          }
        } else {
          if (!val || (val as string).trim() === '') {
            newErrors[field.id] = 'This field is required.';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission dispatcher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error item on mobile
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        document.getElementById(`form-group-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(responses);
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-renderer-container">
      {fields.map(field => {
        const hasError = !!errors[field.id];

        return (
          <div
            key={field.id}
            id={`form-group-${field.id}`}
            className={`form-group ${hasError ? 'has-error' : ''}`}
          >
            <label className="form-label flex-center" style={{ justifyContent: 'flex-start', gap: '4px' }}>
              <span>{field.label}</span>
              {field.required && <span className="required-star">*</span>}
            </label>

            {/* 1. SHORT ANSWER */}
            {field.type === 'text' && (
              <input
                type="text"
                value={(responses[field.id] as string) || ''}
                onChange={e => handleValueChange(field.id, e.target.value)}
                className="form-input"
                placeholder="Enter your response"
                disabled={submitting}
              />
            )}

            {/* 2. PARAGRAPH TEXT */}
            {field.type === 'textarea' && (
              <textarea
                value={(responses[field.id] as string) || ''}
                onChange={e => handleValueChange(field.id, e.target.value)}
                className="form-textarea"
                placeholder="Write your response"
                disabled={submitting}
              />
            )}

            {/* 3. DROPDOWN SELECT */}
            {field.type === 'select' && (
              <select
                value={(responses[field.id] as string) || ''}
                onChange={e => handleValueChange(field.id, e.target.value)}
                className="form-select"
                disabled={submitting}
              >
                <option value="">-- Select an option --</option>
                {field.options?.map((opt, oIdx) => (
                  <option key={oIdx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* 4. RADIO SELECTIONS */}
            {field.type === 'radio' && (
              <div className="options-list">
                {field.options?.map((opt, oIdx) => {
                  const isChecked = responses[field.id] === opt;
                  return (
                    <label key={oIdx} className={`radio-option ${isChecked ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={`radio-${field.id}`}
                        value={opt}
                        checked={isChecked}
                        onChange={() => handleValueChange(field.id, opt)}
                        disabled={submitting}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 5. CHECKBOX MULTI-SELECT */}
            {field.type === 'checkbox' && (
              <div className="options-list">
                {field.options?.map((opt, oIdx) => {
                  const isChecked = ((responses[field.id] as string[]) || []).includes(opt);
                  return (
                    <label key={oIdx} className={`checkbox-option ${isChecked ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => handleCheckboxChange(field.id, opt, e.target.checked)}
                        disabled={submitting}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Error messaging */}
            {hasError && (
              <div className="error-message flex-center">
                <AlertCircle size={14} />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Submission Button Container */}
      <div className="form-submit-container">
        <button type="submit" disabled={submitting} className="btn btn-primary btn-mobile-full">
          {submitting ? (
            <>
              <Loader2 size={18} className="spinner-icon animate-spin" /> Processing...
            </>
          ) : (
            submitButtonText
          )}
        </button>
      </div>

      <style>{`
        .form-renderer-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .required-star {
          color: var(--error);
          font-weight: 700;
        }
        .has-error .form-input,
        .has-error .form-select,
        .has-error .form-textarea {
          border-color: var(--error);
          background-color: #fffafb;
        }
        [data-theme="dark"] .has-error .form-input,
        [data-theme="dark"] .has-error .form-select,
        [data-theme="dark"] .has-error .form-textarea {
          background-color: rgba(239, 68, 68, 0.05);
        }
        .error-message {
          color: var(--error);
          font-size: 0.8rem;
          font-weight: 500;
          justify-content: flex-start;
          gap: 6px;
          margin-top: 4px;
        }
        .radio-option.selected,
        .checkbox-option.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .form-submit-container {
          margin-top: 10px;
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};
