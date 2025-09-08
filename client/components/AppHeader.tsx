import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

function useCrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    return { href, label };
  });
  return crumbs.length ? crumbs : [{ href: "/leads", label: "Leads" }];
}

export function AppHeader() {
  const crumbs = useCrumbs();
  const { user, signInWithGoogle, signOut } = useSession();
  const initials = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {crumbs.map((c, i) => (
              <BreadcrumbItem key={c.href}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
                {i < crumbs.length - 1 && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3">
                <Avatar className="size-6">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.name || user?.email || "Guest"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    toast.success("Logged out");
                  }}
                >
                  Logout
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={signInWithGoogle}>Sign in with Google</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
