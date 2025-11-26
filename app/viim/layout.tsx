import { ViimProvider } from "@/contexts/VIIMContext";

export default function ViimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ViimProvider>{children}</ViimProvider>;
}

