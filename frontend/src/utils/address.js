export const ADDRESS_FIELDS = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' };

export function validateAddress(values) {
  const errors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters';
  if (!/^\+?\d{7,15}$/.test(values.phone.trim())) errors.phone = 'Enter 7–15 digits, optionally starting with +';
  if (!values.line1.trim()) errors.line1 = 'Address line 1 is required';
  if (!values.city.trim()) errors.city = 'City is required';
  if (!values.state.trim()) errors.state = 'State is required';
  if (!/^\d{4,10}$/.test(values.pincode.trim())) errors.pincode = 'Pincode must be 4–10 digits';
  return errors;
}
