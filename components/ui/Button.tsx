import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-white text-ink hover:bg-lilac",
  secondary: "bg-ultraviolet text-white hover:bg-ultraviolet/85",
  ghost: "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20",
};

type BaseProps = {
  variant?: keyof typeof variants;
  size?: "md" | "lg";
  className?: string;
  children?: React.ReactNode;
};

type LinkButtonProps = BaseProps &
  ComponentProps<typeof Link> & {
    href: string;
  };

type NormalButtonProps = BaseProps &
  ComponentProps<"button"> & {
    href?: undefined;
  };

type Props = LinkButtonProps | NormalButtonProps;

export function Button({ variant = "primary", size = "md", className, ...props }: Props) {
  const commonClasses = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer",
    size === "lg" ? "px-8 py-4 text-lg" : "px-5 py-2.5 text-sm",
    variants[variant],
    className,
  );

  if ("href" in props && props.href !== undefined) {
    return <Link className={commonClasses} {...(props as ComponentProps<typeof Link>)} />;
  }

  return <button type="button" className={commonClasses} {...(props as ComponentProps<"button">)} />;
}

