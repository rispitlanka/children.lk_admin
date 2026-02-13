"use client";

import React from "react";
import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  GridIcon,
  UserCircleIcon,
  DocsIcon,
  ListIcon,
  VideoIcon,
  CalenderIcon,
  ShootingStarIcon,
} from "@/icons/index";

const organizerNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/organizer",
  },
  {
    icon: <UserCircleIcon />,
    name: "Organization",
    path: "/organizer/organization",
  },
  {
    icon: <DocsIcon />,
    name: "Resources",
    path: "/organizer/resources",
  },
  {
    icon: <ListIcon />,
    name: "Learning",
    path: "/organizer/learning",
  },
  {
    icon: <VideoIcon />,
    name: "Media",
    path: "/organizer/media",
  },
  {
    icon: <CalenderIcon />,
    name: "Events",
    path: "/organizer/events",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Super Hero",
    path: "/organizer/super-hero",
  },
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/organizer/profile",
  },
];

export default function OrganizerSidebar() {
  return <RoleSidebar navItems={organizerNavItems} logoHref="/organizer" />;
}
