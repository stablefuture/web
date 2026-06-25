import { type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article" | "main";
  tight?: boolean;
};

export function Section({
  as: Tag = "section",
  tight = false,
  className = "",
  ...props
}: Props) {
  return (
    <Tag
      className={[
        tight ? "py-8 lg:py-10" : "py-14 lg:py-20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
