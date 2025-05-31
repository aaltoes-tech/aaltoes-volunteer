import { data, Link } from "react-router";

import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { env } from "~/env";
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
      state: {
        type: {
          in: ["started", "unstarted"],
        },
      },
    },
  });
  return data({
    issues: issues.nodes.map((issue) => ({
      id: issue.id,
      humanId: issue.identifier,
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
        <h1 className="text-foreground font-game mb-8 text-center text-3xl font-bold">
          {env.PUBLIC_WELCOME_MESSAGE}
        </h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono text-xl">Issue ID</TableHead>
              <TableHead className="font-mono text-xl">Title</TableHead>
              <TableHead className="font-mono text-xl">Points</TableHead>
              <TableHead className="font-mono text-xl">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <Link
                    to={`${env.PUBLIC_LINEAR_ORG_URL}/issue/${issue.humanId}`}
                    target="_blank"
                  >
                    {issue.humanId}
                  </Link>
                </TableCell>
                <TableCell>{issue.title}</TableCell>
                <TableCell>{issue.estimate}</TableCell>
                <TableCell>
                  <Button asChild>
                    <Link
                      to={`${env.PUBLIC_OPEN_ISSUE_URL}${issue.humanId}`}
                      target="_blank"
                    >
                      Claim
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
