export type UserAddressDto = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export type UserProfileDto = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  canViewPrices: boolean;
  addresses: UserAddressDto[];
};

export type UpdateProfileRequest = {
  name: string;
};

export type UpsertAddressRequest = {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};
