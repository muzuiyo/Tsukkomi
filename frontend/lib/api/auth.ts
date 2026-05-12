import { User } from "@/interfaces/user";
import { apiFetch } from "./fetch";

export function authRegister(data: {
  email: string,
  username: string,
  password: string
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function authLogin(data: { email: string; password: string }) {
    return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function authMe(): Promise<User | null> {
    return apiFetch("/auth/me", {
        method: "GET",
    });
}

export function authLogout() {
    return apiFetch("/auth/logout", {
        method: "POST"
    });
}

export function authDelete() {
    return apiFetch("/auth/delete", {
        method: "DELETE"
    });
}

export function getUserByUsername(username: string): Promise<User | null> {
    return apiFetch(`/auth/username/${username}`, {
        method: "GET"
    });
}

export function authForgotPassword(data: { email: string }) {
    return apiFetch(`/auth/password/forget`, {
        method: "POST",
        body: JSON.stringify(data),
    })
}

// TODO
export function authResetPassword(data: {
    token: string,
    newPassword: string
}) {
    return apiFetch(`/auth/password/reset`, {
        method: "POST",
        body: JSON.stringify(data)
    })
}