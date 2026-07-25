import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordInput = ({
  label,
  name,
  placeholder,
  value,
  onChange,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-5">
      <label className="block mb-2 font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">

        <input
        name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>

      </div>
    </div>
  );
};

export default PasswordInput;