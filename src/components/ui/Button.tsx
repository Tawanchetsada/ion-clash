import { useAudioOptional } from "../../audio/AudioProvider";
import type { ButtonHTMLAttributes, PointerEvent } from "react";

/** ปุ่มพื้นฐานของทั้งเว็บ — เป็น <button> จริงเสมอ ห้ามใช้ div ทำปุ่ม */

export type ButtonVariant = "navy" | "gold" | "blue" | "green" | "outline";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Readonly<Record<ButtonVariant, string>> = {
  navy: "bg-navy text-white hover:brightness-110 active:brightness-95",
  gold: "bg-gold text-navy hover:brightness-105 hover:shadow-lg active:brightness-95",
  blue: "bg-blue text-white hover:brightness-110 active:brightness-95",
  green: "bg-green-ink text-white hover:brightness-110 active:brightness-95",
  outline: "border-2 border-navy bg-transparent text-navy hover:bg-navy/10 active:bg-navy/20",
};

export function Button({
  variant = "navy",
  className = "",
  type = "button",
  onPointerDown,
  ...props
}: ButtonProps) {
  const audio = useAudioOptional();

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      audio?.playUiTap();
    }
    onPointerDown?.(e);
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-card px-4 py-2 font-bold shadow-card transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
      onPointerDown={handlePointerDown}
      {...props}
    />
  );
}
