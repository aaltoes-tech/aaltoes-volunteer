import { data, Form, Link, redirect } from "react-router";

import type { Route } from "./+types/admin.logout";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  destroySession,
  getAdminUser,
  getSession,
  requireAdminAuth,
} from "~/lib/.server/sessions";

export function meta() {
  return [
    { title: "Admin Logout" },
    { name: "description", content: "Admin logout page" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdminAuth(request);
  const adminUser = await getAdminUser(request);

  return data({
    adminUser,
  });
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    const session = await getSession(request.headers.get("Cookie"));

    return redirect("/admin/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  return redirect("/admin/logout");
}

export default function AdminLogout({ loaderData }: Route.ComponentProps) {
  const { adminUser } = loaderData;

  return (
    <div className="bg-muted min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <h2 className="text-foreground mt-6 text-3xl font-extrabold">
            Admin Logout
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Currently logged in as:{" "}
            <span className="text-foreground font-medium">
              {adminUser.userId}
            </span>
          </p>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Logout Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <h3 className="text-foreground mt-4 text-lg font-medium">
                  Are you sure you want to logout?
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  You will need to log in again to access admin features.
                </p>
              </div>

              <div className="mt-6 flex space-x-3">
                <Form method="post" className="flex-1">
                  <input type="hidden" name="intent" value="logout" />
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                  >
                    Yes, Logout
                  </Button>
                </Form>

                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/admin/login">Cancel</Link>
                </Button>
              </div>

              <div className="border-border mt-6 border-t pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">
                    Session will expire automatically after 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
