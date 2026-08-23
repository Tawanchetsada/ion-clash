import type { ButtonHTMLAttributes } from "react";

/** ปุ่มพื้นฐานของทั้งเว็บ — เป็น <button> จริงเสมอ ห้ามใช้ div ทำปุ่ม */

export type ButtonVariant = "navy" | "gold" | "blue" | "green" | "outline";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Readonly<Record<ButtonVariant, string>> = {
  navy: "bg-navy text-white",
  gold: "bg-gold text-navy",
  blue: "bg-blue text-white",
  green: "bg-green text-white",
  outline: "border-2 border-navy bg-transparent text-navy",
};

export function Button({
  variant = "navy",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-card px-4 py-2 font-bold shadow-card transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}
