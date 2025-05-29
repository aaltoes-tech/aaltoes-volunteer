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
        isMe: {
          eq: true,
        },
      },
    },
  });
  return data({
    issues: issues.nodes.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      estimate: issue.estimate ?? "1",
    })),
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { issues } = loaderData;
  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-foreground mb-8 text-center text-3xl font-bold">
          Volunteer Portal
        </h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Available Issues</TableHead>
              <TableHead>Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.title}</TableCell>
                <TableCell>{issue.estimate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
