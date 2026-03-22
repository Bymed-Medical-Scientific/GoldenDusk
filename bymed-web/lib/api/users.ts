import type {
  UpdateProfileRequest,
  UpsertAddressRequest,
  UserAddressDto,
  UserProfileDto,
} from "@/types/user";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function getProfile(): Promise<UserProfileDto> {
  const res = await apiFetch(apiPath("/Users/profile"), { method: "GET" });
  return readJson<UserProfileDto>(res);
}

export async function updateProfile(
  body: UpdateProfileRequest,
): Promise<UserProfileDto> {
  const res = await apiFetch(
    apiPath("/Users/profile"),
    { method: "PUT", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<UserProfileDto>(res);
}

export async function listAddresses(): Promise<UserAddressDto[]> {
  const res = await apiFetch(apiPath("/Users/addresses"), { method: "GET" });
  return readJson<UserAddressDto[]>(res);
}

export async function addAddress(
  body: UpsertAddressRequest,
): Promise<UserAddressDto> {
  const res = await apiFetch(
    apiPath("/Users/addresses"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<UserAddressDto>(res, [200, 201]);
}

export async function updateAddress(
  id: string,
  body: UpsertAddressRequest,
): Promise<UserAddressDto> {
  const res = await apiFetch(
    apiPath(`/Users/addresses/${id}`),
    { method: "PUT", body: JSON.stringify(body) },
    { retry: false },
  );
  return readJson<UserAddressDto>(res);
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await apiFetch(apiPath(`/Users/addresses/${id}`), {
    method: "DELETE",
  });
  await readJson<void>(res, [204]);
}
