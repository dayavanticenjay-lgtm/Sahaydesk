import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCategory } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TicketStatusSelect } from "./ticket-status-select";
import { TicketAssigneeSelect } from "./ticket-assignee-select";
import { SummarizePanel } from "./summarize-panel";
import { ReplyForm } from "./reply-form";
import { EditTicketDialog } from "./edit-ticket-dialog";
import { DeleteTicketButton } from "./delete-ticket-button";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) notFound();

  const [ticket, agents] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { isAiAgent: false, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link href="/tickets" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to tickets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-balance">{ticket.subject}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <EditTicketDialog
            ticketId={ticket.id}
            subject={ticket.subject}
            body={ticket.body}
            senderName={ticket.senderName}
            senderEmail={ticket.senderEmail}
            category={ticket.category}
          />
          <DeleteTicketButton ticketId={ticket.id} subject={ticket.subject} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          <Card className="gap-3 p-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-muted text-xs font-semibold">{initials(ticket.senderName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">{ticket.senderName}</span>
                    <span className="text-xs text-muted-foreground">{ticket.createdAt.toLocaleString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {ticket.replies.map((reply) => (
            <Card
              key={reply.id}
              className={reply.senderType === "AGENT" ? "gap-3 border-primary/20 bg-primary/[0.03] p-0" : "gap-3 p-0"}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback
                      className={
                        reply.senderType === "AGENT"
                          ? "bg-primary/15 text-xs font-semibold text-primary"
                          : "bg-muted text-xs font-semibold"
                      }
                    >
                      {initials(reply.senderType === "AGENT" ? (reply.user?.name ?? "Agent") : ticket.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold">
                        {reply.senderType === "AGENT" ? (reply.user?.name ?? "Agent") : ticket.senderName}
                      </span>
                      {reply.senderType === "AGENT" ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Agent
                        </Badge>
                      ) : null}
                      <span className="text-xs text-muted-foreground">{reply.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <ReplyForm ticketId={ticket.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-10">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Status</p>
                <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Assignee</p>
                <TicketAssigneeSelect ticketId={ticket.id} assignedToId={ticket.assignedToId} agents={agents} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Category</p>
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {formatCategory(ticket.category)}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Requester</p>
                <p className="text-sm font-semibold">{ticket.senderName}</p>
                <a
                  href={`mailto:${ticket.senderEmail}`}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-3.5" />
                  {ticket.senderEmail}
                </a>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Created</p>
                <p className="text-sm">{ticket.createdAt.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <SummarizePanel ticketId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
