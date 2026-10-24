import "@/app/auth.css";
import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="auth-shell"><Link className="auth-brand" href="/">CRICKET <span>FANTASY</span></Link>{children}</main>;
}
