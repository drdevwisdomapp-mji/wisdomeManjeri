import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';
import type { FormField, FormFieldType } from '../types';

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onChange }) => {
  
  // Append a new field to the config
  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `q_${Math.random().toString(36).substring(2, 9)}`,
      label: `New ${type === 'text' ? 'Short Answer' : type === 'textarea' ? 'Paragraph' : type} Question`,
      type,
      required: true,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    };
    onChange([...fields, newField]);
  };

  // Modify a specific property of a field
  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(
      fields.map(f => (f.id === id ? { ...f, ...updates } as FormField : f))
    );
  };

  // Remove a field
  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  // Move field order
  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    onChange(newFields);
  };

  // Manage Multi-Choice Options
  const addOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;
    
    const newOption = `Option ${field.options.length + 1}`;
    updateField(fieldId, { options: [...field.options, newOption] });
  };

  const updateOption = (fieldId: string, optionIndex: number, newValue: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;

    const newOptions = [...field.options];
    newOptions[optionIndex] = newValue;
    updateField(fieldId, { options: newOptions });
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;

    // Keep at least one option
    if (field.options.length <= 1) return;
    const newOptions = field.options.filter((_, idx) => idx !== optionIndex);
    updateField(fieldId, { options: newOptions });
  };

  return (
    <div className="form-builder-container">
      <div className="builder-header">
        <h3 className="builder-title flex-center">
          <Settings2 size={18} className="title-icon" /> Registration Form Builder
        </h3>
        <p className="builder-description">
          Design the form fields attendees must fill out to register. You can reorder, edit, and add custom dropdowns or checkboxes.
        </p>
      </div>

      {/* Field Item Workspace */}
      <div className="builder-workspace">
        {fields.length === 0 ? (
          <div className="empty-builder-state">
            <p>No custom fields added yet. Attendees will register with no inputs unless you add fields below!</p>
            <p className="recommendation">Tip: At minimum, add "Full Name", "Phone Number", and "Gender" fields.</p>
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="builder-field-card glass-card">
              <div className="field-card-header">
                <span className="field-type-badge badge badge-primary">{field.type}</span>
                <div className="field-ordering-actions">
                  <button
                    type="button"
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="order-btn"
                    title="Move Up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="order-btn"
                    title="Move Down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="delete-field-btn"
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="field-card-body">
                {/* Field Label Input */}
                <div className="form-group">
                  <label className="form-label">Question Text / Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => updateField(field.id, { label: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Enter your full name"
                  />
                </div>

                {/* Validation and settings toggler */}
                <div className="field-settings-row">
                  <label className="checkbox-option required-toggle">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => updateField(field.id, { required: e.target.checked })}
                    />
                    <span>Required Field</span>
                  </label>
                </div>

                {/* Multi-choice options block */}
                {['select', 'radio', 'checkbox'].includes(field.type) && field.options && (
                  <div className="field-options-builder">
                    <label className="form-label">Configure Options</label>
                    <div className="options-edit-list">
                      {field.options.map((opt, optIdx) => (
                        <div key={optIdx} className="option-edit-row">
                          <input
                            type="text"
                            value={opt}
                            onChange={e => updateOption(field.id, optIdx, e.target.value)}
                            className="form-input option-input"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(field.id, optIdx)}
                            className="btn-delete-option"
                            disabled={field.options!.length <= 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addOption(field.id)}
                      className="btn btn-secondary btn-add-option"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toolbox: Adding options */}
      <div className="builder-toolbox glass-card">
        <h4 className="toolbox-title">Click to add a registration field:</h4>
        <div className="toolbox-buttons">
          <button type="button" onClick={() => addField('text')} className="btn btn-secondary toolbox-btn">
            <Plus size={14} /> + Short Answer
          </button>
          <button type="button" onClick={() => addField('textarea')} className="btn btn-secondary toolbox-btn">
            <Plus size={14} /> + Long Text
          </button>
          <button type="button" onClick={() => addField('select')} className="btn btn-secondary toolbox-btn">
            <Plus size={14} /> + Dropdown Choice
          </button>
          <button type="button" onClick={() => addField('radio')} className="btn btn-secondary toolbox-btn">
            <Plus size={14} /> + Single Choice (Radio)
          </button>
          <button type="button" onClick={() => addField('checkbox')} className="btn btn-secondary toolbox-btn">
            <Plus size={14} /> + Multi-select (Checkbox)
          </button>
        </div>
      </div>

      <style>{`
        .form-builder-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
        }
        .builder-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }
        .builder-title {
          justify-content: flex-start;
          gap: 8px;
          color: var(--primary);
          font-size: 1.15rem;
          margin-bottom: 4px;
        }
        .title-icon {
          color: var(--accent);
        }
        .builder-description {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .builder-workspace {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .empty-builder-state {
          padding: 32px 16px;
          text-align: center;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          background-color: var(--primary-light);
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .recommendation {
          font-weight: 500;
          font-size: 0.8rem;
          color: var(--primary);
        }
        .builder-field-card {
          padding: 16px;
          background-color: var(--bg-card);
        }
        .builder-field-card:hover {
          transform: none; /* Disable 3D pop up inside workspace for better control */
          border-color: var(--primary);
        }
        .field-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .field-ordering-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .order-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .order-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .order-btn:hover:not(:disabled) {
          color: var(--primary);
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .delete-field-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--error);
          border-radius: var(--radius-sm);
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .delete-field-btn:hover {
          background-color: #fee2e2;
          border-color: var(--error);
        }
        .field-settings-row {
          margin-bottom: 12px;
        }
        .required-toggle {
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-flex;
          border-color: var(--border);
        }
        .field-options-builder {
          background-color: var(--bg-main);
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .options-edit-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .option-edit-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .option-input {
          padding: 8px 12px;
          font-size: 0.9rem;
        }
        .btn-delete-option {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
        }
        .btn-delete-option:hover:not(:disabled) {
          color: var(--error);
        }
        .btn-delete-option:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .btn-add-option {
          font-size: 0.8rem;
          padding: 6px 12px;
          align-self: flex-start;
          margin-top: 4px;
        }
        .builder-toolbox {
          padding: 16px;
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%);
          border-color: var(--primary);
        }
        .toolbox-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 12px;
        }
        .toolbox-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .toolbox-btn {
          font-size: 0.85rem;
          padding: 8px 14px;
          background-color: var(--bg-card);
        }

        @media (max-width: 480px) {
          .toolbox-buttons {
            flex-direction: column;
          }
          .toolbox-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
