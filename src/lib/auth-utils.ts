"use client";

const APP_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_APP_EMAIL_DOMAIN ?? "temp-mail.org";

export const usernameToEmail = (username: string) => {
  const sanitized = username.trim().toLowerCase();
  if (!sanitized) {
    throw new Error("Username cannot be empty");
  }
  return `${sanitized}@${APP_EMAIL_DOMAIN}`;
};

