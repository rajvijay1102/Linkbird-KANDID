import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Campaign, PaginatedResponse } from "@shared/api";
import AppLayout from "@/layouts/AppLayout";

export default function CampaignsPage() {
  const [sort, setSort] = useState<keyof Campaign>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const fetchCampaigns = async (): Promise<PaginatedResponse<Campaign>> => {
    const res = await fetch("/api/campaigns?page=1&limit=50");
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
  };

  const { data, isLoading, refetch } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const campaigns = data?.items ?? [];

  const sorted = useMemo(() => {
    const arr = [...campaigns];
    arr.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (sort === "createdAt") {
        return (new Date(av as string).getTime() - new Date(bv as string).getTime()) * (dir === "asc" ? 1 : -1);
      }
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * (dir === "asc" ? 1 : -1);
      }
      return String(av).localeCompare(String(bv)) * (dir === "asc" ? 1 : -1);
    });
    return arr;
  }, [campaigns, sort, dir]);

  const totals = useMemo(() => {
    const sent = campaigns.reduce((s, c) => s + c.sent, 0);
    const opened = campaigns.reduce((s, c) => s + c.opened, 0);
    const replied = campaigns.reduce((s, c) => s + c.replied, 0);
    const leads = campaigns.reduce((s, c) => s + c.leads, 0);
    const openRate = sent ? Math.round((opened / sent) * 100) : 0;
    const replyRate = opened ? Math.round((replied / opened) * 100) : 0;
    return { sent, opened, replied, leads, openRate, replyRate };
  }, [campaigns]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Total Leads</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{totals.leads.toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Sent</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.sent.toLocaleString()}</div>
              <Progress value={totals.sent ? 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Open Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.openRate}%</div>
              <Progress value={totals.openRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Reply Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.replyRate}%</div>
              <Progress value={totals.replyRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as keyof Campaign)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dir} onValueChange={(v) => setDir(v as any)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Replied</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-6 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sorted.map((c) => {
                const openRate = c.sent ? Math.round((c.opened / c.sent) * 100) : 0;
                const replyRate = c.opened ? Math.round((c.replied / c.opened) * 100) : 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "running" ? "default" : "secondary"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.leads}</TableCell>
                    <TableCell>{c.sent}</TableCell>
                    <TableCell>{openRate}%</TableCell>
                    <TableCell>{replyRate}%</TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
