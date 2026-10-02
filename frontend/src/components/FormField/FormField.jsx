import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * FormField - one labelled input with floating label, error slot and an
 * optional Show/Hide toggle for password fields.
 *
 * Used by pages/Login and pages/SignUp so the markup (and the a11y wiring)
 * can never drift between the two forms:
 *   - error is rendered outside `.input-wrapper`, otherwise the absolutely
 *     positioned floating label would centre itself on wrapper+error;
 *   - `aria-invalid` + `aria-describedby` point screen readers at the message;
 *   - the reveal button lives after the label so `.floating-input + label`
 *     (the float trigger) still matches.
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
    <>
      <div className="input-wrapper">
        <input
          id={id}
          name={id}
          type={inputType}
          className={`floating-input${isPassword ? ' floating-input--reveal' : ''}`}
          placeholder=" "
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        <label htmlFor={id}>{label}</label>

        {isPassword && (
          <button
            type="button"
            className="password-reveal"
            onClick={() => setRevealed(prev => !prev)}
            aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={revealed}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </>
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
