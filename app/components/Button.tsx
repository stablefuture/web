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
  // Hover-enlarge (~1.04, 200ms ease) + slight shadow lift. Disabled under
  // prefers-reduced-motion via the transform-only-on-hover pattern.
  base: "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none motion-reduce:transform-none motion-reduce:transition-none",
  size: {
    md: "h-11 px-6 text-base rounded-md",
    lg: "h-14 px-10 text-lg rounded-md",
  },
  variant: {
    primary:
      "bg-accent-strong text-on-accent shadow-sm shadow-accent/20 hover:shadow-accent/40 active:scale-100 active:translate-y-0",
    secondary:
      "border-2 border-accent-strong text-accent-strong bg-transparent hover:bg-accent-strong/10 active:bg-accent-strong/20",
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
