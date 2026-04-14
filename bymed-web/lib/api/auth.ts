import type {
  AuthResponse,
  ChangePasswordRequest,
  ConfirmResetPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/types/auth";
import { apiFetch, readJson } from "./http";
import { apiPath } from "./routes";

export async function register(
  body: RegisterRequest,
): Promise<AuthResponse> {
  const res = await apiFetch(
    apiPath("/Auth/register"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  return readJson<AuthResponse>(res, [200, 201, 202]);
}

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const res = await apiFetch(
    apiPath("/Auth/login"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  return readJson<AuthResponse>(res);
}

export async function refresh(
  body: RefreshTokenRequest,
): Promise<RefreshTokenResponse> {
  const res = await apiFetch(
    apiPath("/Auth/refresh"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  return readJson<RefreshTokenResponse>(res);
}

export async function logout(body: RefreshTokenRequest): Promise<void> {
  const res = await apiFetch(
    apiPath("/Auth/logout"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  await readJson<void>(res, [204]);
}

export async function resetPassword(
  body: ResetPasswordRequest,
): Promise<void> {
  const res = await apiFetch(
    apiPath("/Auth/reset-password"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  await readJson<void>(res, [204]);
}

export async function confirmResetPassword(
  body: ConfirmResetPasswordRequest,
): Promise<void> {
  const res = await apiFetch(
    apiPath("/Auth/reset-password/confirm"),
    { method: "POST", body: JSON.stringify(body) },
    { skipAuth: true, retry: false },
  );
  await readJson<void>(res, [204]);
}

export async function changePassword(
  body: ChangePasswordRequest,
): Promise<void> {
  const res = await apiFetch(
    apiPath("/Auth/change-password"),
    { method: "POST", body: JSON.stringify(body) },
    { retry: false },
  );
  await readJson<void>(res, [204]);
}
