"use client";

// Temporarily skip authentication - imports commented out
// import { useAuth } from "@/contexts/AuthContext";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  // Temporarily skip authentication check - allow all access
  return <>{children}</>;
  
  // Original auth check (commented out for now):
  // const { currentUser, loading } = useAuth();
  // const router = useRouter();
  // 
  // useEffect(() => {
  //   if (!loading && !currentUser) {
  //     router.push("/");
  //   }
  // }, [currentUser, loading, router]);
  // 
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-slate-950">
  //       <div className="text-slate-100">Loading...</div>
  //     </div>
  //   );
  // }
  // 
  // if (!currentUser) {
  //   return null;
  // }
  // 
  // return <>{children}</>;
}

