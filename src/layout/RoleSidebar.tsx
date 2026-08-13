"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDownIcon } from "@/icons/index";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

type RoleSidebarProps = {
  navItems: NavItem[];
  logoHref: string;
};

export function RoleSidebar({ navItems, logoHref }: RoleSidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openSubmenu, setOpenSubmenu] = useState<{ index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) =>
      path === pathname || (path !== "/admin" && pathname.startsWith(path + "/")),
    [pathname]
  );

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ index });
            submenuMatched = true;
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state: syncing submenu with pathname
    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive, navItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `0-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) =>
      prev?.index === index ? null : { index }
    );
  };

  const renderMenuItems = () => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <>
              <button
                onClick={() => handleSubmenuToggle(index)}
                className={`menu-item group cursor-pointer ${
                  openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"
                } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span
                  className={
                    openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text truncate">{nav.name}</span>
                    <ChevronDownIcon
                      className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                        openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                      }`}
                    />
                  </>
                )}
              </button>
              {(isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`0-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: openSubmenu?.index === index ? `${subMenuHeight[`0-${index}`] ?? 0}px` : "0px",
                  }}
                >
                  <ul className="mt-1 space-y-1 ml-6">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={
                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text truncate">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-gray-50 dark:bg-gray-dark text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 dark:border-gray-800
        ${isExpanded || isMobileOpen ? "w-[270px]" : isHovered ? "w-[270px]" : "w-[72px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-4 px-6 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center px-2" : "justify-start"
        }`}
      >
        <Link href={logoHref} className="flex items-center gap-2">
          {isExpanded || isHovered || isMobileOpen ? (
            <Image 
              src="/images/logo/children.svg" 
              alt="Children.lk Logo" 
              width={120} 
              height={32}
              className="h-7 w-auto"
            />
          ) : (
            <Image 
              src="/images/logo/children.svg" 
              alt="Children.lk Logo" 
              width={28} 
              height={28}
              className="h-7 w-auto"
            />
          )}
        </Link>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar py-2">
        <nav className="mb-4 px-2">
          {renderMenuItems()}
        </nav>
      </div>

      {/* Bottom-left avatar bubble */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-transparent">
        <div className="w-9 h-9 min-w-[36px] rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-semibold text-sm flex items-center justify-center border-none shadow-none shrink-0">
          {initials}
        </div>
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email ?? ""}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
