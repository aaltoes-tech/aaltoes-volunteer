import { data, Form, Link, redirect } from "react-router";

import type { Route } from "./+types/admin.logout";
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
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Logout
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Currently logged in as:{" "}
          <span className="font-medium">{adminUser.userId}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Are you sure you want to logout?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              You will need to log in again to access admin features.
            </p>
          </div>

          <div className="mt-6 flex space-x-3">
            <Form method="post" className="flex-1">
              <input type="hidden" name="intent" value="logout" />
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                Yes, Logout
              </button>
            </Form>

            <Link
              to="/admin/login"
              className="flex flex-1 justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              Cancel
            </Link>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Session will expire automatically after 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
