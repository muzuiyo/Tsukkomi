const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-z_]{1,12}$/;
const PASSWORD_REGEX = /^[A-Za-z0-9!@#$%^&*]{6,20}$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validateUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function validatePassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}