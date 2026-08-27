import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  username: string;
  role: string;
  display_name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem("admin_token");
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const refreshUser = (newToken?: string) => {
    if (newToken) {
      localStorage.setItem("admin_token", newToken);
    }
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("admin_token");
        setUser(null);
      });
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setUser(null);
    router.push("/admin/login");
  };

  return { user, loading, logout, refreshUser };
}
