import { useEffect, useState } from "react";

const AnimatedNumber = ({ value }) => {
  const isPercent = typeof value === "string" && value.includes("%");
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (isNaN(numericValue)) {
      setDisplayVal(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 1000; // 1 second duration
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out cubic: progress = 1 - (1 - progress)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;

      setDisplayVal(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayVal(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value, numericValue]);

  if (isNaN(numericValue)) {
    return <span>{value}</span>;
  }

  if (isPercent) {
    return <span>{displayVal.toFixed(1)}%</span>;
  }

  return <span>{Math.round(displayVal).toLocaleString()}</span>;
};

export default AnimatedNumber;
