import React from "react";

const variants = {
  primary: "text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 shadow-lg shadow-pink-500/20",
  secondary: "text-white  border border-white/10 ",
  outline: "text-white bg-transparent border  ",
  ghost: "text-white bg-transparent ",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = ({ children, className = "", variant = "primary", size = "md", ...props }) => {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:ring-2 focus-visible:ring-pink-500 active:scale-[0.98]";
  const cls = [base, variants[variant] || variants.primary, sizes[size] || sizes.md, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
};
