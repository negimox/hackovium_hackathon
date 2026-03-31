"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Bullet } from "@/components/ui/bullet";
import { PieChart, LayoutDashboard } from "lucide-react";
import { EditProfileDialog } from "@/components/advisor/edit-profile-dialog";

// Simplified navigation for financial advisor app
const data = {
  navMain: [
    {
      title: "Financial Advisor",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
          locked: false,
        },
        {
          title: "Investments",
          url: "/dashboard/investments",
          icon: PieChart,
          locked: false,
        },
      ],
    },
  ],
};

export function LeftSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props} className={cn(className)}>
      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>
              <Bullet className="mr-2 group-data-[collapsible=icon]:hidden" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.url === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname?.startsWith(item.url);

                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className={cn(
                        item.locked && "pointer-events-none opacity-50",
                      )}
                    >
                      <SidebarMenuButton
                        asChild={!item.locked}
                        isActive={isActive}
                        disabled={item.locked}
                        tooltip={item.title}
                        className={cn(
                          "disabled:cursor-not-allowed",
                          item.locked && "pointer-events-none",
                        )}
                      >
                        {item.locked ? (
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </div>
                        ) : (
                          <a href={item.url}>
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </a>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* <SidebarFooter className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            <Bullet className="mr-2" />
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <EditProfileDialog />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  );
}
