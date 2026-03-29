"use client";

import { useAuth } from "@/components/auth/auth-context";
import { BymedLogo } from "@/components/brand/bymed-logo";
import { useCart } from "@/components/cart/cart-context";
import { CurrencySelector } from "@/components/currency/currency-selector";
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
        className="pointer-events-none absolute left-1/2 top-full z-[70] mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {label}
      </span>
    </div>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
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
  surface,
}: {
  href: string;
  label: string;
  surface: "brand" | "glass";
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "group relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
        surface === "glass"
          ? active
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
          : active
            ? "text-white"
            : "text-white/90 hover:text-white",
      )}
      aria-current={pathname === href ? "page" : undefined}
    >
      {label}
      <span
        className={cn(
          "absolute bottom-1 left-3 right-3 h-0.5 origin-left rounded-full transition-transform duration-200 ease-out",
          surface === "glass" ? "bg-primary" : "bg-white",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
        aria-hidden
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currencySelectHeaderId = useId();
  const currencySelectDrawerId = useId();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  const surface: "brand" | "glass" = scrolled ? "glass" : "brand";

  const iconBtnClass =
    surface === "glass"
      ? "relative inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      : "relative inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background,box-shadow,border-color] duration-300",
        surface === "glass"
          ? "glass-header-scrolled shadow-premium-sm"
          : "border-black/10 bg-brand text-white shadow-[0_4px_0_0_#000000]",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden",
              surface === "brand" && "text-white hover:bg-white/10",
            )}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-sheet"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">
              {mobileOpen ? "Close menu" : "Open menu"}
            </span>
            <IconMenu />
          </Button>
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
                      placeholder="Search products…"
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
                          ? "bg-primary/10 text-primary"
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
                    className: "mt-3 justify-center",
                  })}
                >
                  Get a Quote
                </Link>
              </nav>
              <div className="border-t border-border p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Currency
                </p>
                <CurrencySelector
                  variant="drawer"
                  selectId={currencySelectDrawerId}
                />
              </div>
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

          <Link
            href="/"
            className="inline-flex min-w-0 shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="ByMed Medical and Scientific — home"
            onClick={closeMobile}
          >
            <BymedLogo variant="header" priority />
          </Link>
        </div>

        <nav
          className="hidden flex-1 justify-center gap-0.5 lg:flex xl:gap-1"
          aria-label="Primary"
        >
          {primaryNavLinks.map(({ href, label }) => (
            <PrimaryNavLink
              key={href}
              href={href}
              label={label}
              surface={surface}
            />
          ))}
        </nav>

        <form
          action="/products"
          method="get"
          role="search"
          className="mx-auto hidden min-w-0 max-w-md flex-1 md:flex lg:max-w-xs xl:max-w-md"
        >
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div
            className={cn(
              "flex w-full overflow-hidden rounded-lg border shadow-inner transition-colors",
              surface === "glass"
                ? "border-border bg-muted/40"
                : "border-white/20 bg-white/10",
            )}
          >
            <Input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search products…"
              autoComplete="off"
              className={cn(
                "h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0",
                surface === "glass"
                  ? "text-foreground placeholder:text-muted-foreground"
                  : "text-white placeholder:text-white/60",
              )}
            />
            <button
              type="submit"
              className={cn(
                "flex items-center px-3 transition-colors",
                surface === "glass"
                  ? "text-muted-foreground hover:bg-muted"
                  : "text-white hover:bg-white/10",
              )}
              aria-label="Submit search"
            >
              <IconSearch />
            </button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "sm", className: "hidden sm:inline-flex" }),
              surface === "glass"
                ? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-white/35 bg-white/10 text-white hover:bg-white/20",
            )}
          >
            Get a Quote
          </Link>

          <HeaderIconHint label="Currency">
            <CurrencySelector
              variant={
                surface === "glass" ? "headerIconSurface" : "headerIcon"
              }
              selectId={currencySelectHeaderId}
            />
          </HeaderIconHint>

          <HeaderIconHint label="Cart">
            <Link
              href="/cart"
              className={iconBtnClass}
              aria-label="Cart"
            >
              <IconCart />
              {totalItems > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold leading-none text-brand dark:bg-primary dark:text-primary-foreground">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              ) : null}
            </Link>
          </HeaderIconHint>

          <HeaderIconHint label="Account">
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

          <HeaderIconHint label="Theme">
            <ThemeToggle
              variant={surface === "glass" ? "default" : "header"}
            />
          </HeaderIconHint>
        </div>
      </div>
    </header>
  );
}
