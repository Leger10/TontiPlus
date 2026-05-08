
import { useState, useCallback } from 'react';

export const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    if (rules.required && !value && value !== 0) {
      return rules.messages?.required || 'Ce champ est requis.';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return rules.messages?.minLength || `Minimum ${rules.minLength} caractères.`;
    }

    if (rules.min && Number(value) < rules.min) {
      return rules.messages?.min || `La valeur minimale est ${rules.min}.`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.messages?.pattern || 'Format invalide.';
    }

    return '';
  }, [validationRules]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(key => {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  return { values, setValues, errors, handleChange, validateAll, setErrors };
};
