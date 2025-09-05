import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";

export default function Index() {
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns:overview"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns?page=1&limit=10");
      const json = await res.json();
      return json.items as Array<{ sent: number; opened: number; replied: number; leads: number }>;
    },
  });

  const sent = campaigns?.reduce((s, c) => s + c.sent, 0) ?? 0;
  const opened = campaigns?.reduce((s, c) => s + c.opened, 0) ?? 0;
  const replied = campaigns?.reduce((s, c) => s + c.replied, 0) ?? 0;
  const leads = campaigns?.reduce((s, c) => s + c.leads, 0) ?? 0;
  const openRate = sent ? Math.round((opened / sent) * 100) : 0;
  const replyRate = opened ? Math.round((replied / opened) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Linkbird.ai Replica</h1>
          <p className="text-muted-foreground">Leads management and Campaign analytics experience.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle>Total Leads</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{leads.toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Sent</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sent.toLocaleString()}</div>
              <Progress value={sent ? 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Open Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRate}%</div>
              <Progress value={openRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle>Reply Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{replyRate}%</div>
              <Progress value={replyRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Search, filter and review lead details with an infinite table and side sheet.</p>
              <Button asChild><Link to="/leads">Open Leads</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Track campaign performance with sortable table and KPIs.</p>
              <Button variant="secondary" asChild><Link to="/campaigns">Open Campaigns</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
