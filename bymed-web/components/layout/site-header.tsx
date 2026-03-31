"use client";

import { useAuth } from "@/components/auth/auth-context";
import { BymedLogo } from "@/components/brand/bymed-logo";
import { useCart } from "@/components/cart/cart-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { primaryNavLinks } from "@/lib/site-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

function HeaderIconHint({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-[70] mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {label}
      </span>
    </div>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-6 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconCart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PrimaryNavLink({
  href,
  label,
  overlay,
}: {
  href: string;
  label: string;
  overlay: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "group relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
        overlay
          ? active
            ? "text-white"
            : "text-white/85 hover:text-white"
          : active
            ? "text-primary"
            : "text-foreground/80 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
      <span
        className={cn(
          "absolute bottom-0 left-3 right-3 h-0.5 rounded-full transition-transform duration-200 ease-out",
          overlay ? "bg-white" : "bg-brand",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
        aria-hidden
      />
    </Link>
  );
}

const iconBtnOverlay =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const iconBtnBar =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/85 transition-colors hover:bg-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-muted-foreground dark:hover:bg-muted";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const siteSearchInputId = useId();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setUserMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (searchWrapRef.current?.contains(e.target as Node)) return;
      setSearchOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  const isHome = pathname === "/";
  const isAbout = pathname === "/about";
  const overlayNav = (isHome || isAbout) && !scrolled;
  const iconBtnClass = overlayNav ? iconBtnOverlay : iconBtnBar;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-transparent transition-[box-shadow,backdrop-filter,border-color] duration-300 ease-out",
        scrolled
          ? "glass-header-scrolled"
          : "border-b-0",
      )}
    >
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(22rem,92vw)] flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle className="font-heading text-lg">Menu</SheetTitle>
          </SheetHeader>
          <div className="border-b border-border p-4">
            <form action="/products" method="get" role="search">
              <label htmlFor="site-search-drawer" className="sr-only">
                Search products
              </label>
              <div className="flex gap-2">
                <Input
                  id="site-search-drawer"
                  name="q"
                  type="search"
                  placeholder="Search technology…"
                  autoComplete="off"
                  className="flex-1"
                />
                <Button type="submit" size="icon" aria-label="Submit search">
                  <IconSearch />
                </Button>
              </div>
            </form>
          </div>
          <nav
            id="mobile-nav-sheet"
            className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
            aria-label="Mobile primary"
          >
            {primaryNavLinks.map(({ href, label }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand/12 text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className={buttonVariants({
                className:
                  "mt-3 h-12 w-full justify-center rounded-full border-0 bg-brand px-6 text-brand-foreground shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.2)] transition-shadow hover:bg-brand-hover hover:shadow-[0_12px_28px_-10px_rgb(0_0_0_/_0.28)]",
              })}
            >
              Request Quote
            </Link>
          </nav>
          <div className="mt-auto border-t border-border p-4">
            <Link
              href="/cart"
              className="mb-2 block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cart
              {totalItems > 0 ? ` (${totalItems})` : ""}
            </Link>
            {!user ? (
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Sign in
              </Link>
            ) : (
              <>
                <Link
                  href="/account"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  My account
                </Link>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    closeMobile();
                    void logout();
                  }}
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative mx-auto flex h-[4.5rem] max-w-7xl items-center gap-3 px-4 sm:h-20 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center lg:flex-initial">
          <Link
            href="/"
            className={cn(
              "inline-flex min-w-0 shrink-0 rounded-md focus:outline-none focus-visible:ring-2",
              overlayNav
                ? "focus-visible:ring-white/60"
                : "focus-visible:ring-primary/45",
            )}
            aria-label="ByMed Medical and Scientific — home"
            onClick={closeMobile}
          >
            <BymedLogo
              variant={overlayNav ? "header" : "headerOnLight"}
              priority
            />
          </Link>
        </div>

        <nav
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex"
          aria-label="Primary"
        >
          <div className="flex items-center gap-0.5 xl:gap-1">
            {primaryNavLinks.map(({ href, label }) => (
              <PrimaryNavLink
                key={href}
                href={href}
                label={label}
                overlay={overlayNav}
              />
            ))}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <div className="relative hidden lg:block" ref={searchWrapRef}>
            <HeaderIconHint label="Search">
              <button
                type="button"
                className={iconBtnClass}
                aria-expanded={searchOpen}
                aria-controls="site-search-popover"
                aria-label="Open search"
                onClick={() => setSearchOpen((o) => !o)}
              >
                <IconSearch />
              </button>
            </HeaderIconHint>
            {searchOpen ? (
              <div
                id="site-search-popover"
                className="absolute right-0 top-full z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-premium"
                role="dialog"
                aria-label="Search catalog"
              >
                <form action="/products" method="get" role="search">
                  <label htmlFor={siteSearchInputId} className="sr-only">
                    Search technology
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id={siteSearchInputId}
                      name="q"
                      type="search"
                      placeholder="Search technology…"
                      autoComplete="off"
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="icon"
                      aria-label="Submit search"
                      className="shrink-0 bg-brand text-brand-foreground hover:bg-brand-hover"
                    >
                      <IconSearch />
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>

          <HeaderIconHint label="Cart" className="hidden lg:inline-flex">
            <Link href="/cart" className={iconBtnClass} aria-label="Cart">
              <IconCart />
              {totalItems > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold leading-none text-brand-foreground">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              ) : null}
            </Link>
          </HeaderIconHint>

          <HeaderIconHint label="Theme">
            <ThemeToggle variant={overlayNav ? "header" : "minimal"} />
          </HeaderIconHint>

          <HeaderIconHint label="Account" className="hidden lg:inline-flex">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={iconBtnClass}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label={
                  isLoading
                    ? "Account menu, loading"
                    : user
                      ? `Account menu, signed in as ${user.name}`
                      : "Account menu, sign in"
                }
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <IconUser />
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-premium"
                >
                  {user ? (
                    <>
                      <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                        <span className="block truncate font-medium text-foreground">
                          {user.name}
                        </span>
                        <span className="block truncate">{user.email}</span>
                      </p>
                      <Link
                        role="menuitem"
                        href="/account"
                        className="block px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My account
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setUserMenuOpen(false);
                          void logout();
                        }}
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      role="menuitem"
                      href="/login"
                      className="block px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </HeaderIconHint>

          <Link
            href="/contact"
            className={cn(
              buttonVariants({
                size: "sm",
                className:
                  "hidden lg:inline-flex h-11 min-h-11 rounded-full border-0 bg-brand px-6 font-semibold text-brand-foreground shadow-[0_8px_24px_-8px_rgb(0_0_0_/_0.2)] transition-shadow hover:bg-brand-hover hover:shadow-[0_12px_28px_-10px_rgb(0_0_0_/_0.28)] dark:shadow-[0_8px_28px_-8px_rgb(0_0_0_/_0.55)] dark:hover:shadow-[0_12px_32px_-10px_rgb(0_0_0_/_0.65)]",
              }),
            )}
          >
            Request Quote
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden size-11 min-h-11 min-w-11 rounded-md",
              overlayNav && "text-white hover:bg-white/10 hover:text-white",
            )}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-sheet"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">
              {mobileOpen ? "Close menu" : "Open menu"}
            </span>
            <IconMenu className="size-8" />
          </Button>
        </div>
      </div>
    </header>
  );
}
