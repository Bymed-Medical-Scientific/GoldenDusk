export type ShippingFormState = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type ContactFormState = {
  customerEmail: string;
  customerName: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateShipping(s: ShippingFormState): Record<string, string> {
  const e: Record<string, string> = {};
  const name = s.name.trim();
  const addressLine1 = s.addressLine1.trim();
  const city = s.city.trim();
  const state = s.state.trim();
  const postalCode = s.postalCode.trim();
  const country = s.country.trim();
  const phone = s.phone.trim();

  if (!name) e.name = "Full name is required.";
  else if (name.length > 200) e.name = "Name must not exceed 200 characters.";

  if (!addressLine1) e.addressLine1 = "Address line 1 is required.";
  else if (addressLine1.length > 300) e.addressLine1 = "Address line 1 must not exceed 300 characters.";

  const line2 = s.addressLine2.trim();
  if (line2.length > 300) e.addressLine2 = "Address line 2 must not exceed 300 characters.";

  if (!city) e.city = "City is required.";
  else if (city.length > 100) e.city = "City must not exceed 100 characters.";

  if (!state) e.state = "State or region is required.";
  else if (state.length > 100) e.state = "State must not exceed 100 characters.";

  if (!postalCode) e.postalCode = "Postal code is required.";
  else if (postalCode.length > 20) e.postalCode = "Postal code must not exceed 20 characters.";

  if (!country) e.country = "Country is required.";
  else if (country.length > 100) e.country = "Country must not exceed 100 characters.";

  if (!phone) e.phone = "Phone number is required.";
  else if (phone.length > 30) e.phone = "Phone must not exceed 30 characters.";

  return e;
}

export function validateContact(c: ContactFormState): Record<string, string> {
  const e: Record<string, string> = {};
  const email = c.customerEmail.trim();
  const customerName = c.customerName.trim();

  if (!email) e.customerEmail = "Email is required.";
  else if (!EMAIL_RE.test(email)) e.customerEmail = "Enter a valid email address.";
  else if (email.length > 256) e.customerEmail = "Email must not exceed 256 characters.";

  if (!customerName) e.customerName = "Name is required.";
  else if (customerName.length > 200) e.customerName = "Name must not exceed 200 characters.";

  return e;
}
