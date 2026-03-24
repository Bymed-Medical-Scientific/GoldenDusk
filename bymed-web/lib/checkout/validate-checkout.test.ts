import {
  validateContact,
  validateShipping,
  type ContactFormState,
  type ShippingFormState,
} from "@/lib/checkout/validate-checkout";

describe("checkout validation", () => {
  it("returns required field errors for empty shipping form", () => {
    const input: ShippingFormState = {
      name: " ",
      addressLine1: " ",
      addressLine2: "",
      city: " ",
      state: " ",
      postalCode: " ",
      country: " ",
      phone: " ",
    };

    const errors = validateShipping(input);
    expect(errors.name).toBe("Full name is required.");
    expect(errors.addressLine1).toBe("Address line 1 is required.");
    expect(errors.city).toBe("City is required.");
    expect(errors.state).toBe("State or region is required.");
    expect(errors.postalCode).toBe("Postal code is required.");
    expect(errors.country).toBe("Country is required.");
    expect(errors.phone).toBe("Phone number is required.");
  });

  it("returns required and format errors for contact form", () => {
    const empty: ContactFormState = { customerEmail: " ", customerName: " " };
    expect(validateContact(empty)).toEqual({
      customerEmail: "Email is required.",
      customerName: "Name is required.",
    });

    const invalidEmail: ContactFormState = {
      customerEmail: "not-an-email",
      customerName: "Jane Customer",
    };
    expect(validateContact(invalidEmail)).toEqual({
      customerEmail: "Enter a valid email address.",
    });
  });
});
