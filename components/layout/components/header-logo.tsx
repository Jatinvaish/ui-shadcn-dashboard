import { useEffect, useState } from "react";
import { Menu, PanelRight, Plus } from "lucide-react";
import { useLayout } from "./context";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarPrimary } from "./sidebar-primary";
import { SidebarSecondary } from "./sidebar-secondary";
import { toAbsoluteUrl } from "@/lib/helpers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IfHasAccess } from "@/components/guards/if-has-access";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentTenant, fetchTenantMembers } from "@/store/slices/tenantSlice";
import { selectUser } from "@/store/slices/authSlice";
import { AddUserDialog } from "@/app/dashboard/access-control/users/add-user-dialog";
import { cn } from "@/lib/utils";

export function HeaderLogo() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isMobile, sidebarToggle, showSecondarySidebar } = useLayout();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const currentUser = useAppSelector(selectUser);
  const currentTenant = useAppSelector(selectCurrentTenant);

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const handleUserAdded = () => {
    const tenantId = currentUser?.tenantId || currentTenant?.id;
    if (tenantId) {
      dispatch(fetchTenantMembers(Number(tenantId)));
    }
  };

  return (
    <>
      <div className="border-border flex items-center gap-2 border-e lg:w-[var(--sidebar-width)]">
        <div className="flex w-full items-center">
          <div className="border-border bg-muted flex h-[var(--header-height-mobile)] w-[var(--sidebar-collapsed-width)] shrink-0 items-center justify-center border-0 lg:h-[var(--header-height)]">
            <Link href="/dashboard">
              <img
                src={toAbsoluteUrl("/media/app/fluera_logo.png")}
                className="min-h-[30px] dark:hidden"
                alt="Thunder AI Logo"
              />
              <img
                src={toAbsoluteUrl("/media/app/fluera_logo.png")}
                className="hidden min-h-[30px] dark:block"
                alt="Thunder AI Logo"
              />
            </Link>
          </div>

          {isMobile && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" mode="icon" size="sm" className="ms-3">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[280px] gap-0 p-0" side="left" close={false}>
                <SheetHeader className="space-y-0 p-0" />
                <SheetBody className="flex grow p-0">
                  <SidebarPrimary />
                  {showSecondarySidebar && <SidebarSecondary />}
                </SheetBody>
              </SheetContent>
            </Sheet>
          )}

          <div className="hidden w-full grow items-center justify-between gap-2.5 px-5 lg:flex">
            <IfHasAccess menuKey="access-control.users">
              <Button
                onClick={() => setAddUserDialogOpen(true)}
                className="xs:w-auto flex w-full items-center gap-2">
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span>Add User</span>
              </Button>
            </IfHasAccess>
            {showSecondarySidebar && (
              <Button
                mode="icon"
                variant="ghost"
                onClick={sidebarToggle}
                className="text-muted-foreground hover:text-foreground">
                <PanelRight className="-rotate-180 opacity-100 in-data-[sidebar-open=false]:rotate-0" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={handleUserAdded}
      />
    </>
  );
}
