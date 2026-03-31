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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import AtomIcon from "@/components/icons/atom";
import BracketsIcon from "@/components/icons/brackets";
import ProcessorIcon from "@/components/icons/proccesor";
import { Bullet } from "@/components/ui/bullet";
import { SlidersHorizontal, PieChart, Activity, Newspaper, Eye } from "lucide-react";
import LockIcon from "@/components/icons/lock";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

// This is sample data for the sidebar
const data = {
  navMain: [
    {
      title: "Platform",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: BracketsIcon,
          locked: false,
        },
        {
          title: "Research",
          url: "/research",
          icon: AtomIcon,
          locked: false,
        },
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: ProcessorIcon,
          locked: false,
        },
        {
          title: "Watchlist",
          url: "/watchlist",
          icon: Eye,
          locked: false,
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          title: "Stock Screener",
          url: "/screener",
          icon: SlidersHorizontal,
          locked: false,
        },
        {
          title: "Mutual Funds",
          url: "/funds",
          icon: PieChart,
          locked: false,
        },
        {
          title: "Market Sentiment",
          url: "/sentiment",
          icon: Activity,
          locked: false,
        },
        {
          title: "News & Analysis",
          url: "/news",
          icon: Newspaper,
          locked: false,
        },
      ],
    },
  ],
};

export function DashboardSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex flex-row rounded-b-none p-4 items-center justify-center">
        <Image 
          src="/logo.png" 
          alt="Everything Money" 
          width={180} 
          height={48} 
          className="h-10 w-auto object-contain"
          priority
        />
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup
            className={cn(i === 0 && "rounded-t-none")}
            key={group.title}
          >
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                   // Simple active check: exact match for root, startsWith for others if needed
                   const isActive = item.url === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.url);
                   
                   return (
                    <SidebarMenuItem
                      key={item.title}
                      className={cn(
                        item.locked && "pointer-events-none opacity-50"
                      )}
                      data-disabled={item.locked}
                    >
                    <SidebarMenuButton
                      asChild={!item.locked}
                      isActive={isActive}
                      disabled={item.locked}
                      className={cn(
                        "disabled:cursor-not-allowed",
                        item.locked && "pointer-events-none"
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
                    {item.locked && (
                      <SidebarMenuBadge>
                        <LockIcon className="size-5 block" />
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )})}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center justify-center p-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "size-10",
                    },
                  }}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
