"use client";

import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, useState } from "react";

export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return <span className="passwordInputWrap">
    <input {...props} type={visible ? "text" : "password"} />
    <button
      className="passwordToggle"
      type="button"
      aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
      aria-pressed={visible}
      onClick={event => { event.preventDefault(); event.stopPropagation(); setVisible(current => !current); }}
    >{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>
  </span>;
}
