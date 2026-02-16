"use client";

import React from "react";
import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  GridIcon,
  UserCircleIcon,
  ListIcon,
  TableIcon,
  DocsIcon,
  VideoIcon,
  CalenderIcon,
  ShootingStarIcon,
  PageIcon,
} from "@/icons/index";

const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <UserCircleIcon />,
    name: "Organizers",
    path: "/admin/organizers",
  },
  {
    icon: <ListIcon />,
    name: "Organizer Requests",
    path: "/admin/organizer-requests",
  },
  {
    icon: <DocsIcon />,
    name: "Resource Requests",
    path: "/admin/resource-requests",
  },
  {
    icon: <VideoIcon />,
    name: "Media Requests",
    path: "/admin/media-requests",
  },
  {
    icon: <CalenderIcon />,
    name: "Event Requests",
    path: "/admin/event-requests",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Super Hero",
    path: "/admin/super-hero",
  },
  {
    icon: <PageIcon />,
    name: "Super Hero Requests",
    path: "/admin/super-hero-requests",
  },
  {
    icon: <DocsIcon />,
    name: "Announcements",
    path: "/admin/announcements",
  },
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/admin/profile",
  },
];

export default function AdminSidebar() {
  return <RoleSidebar navItems={adminNavItems} logoHref="/admin" />;
}
