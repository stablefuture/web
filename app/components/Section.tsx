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
        tight ? "py-12 lg:py-16" : "py-20 lg:py-28",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
