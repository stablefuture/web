import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean;
};

export function Container({ narrow = false, className = "", ...props }: Props) {
  return (
    <div
      className={[
        "mx-auto w-full px-6 lg:px-8",
        narrow ? "max-w-3xl" : "max-w-6xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
