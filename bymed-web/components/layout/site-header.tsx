"use client";

import { useAuth } from "@/components/auth/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { primaryNavLinks } from "@/lib/site-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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

function IconClose({ className }: { className?: string }) {
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
      <path d="M18 6 6 18M6 6l12 12" />
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

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavId = useId();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

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

  const navLinkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-white/20 text-white"
        : "text-white/90 hover:bg-white/10 hover:text-white"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-brand text-brand-foreground shadow-[0_4px_0_0_#000000]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
        <button
          type="button"
          className="inline-flex rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls={mobileNavId}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          {mobileOpen ? <IconClose /> : <IconMenu />}
        </button>

        <Link
          href="/"
          className="flex min-w-0 flex-1 flex-col leading-tight lg:flex-none"
          onClick={closeMobile}
        >
          <span className="text-lg font-semibold tracking-tight sm:text-xl">
            ByMed
          </span>
          <span className="hidden text-xs text-white/90 sm:block">
            Medical &amp; Scientific
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
        >
          {primaryNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={navLinkClass(href)}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <form
          action="/search"
          method="get"
          role="search"
          className="mx-auto hidden min-w-0 max-w-md flex-1 md:flex"
        >
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div className="flex w-full overflow-hidden rounded-lg border border-white/20 bg-white/10 shadow-inner">
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search products…"
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/40"
            />
            <button
              type="submit"
              className="flex items-center px-3 text-white hover:bg-white/10"
              aria-label="Submit search"
            >
              <IconSearch />
            </button>
          </div>
        </form>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/cart"
            className="relative rounded-md p-2 text-white hover:bg-white/10"
            aria-label="Shopping cart"
          >
            <IconCart />
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md p-2 text-white hover:bg-white/10 sm:px-2"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              <IconUser />
              <span className="hidden max-w-[8rem] truncate text-left text-sm font-medium sm:inline">
                {isLoading ? "…" : user?.name ?? "Account"}
              </span>
              <IconChevronDown className="hidden opacity-80 sm:block" />
              <span className="sr-only">Account menu</span>
            </button>

            {userMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-background py-1 text-foreground shadow-lg"
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

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed bottom-0 left-0 right-0 top-14 z-40 bg-black/40 sm:top-[4.5rem] lg:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <nav
            id={mobileNavId}
            className="fixed bottom-0 left-0 top-14 z-50 flex w-[min(20rem,88vw)] flex-col border-r border-border bg-background text-foreground shadow-xl sm:top-[4.5rem] lg:hidden"
            aria-label="Mobile primary"
          >
            <div className="border-b border-border p-3">
              <form action="/search" method="get" role="search">
                <label htmlFor="site-search-mobile" className="sr-only">
                  Search products
                </label>
                <div className="flex overflow-hidden rounded-lg border border-border bg-muted/30">
                  <input
                    id="site-search-mobile"
                    name="q"
                    type="search"
                    placeholder="Search products…"
                    autoComplete="off"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                  />
                  <button
                    type="submit"
                    className="flex items-center px-3 text-foreground hover:bg-muted"
                    aria-label="Submit search"
                  >
                    <IconSearch className="text-muted-foreground" />
                  </button>
                </div>
              </form>
            </div>
            <ul className="flex flex-col gap-0.5 p-3">
              {primaryNavLinks.map(({ href, label }) => {
                const active =
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      aria-current={active ? "page" : undefined}
                      onClick={closeMobile}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-2 border-t border-border pt-2">
                <Link
                  href="/cart"
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={closeMobile}
                >
                  Cart
                </Link>
              </li>
              {!user ? (
                <li>
                  <Link
                    href="/login"
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={closeMobile}
                  >
                    Sign in
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      href="/account"
                      className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={closeMobile}
                    >
                      My account
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        closeMobile();
                        void logout();
                      }}
                    >
                      Sign out
                    </button>
                  </li>
                </>
              )}
            </ul>
            <div className="mt-auto border-t border-border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Theme
              </p>
              <div className="rounded-md bg-brand p-2">
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
