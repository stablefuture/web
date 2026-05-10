import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type BaseProps = {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type AnchorProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type Props = ButtonProps | AnchorProps;

const classes = {
  base: "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-950 disabled:opacity-50 disabled:pointer-events-none",
  size: {
    md: "h-11 px-6 text-base rounded-md",
    lg: "h-14 px-10 text-lg rounded-md",
  },
  variant: {
    primary:
      "bg-brand-950 text-white hover:bg-brand-900 active:bg-brand-800 shadow-sm",
    secondary:
      "border-2 border-brand-950 text-brand-950 hover:bg-brand-50 active:bg-brand-100",
  },
};

export function Button({ variant = "primary", size = "md", ...props }: Props) {
  const className = [
    classes.base,
    classes.size[size],
    classes.variant[variant],
    (props as { className?: string }).className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as AnchorProps;
    return <a href={href} {...rest} className={className} />;
  }

  const { ...rest } = props as ButtonProps;
  return <button {...rest} className={className} />;
}
