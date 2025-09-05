import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lead, LeadStatus, PaginatedResponse } from "@shared/api";
import AppLayout from "@/layouts/AppLayout";

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function LeadsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const debouncedQ = useDebounced(q, 400);
  const queryClient = useQueryClient();

  const fetchLeads = async ({ pageParam = 1 }): Promise<PaginatedResponse<Lead>> => {
    const params = new URLSearchParams({ page: String(pageParam), limit: "20" });
    if (debouncedQ) params.set("q", debouncedQ);
    if (status) params.set("status", status);
    const res = await fetch(`/api/leads?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch leads");
    return res.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["leads", { q: debouncedQ, status }],
    queryFn: fetchLeads,
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  useEffect(() => {
    // refetch on filter change handled by query key change
  }, [debouncedQ, status]);

  const allLeads = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const el = loadMoreRef.current;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, allLeads.length]);

  const [selected, setSelected] = useState<Lead | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return (await res.json()) as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated");
    },
    onError: () => toast.error("Update failed"),
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 flex gap-2">
            <Input placeholder="Search leads by name, company, role, email" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => refetch()} variant="secondary">Refresh</Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))}

              {!isLoading && allLeads.map((l) => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelected(l)}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell>{l.role}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email}</TableCell>
                  <TableCell>{l.location}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "responded" || l.status === "qualified" ? "default" : "secondary"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{l.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <span className="text-sm text-muted-foreground">Loading more…</span>}
            {!hasNextPage && !isLoading && (
              <span className="text-sm text-muted-foreground">No more results</span>
            )}
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="sm:max-w-xl w-full">
          {selected && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Company</div>
                  <div className="font-medium">{selected.company}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium">{selected.role}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium break-all">{selected.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Location</div>
                  <div className="font-medium">{selected.location}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div>
                    <Badge variant="secondary">{selected.status}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Score</div>
                  <div className="font-medium">{selected.score}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="rounded-md border p-3 text-sm leading-relaxed bg-muted/30">
                  {selected.notes}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateStatus.mutate({ id: selected.id, status: "contacted" })}>Mark Contacted</Button>
                <Button variant="secondary" onClick={() => updateStatus.mutate({ id: selected.id, status: "qualified" })}>Mark Qualified</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
