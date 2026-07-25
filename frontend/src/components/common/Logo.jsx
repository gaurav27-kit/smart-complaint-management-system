import React from "react";
import { scmsLogo, scmsIcon, logoWhite } from "@/assets/logos";
import { BRAND } from "@/constants/brand";

const Logo = ({
  iconOnly = false,
  variant = "default", // "default" or "white"
  size = "h-8",
  className = "",
  alt,
  onClick,
  loading = "eager",
  ...props
}) => {
  // Select the appropriate logo PNG asset
  let logoAsset = scmsLogo;
  if (iconOnly) {
    logoAsset = scmsIcon;
  } else if (variant === "white") {
    logoAsset = logoWhite;
  }

  // Sensible default alt text for screen readers
  const defaultAlt = iconOnly
    ? `${BRAND.shortName} Brand Icon`
    : `${BRAND.appName} Brand Logo`;

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `Logo linking to action` : undefined}
      {...props}
    >
      <img
        src={logoAsset}
        alt={alt || defaultAlt}
        className={`${size} w-auto object-contain`}
        loading={loading}
        draggable={false}
      />
    </div>
  );
};

export default Logo;
