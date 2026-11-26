import { useState } from 'react';
import PropTypes from 'prop-types';
import './FormField.css';

/**
 * FormField - one labelled input with an error slot and an
 * optional Show/Hide toggle for password fields.
 *
 * Used by pages/Login and pages/SignUp so the markup (and the a11y wiring)
 * can never drift between the two forms:
 *   - `aria-invalid` + `aria-describedby` point screen readers at the message;
 *   - the field and its error occupy one cell in multi-column forms.
 *
 *   <FormField id="username" label="Username" value={v}
 *              onChange={e => ...} error={errors.username} autoFocus />
 */
function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  reveal = false,
  ...inputProps
}) {
  const [revealed, setRevealed] = useState(false);
  const errorId = `${id}-error`;
  const isPassword = type === 'password' && reveal;
  const inputType = isPassword && revealed ? 'text' : type;

  return (
    <div className="bz-field form-field">
      <label htmlFor={id}>{label}</label>
      <div className="form-field__control">
        <input
          id={id}
          name={id}
          type={inputType}
          className={`bz-input${isPassword ? ' form-field__password' : ''}`}
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />

        {isPassword && (
          <button
            type="button"
            className="form-field__reveal"
            onClick={() => setRevealed(prev => !prev)}
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={revealed}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error && (
        <p className="form-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  reveal: PropTypes.bool,
};

export default FormField;
