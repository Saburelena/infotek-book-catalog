import { useAppServices } from "@/shared/di/container";
import { useAbortable } from "@/shared/lib/useAbortable";

export function useAuth() {
  const services = useAppServices();
  const { signal } = useAbortable();

  async function login(username: string, password: string) {
    const response = await services.authApi.login(username, password, signal());
    services.auth.login(response);
  }

  return {
    user: services.auth.user,
    isUser: services.auth.isUser,
    login,
    logout: services.auth.logout,
  };
}
