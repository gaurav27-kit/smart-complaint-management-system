function Button({
  children,
  variant = "primary",
  type = "button",
}) {
  const base =
    "px-6 py-3 rounded-lg font-semibold transition duration-300";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",

    secondary:
      "border border-blue-600 text-blue-600 hover:bg-blue-50",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export default Button;