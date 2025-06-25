"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Home page that redirects to the reservation page
 * Since only the /reservar page matters, we redirect users there immediately
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the reservation page immediately
    router.push("/reservar");
  }, [router]);

  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Redirecting...</div>
    </div>
  );
}
