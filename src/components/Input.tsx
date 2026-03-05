import React, { useEffect, useState } from "react";
import Details from "./Details";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  addon?: string | React.ReactNode;
  showLabel?: boolean;
  helpText?: string | React.ReactNode;
  description?: string;
  ref?: React.Ref<HTMLInputElement>;
  validationText?: string;
}

export default function Input({ label, id, addon, helpText, ref, showLabel = true, description, validationText, ...rest }: InputProps) {
  const [isInvalid, setIsInvalid] = useState(false);
  
  useEffect(() => {
  }, [addon, rest.disabled]);

  // validate field on change and show validation text if invalid
  function validateField() {
    const inputElement = document.getElementById(id) as HTMLInputElement;
    if (inputElement) {
      const isValid = inputElement.checkValidity();
      setIsInvalid(!isValid);
    }
  }

  // On form reset, clear validation state
  useEffect(() => {
    const inputElement = document.getElementById(id) as HTMLInputElement;
    if (!inputElement) return;

    function handleFormReset() {
      setIsInvalid(false);
    }

    const form = inputElement.closest('form');
    form?.addEventListener('reset', handleFormReset);

    return () => {
      form?.removeEventListener('reset', handleFormReset);
    };
  }, [id]);

  return (
    <div className="input">
      {showLabel && <label htmlFor={id || label.toLowerCase().replace(' ', '-')}>{label}</label>}
      {description && <p className="input-description">{description}</p>}
      <div className="input-group">
        <div className="input-field">
          <input 
            id={id}
            {...(showLabel ? {} : { 'aria-label': label })}
            {...rest} 
            ref={ref}
            onBlur={event => {
              if (rest.onBlur) {
                rest.onBlur(event);
              }
              validateField();
            }}
            onChange={event => {
              if (rest.onChange) {
                rest.onChange(event);
              }
              validateField();
            }}
            />
        </div>
        {addon && (
        <div className="input-addon">
          {addon}
        </div>
        )}
      </div>
      {isInvalid && validationText && <p className="input-validation">{validationText}</p>}
      {helpText && (
      <Details summary={`${label} help`}>
        <div className="help-text">{helpText}</div>
      </Details>
      )}
    </div>
  );
}