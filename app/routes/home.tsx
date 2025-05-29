import { Info } from "lucide-react";
import { data } from "react-router";

import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
        <h1 className="text-foreground font-game mb-8 text-center text-3xl font-bold">
          {env.PUBLIC_ORG_NAME ? `${env.PUBLIC_ORG_NAME} HelpMe!` : "HelpMe!"}
        </h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono text-xl">
                Available Issues
              </TableHead>
              <TableHead className="font-mono text-xl">Points</TableHead>
              <TableHead className="font-mono text-xl">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <Dialog key={issue.id}>
                <TableRow>
                  <TableCell>{issue.title}</TableCell>
                  <TableCell>{issue.estimate}</TableCell>
                  <TableCell>
                    <DialogTrigger asChild>
                      <Button className="-my-1.5" variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </TableCell>
                </TableRow>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{issue.title}</DialogTitle>
                  </DialogHeader>
                  <p className="text-foreground text-sm whitespace-pre-wrap">
                    {issue.description}
                  </p>
                </DialogContent>
              </Dialog>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
