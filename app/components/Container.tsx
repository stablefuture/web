import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean;
  wide?: boolean;
};

export function Container({ narrow = false, wide = false, className = "", ...props }: Props) {
  return (
    <div
      className={[
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        narrow ? "max-w-3xl" : wide ? "max-w-[96rem]" : "max-w-6xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
