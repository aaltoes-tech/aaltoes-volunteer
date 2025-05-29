import { data, Form, redirect } from "react-router";

import type { Route } from "./+types/admin.login";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { validateAdminCredentials } from "~/lib/.server/auth";
import { commitSession, getSession } from "~/lib/.server/sessions";

export function meta() {
  return [
    { title: "Admin Login" },
    { name: "description", content: "Admin authentication" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  // Redirect if already authenticated
  if (session.get("isAdminAuthenticated")) {
    return redirect("/");
  }

  return data(
    {
      error: session.get("error"),
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
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
  const { error } = loaderData;

  return (
    <div className="bg-muted min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h2 className="text-foreground mt-6 text-3xl font-extrabold">
            Admin Login
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
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
                    className="text-foreground block text-sm font-medium"
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
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-foreground block text-sm font-medium"
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
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring block w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none sm:text-sm"
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
