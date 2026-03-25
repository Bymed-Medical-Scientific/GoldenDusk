"use client";

import { useAuth } from "@/components/auth/auth-context";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import {
  addAddress,
  deleteAddress,
  getProfile,
  listAddresses,
  updateAddress,
  updateProfile,
} from "@/lib/api/users";
import { validatePassword } from "@/lib/auth/credentials-validation";
import type { UpsertAddressRequest, UserAddressDto } from "@/types/user";
import Link from "next/link";
import { useEffect, useState } from "react";

type AddressForm = UpsertAddressRequest;

const EMPTY_ADDRESS_FORM: AddressForm = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: "",
  isDefault: false,
};

function normalizeAddress(form: AddressForm): AddressForm {
  return {
    ...form,
    name: form.name.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2?.trim() || null,
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim(),
    country: form.country.trim(),
    phone: form.phone.trim(),
  };
}

function validateAddress(form: AddressForm): string | null {
  if (!form.name.trim()) return "Address label is required.";
  if (!form.addressLine1.trim()) return "Address line 1 is required.";
  if (!form.city.trim()) return "City is required.";
  if (!form.state.trim()) return "State/Province is required.";
  if (!form.postalCode.trim()) return "Postal code is required.";
  if (!form.country.trim()) return "Country is required.";
  if (!form.phone.trim()) return "Phone is required.";
  return null;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [profilePending, setProfilePending] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<UserAddressDto[]>([]);
  const [addressPending, setAddressPending] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<AddressForm>(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddressForm, setEditAddressForm] = useState<AddressForm>(EMPTY_ADDRESS_FORM);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setIsLoading(true);
      setPageError(null);
      try {
        const [profile, profileAddresses] = await Promise.all([
          getProfile(),
          listAddresses(),
        ]);
        if (!mounted) return;
        setName(profile.name ?? "");
        setAddresses(profileAddresses);
      } catch (e) {
        if (!mounted) return;
        if (e instanceof ApiError || e instanceof Error) {
          setPageError(e.message);
        } else {
          setPageError("Failed to load account information.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    const nextName = name.trim();
    if (!nextName) {
      setProfileError("Name is required.");
      return;
    }
    setProfilePending(true);
    try {
      const updated = await updateProfile({ name: nextName });
      setName(updated.name);
      setProfileMessage("Profile updated.");
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setProfilePending(false);
    }
  }

  async function refreshAddresses() {
    const latest = await listAddresses();
    setAddresses(latest);
  }

  async function onAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressError(null);
    setAddressMessage(null);
    const validationError = validateAddress(newAddress);
    if (validationError) {
      setAddressError(validationError);
      return;
    }
    setAddressPending(true);
    try {
      await addAddress(normalizeAddress(newAddress));
      setNewAddress(EMPTY_ADDRESS_FORM);
      await refreshAddresses();
      setAddressMessage("Address added.");
    } catch (e) {
      setAddressError(e instanceof Error ? e.message : "Failed to add address.");
    } finally {
      setAddressPending(false);
    }
  }

  function startEditAddress(address: UserAddressDto) {
    setEditingAddressId(address.id);
    setEditAddressForm({
      name: address.name,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setAddressError(null);
    setAddressMessage(null);
  }

  async function onSaveEditedAddress(id: string) {
    setAddressError(null);
    setAddressMessage(null);
    const validationError = validateAddress(editAddressForm);
    if (validationError) {
      setAddressError(validationError);
      return;
    }
    setAddressPending(true);
    try {
      await updateAddress(id, normalizeAddress(editAddressForm));
      setEditingAddressId(null);
      await refreshAddresses();
      setAddressMessage("Address updated.");
    } catch (e) {
      setAddressError(e instanceof Error ? e.message : "Failed to update address.");
    } finally {
      setAddressPending(false);
    }
  }

  async function onDeleteAddress(id: string) {
    setAddressError(null);
    setAddressMessage(null);
    setAddressPending(true);
    try {
      await deleteAddress(id);
      if (editingAddressId === id) {
        setEditingAddressId(null);
      }
      await refreshAddresses();
      setAddressMessage("Address removed.");
    } catch (e) {
      setAddressError(e instanceof Error ? e.message : "Failed to remove address.");
    } finally {
      setAddressPending(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      setPasswordError(newPasswordError);
      return;
    }
    if (confirmNewPassword !== newPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordPending(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed to change password.");
    } finally {
      setPasswordPending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Your account</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{user?.email}</span>
      </p>
      {pageError ? (
        <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {pageError}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your account information.
          </p>

          <form className="mt-4 flex flex-col gap-3" onSubmit={onSaveProfile}>
            <label className="text-sm">
              <span className="mb-1 block text-foreground">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                autoComplete="name"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-foreground">Email</span>
              <input
                type="email"
                value={user?.email ?? ""}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-muted-foreground"
                disabled
                readOnly
              />
            </label>

            {profileError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
            ) : null}
            {profileMessage ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {profileMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={profilePending}
              className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] disabled:opacity-60"
            >
              {profilePending ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Change password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a strong password with at least 8 characters.
          </p>

          <form className="mt-4 flex flex-col gap-3" onSubmit={onChangePassword}>
            <label className="text-sm">
              <span className="mb-1 block text-foreground">Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-foreground">New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-foreground">Confirm new password</span>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </label>

            {passwordError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            ) : null}
            {passwordMessage ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {passwordMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={passwordPending}
              className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] disabled:opacity-60"
            >
              {passwordPending ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Saved addresses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage shipping addresses for faster checkout.
        </p>

        {addressError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{addressError}</p>
        ) : null}
        {addressMessage ? (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
            {addressMessage}
          </p>
        ) : null}

        <ul className="mt-4 space-y-3">
          {addresses.map((address) => {
            const isEditing = editingAddressId === address.id;
            return (
              <li key={address.id} className="rounded-md border border-border p-3">
                {isEditing ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      value={editAddressForm.name}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Address label"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <input
                      value={editAddressForm.phone}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Phone"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <input
                      value={editAddressForm.addressLine1}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({
                          ...prev,
                          addressLine1: e.target.value,
                        }))
                      }
                      placeholder="Address line 1"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm md:col-span-2"
                    />
                    <input
                      value={editAddressForm.addressLine2 ?? ""}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({
                          ...prev,
                          addressLine2: e.target.value,
                        }))
                      }
                      placeholder="Address line 2 (optional)"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm md:col-span-2"
                    />
                    <input
                      value={editAddressForm.city}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="City"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <input
                      value={editAddressForm.state}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="State/Province"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <input
                      value={editAddressForm.postalCode}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({
                          ...prev,
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="Postal code"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <input
                      value={editAddressForm.country}
                      onChange={(e) =>
                        setEditAddressForm((prev) => ({ ...prev, country: e.target.value }))
                      }
                      placeholder="Country"
                      className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
                      <input
                        type="checkbox"
                        checked={editAddressForm.isDefault}
                        onChange={(e) =>
                          setEditAddressForm((prev) => ({
                            ...prev,
                            isDefault: e.target.checked,
                          }))
                        }
                      />
                      Set as default
                    </label>
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        type="button"
                        disabled={addressPending}
                        className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                        onClick={() => void onSaveEditedAddress(address.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
                        onClick={() => setEditingAddressId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-foreground">
                        <p className="font-medium">
                          {address.name}
                          {address.isDefault ? (
                            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                              Default
                            </span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground">{address.addressLine1}</p>
                        {address.addressLine2 ? (
                          <p className="text-muted-foreground">{address.addressLine2}</p>
                        ) : null}
                        <p className="text-muted-foreground">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-muted-foreground">{address.country}</p>
                        <p className="text-muted-foreground">{address.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
                          onClick={() => startEditAddress(address)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={addressPending}
                          className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                          onClick={() => void onDeleteAddress(address.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <form className="mt-6 grid gap-2 md:grid-cols-2" onSubmit={onAddAddress}>
          <input
            value={newAddress.name}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Address label"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={newAddress.phone}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Phone"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={newAddress.addressLine1}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, addressLine1: e.target.value }))
            }
            placeholder="Address line 1"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm md:col-span-2"
          />
          <input
            value={newAddress.addressLine2 ?? ""}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, addressLine2: e.target.value }))
            }
            placeholder="Address line 2 (optional)"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm md:col-span-2"
          />
          <input
            value={newAddress.city}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="City"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={newAddress.state}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="State/Province"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={newAddress.postalCode}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            placeholder="Postal code"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            value={newAddress.country}
            onChange={(e) =>
              setNewAddress((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder="Country"
            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={newAddress.isDefault}
              onChange={(e) =>
                setNewAddress((prev) => ({ ...prev, isDefault: e.target.checked }))
              }
            />
            Set as default
          </label>
          <button
            type="submit"
            disabled={addressPending}
            className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000] disabled:opacity-60 md:col-span-2"
          >
            {addressPending ? "Saving..." : "Add address"}
          </button>
        </form>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Order history
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Sign out
        </button>
        <Link
          href="/"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-[0_3px_0_0_#000000]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
