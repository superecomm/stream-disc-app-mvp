import { ViimProvider } from "@/contexts/VIIMContext";

export default function StreamDiscLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ViimProvider>{children}</ViimProvider>;
}


