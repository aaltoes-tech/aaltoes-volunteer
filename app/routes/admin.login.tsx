import { data, Form, redirect } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

import type { Route } from "./+types/admin.login";
import { getAdminConfig, validateAdminCredentials } from "~/lib/.server/auth";
import { commitSession, getSession } from "~/lib/.server/sessions";

export function meta() {
  return [
    { title: "Admin Login" },
    { name: "description", content: "Admin authentication" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const adminConfig = getAdminConfig();

  // Redirect if already authenticated
  if (session.get("isAdminAuthenticated")) {
    return redirect("/");
  }

  return data(
    {
      error: session.get("error"),
      hasCredentials: adminConfig.hasCredentials,
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();

  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || typeof password !== "string") {
    session.flash("error", "Username and password are required");
    return redirect("/admin/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  const isValid = validateAdminCredentials(username, password);

  if (!isValid) {
    session.flash("error", "Invalid username or password");
    return redirect("/admin/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Set authenticated session
  session.set("isAdminAuthenticated", true);
  session.set("userId", username);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function AdminLogin({ loaderData }: Route.ComponentProps) {
  const { error, hasCredentials } = loaderData;

  if (!hasCredentials) {
    return (
      <div className="min-h-screen bg-muted px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">
              Admin Login
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Administrative access required
            </p>
          </div>
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">
                    Admin credentials are not configured. Please set
                    ADMIN_USERNAME and ADMIN_PASSWORD environment variables.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your admin credentials
          </p>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Form method="post" className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-foreground"
                  >
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring focus:outline-none focus:ring-2 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring focus:outline-none focus:ring-2 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full">
                    Sign in
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
