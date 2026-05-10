// 邮箱: 必须包含 @ 和域名，只允许字母、数字、._%+- 符号，顶级域名至少 2 个字母
export function validateEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// 用户名: 1~12 个字符，只允许小写字母和下划线 _
export function validateUsername(username: string): boolean {
  return /^[a-z_]{1,12}$/.test(username);
}

// 密码: 6~20 个字符，只允许大小写字母、数字和 !@#$%^&*
export function validatePassword(password: string): boolean {
  return /^[A-Za-z0-9!@#$%^&*]{6,20}$/.test(password);
}

// 校验 UTC 时间格式：ISO 8601 (YYYY-MM-DDTHH:mm:ssZ 或带毫秒)
export function isValidUTC(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}