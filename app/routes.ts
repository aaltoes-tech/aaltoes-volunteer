import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth.tsx"),
  route("auth/authorize", "routes/auth.authorize.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("auth/revoke", "routes/auth.revoke.tsx"),
  route("admin/login", "routes/admin.login.tsx"),
  route("admin/logout", "routes/admin.logout.tsx"),
] satisfies RouteConfig;
