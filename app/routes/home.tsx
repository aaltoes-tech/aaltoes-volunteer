import { data } from "react-router";

import type { Route } from "./+types/home";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { linearService } from "~/lib/.server/linear";
import { credentialStorage } from "~/lib/.server/oauth/storage";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader() {
  const token = await credentialStorage.getToken("linear");
  if (!token) {
    return data({
      issues: [],
    });
  }
  const linearClient = linearService.getLinearClient({ token });
  if (!linearClient) {
    return data({
      issues: [],
    });
  }
  const issues = await linearClient.issues({
    filter: {
      assignee: {
        app: {
          eq: true,
        },
      },
    },
  });
  return data({
    issues: issues.nodes,
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { issues } = loaderData;
  return (
    <div>
      <h1>Welcome</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>{issue.title}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
