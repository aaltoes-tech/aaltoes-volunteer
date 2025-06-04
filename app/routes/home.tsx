import { data, Link } from "react-router";
import { useCallback, useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { env } from "~/env";
import { linearService } from "~/lib/.server/linear";
import { credentialStorage } from "~/lib/.server/oauth/storage";
import { CalendarIcon, MessageCircleIcon, SearchIcon } from "lucide-react";

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
  
  try {
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
      }
    });
    
    // Fetch additional data for each issue
    const issuesWithDetails = await Promise.all(
      issues.nodes.map(async (issue) => {
        const labels = await issue.labels();
        const project = await issue.project;
        
        return {
          id: issue.id,
          humanId: issue.identifier,
          title: issue.title,
          labels: labels.nodes.map((label) => label.name).join(", ") ?? null,
          project: project?.name ?? null,
          deadline: issue.dueDate,
          priority: issue.priority,
          description: issue.description,
          estimate: issue.estimate ?? "1",
        };
      })
    );

    // Sort issues: first by deadline (nulls last), then by priority
    const sortedIssues = issuesWithDetails.sort((a, b) => {
      // If both have deadlines, compare them
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      // If only one has a deadline, prioritize the one with deadline
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      // If neither has a deadline, sort by priority (lower number = higher priority)
      return (a.priority ?? 0) - (b.priority ?? 0);
    });

    return data({
      issues: sortedIssues,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return data({
      issues: [],
    });
  }
}

function getCardStyles(priority: number | undefined): string {
  switch (priority) {
    case 1: // Urgent
      return "border-destructive/20 bg-destructive/5 hover:bg-destructive/10";
    case 2: // High
      return "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10";
    case 3: // Medium
      return "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10";
    case 4: // Low
      return "border-green-500/20 bg-green-500/5 hover:bg-green-500/10";
    case 0: // No Priority
    default:
      return "border-border bg-card hover:bg-accent/5";
  }
}

type Issue = {
  id: string;
  humanId: string;
  title: string;
  labels: string | null;
  project: string | null;
  deadline: string | null;
  priority: number | undefined;
  description: string | null;
  estimate: string | number;
};

export default function Home({ loaderData }: Route.ComponentProps) {
  // Initialize state with loader data
  const [issues] = useState<Issue[]>(() => {
    return loaderData.issues.map(issue => ({
      ...issue,
      description: issue.description ?? null,
      deadline: issue.deadline ?? null,
      estimate: String(issue.estimate)
    }));
  });

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-foreground font-game mb-8 text-center text-3xl font-bold">
          {env.PUBLIC_WELCOME_MESSAGE}
        </h1>
        <h2 className="text-foreground mb-8 text-center text-xl">
          If you want to help with the issue, contact responsible person for the issue and then claim issue in Telegram Bot.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => (
            <Card 
              key={issue.id} 
              className="flex flex-col"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold">
                        <Link
                          to={`${env.PUBLIC_LINEAR_ORG_URL}/issue/${issue.humanId}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {issue.humanId} – {issue.title} ({issue.estimate} pts)
                        </Link>
                      </CardTitle>
                    </div>
                    
                    {issue.description && (
                      <CardDescription className="line-clamp-2">
                        {issue.description}
                      </CardDescription>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {issue.priority !== undefined && (
                        <Badge 
                          className={getPriorityBadgeClass(issue.priority)}
                        >
                          {getPriorityLabel(issue.priority)}
                        </Badge>
                      )}
                      {issue.project && (
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium px-3 py-1"
                        >
                          {issue.project}
                        </Badge>
                      )}
                      {issue.labels && issue.labels.split(", ").map((label) => (
                        <Badge key={label} variant="outline" className="bg-muted/50 hover:bg-muted text-sm font-medium">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {issue.deadline && (
                  <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">
                        <span className="font-medium">Deadline:</span>{" "}
                        {formatDate(issue.deadline)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                    >
                      <Link
                        to={getGoogleCalendarUrl(issue)}
                        target="_blank"
                        title="Add to Google Calendar"
                      >
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        Add to Calendar
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link
                    to={getTelegramContactUrl(issue)}
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    <MessageCircleIcon className="h-4 w-4" />
                    Contact
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link
                    to={`${env.PUBLIC_OPEN_ISSUE_URL}${issue.humanId}`}
                    target="_blank"
                  >
                    Open in Telegram
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function getPriorityBadgeClass(priority: number): string {
  switch (priority) {
    case 1: // Urgent
      return "bg-red-500 text-white hover:bg-red-600 text-sm font-medium";
    case 2: // High
      return "bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium";
    case 3: // Medium
      return "bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium";
    case 4: // Low
      return "bg-green-500 text-white hover:bg-green-600 text-sm font-medium";
    case 0: // No Priority
    default:
      return "bg-gray-500 text-white hover:bg-gray-600 text-sm font-medium";
  }
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return "Urgent";
    case 2:
      return "High";
    case 3:
      return "Medium";
    case 4:
      return "Low";
    case 0:
    default:
      return "No Priority";
  }
}

function getGoogleCalendarUrl(issue: Issue) {
  if (!issue.deadline) return '#';
  
  const startDate = new Date(issue.deadline);
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + 1); // 1 hour duration

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `[${issue.humanId}] ${issue.title}`,
    dates: `${startDate.toISOString().replace(/-|:|\.\d+/g, "")}/${endDate.toISOString().replace(/-|:|\.\d+/g, "")}`,
    details: `Linear Issue: ${env.PUBLIC_LINEAR_ORG_URL}/issue/${issue.humanId}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');
}

function getTelegramContactUrl(issue: { humanId: string; title: string; project: string | null }) {
  const message = `Hi! I'm interested in helping with the issue ${issue.humanId} - ${issue.title}`;
  const username = issue.project === "TSC" ? "katteelsker" : "vaneezamaqsood";
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`;
}
