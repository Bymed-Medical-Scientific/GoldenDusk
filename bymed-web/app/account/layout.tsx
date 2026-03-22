import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
