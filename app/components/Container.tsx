import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean;
};

export function Container({ narrow = false, className = "", ...props }: Props) {
  return (
    <div
      className={[
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        narrow ? "max-w-3xl" : "max-w-[96rem]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
