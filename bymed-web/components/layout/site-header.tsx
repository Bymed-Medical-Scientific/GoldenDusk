"use client";

import { useAuth } from "@/components/auth/auth-context";
import { useCart } from "@/components/cart/cart-context";
import { CurrencySelector } from "@/components/currency/currency-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { primaryNavLinks } from "@/lib/site-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Hover / focus-visible label for icon-only header controls (pointer users see text; aria-label stays on control). */
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
    <div className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-[70] mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
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

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavId = useId();
  const currencySelectHeaderId = useId();
  const currencySelectDrawerId = useId();

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
      {/* Utility row: icon-only; label on hover / focus-within */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-1 px-4 py-2">
          <HeaderIconHint label="Currency">
            <CurrencySelector
              variant="headerIcon"
              selectId={currencySelectHeaderId}
            />
          </HeaderIconHint>
          <HeaderIconHint label="Cart">
            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Cart"
            >
              <IconCart />
              {totalItems > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold leading-none text-brand">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              ) : null}
            </Link>
          </HeaderIconHint>
          <HeaderIconHint label="Account">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
          </HeaderIconHint>
          <HeaderIconHint label="Theme">
            <ThemeToggle variant="header" />
          </HeaderIconHint>
        </div>
      </div>

      {/* Main row: logo (left), primary nav (true center), search (right) */}
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:col-start-1 lg:justify-self-start">
          <button
            type="button"
            className="inline-flex shrink-0 rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls={mobileNavId}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>

          <Link
            href="/"
            className="flex min-w-0 flex-col leading-tight"
            onClick={closeMobile}
          >
            <span className="text-lg font-semibold tracking-tight sm:text-xl">
              ByMed
            </span>
            <span className="hidden text-xs text-white/90 sm:block">
              Medical &amp; Scientific
            </span>
          </Link>
        </div>

        <nav
          className="hidden items-center justify-center gap-0.5 lg:col-start-2 lg:flex lg:justify-self-center xl:gap-1"
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
          action="/products"
          method="get"
          role="search"
          className="flex min-w-0 w-full max-w-none lg:col-start-3 lg:w-full lg:max-w-md lg:justify-self-end xl:max-w-lg"
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
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed bottom-0 left-0 right-0 top-[7.75rem] z-40 bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <nav
            id={mobileNavId}
            className="fixed bottom-0 left-0 top-[7.75rem] z-50 flex w-[min(20rem,88vw)] flex-col border-r border-border bg-background text-foreground shadow-xl lg:hidden"
            aria-label="Mobile primary"
          >
            <div className="border-b border-border p-3">
              <form action="/products" method="get" role="search">
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
            <div className="border-b border-border p-3">
              <CurrencySelector
                variant="drawer"
                selectId={currencySelectDrawerId}
              />
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
              <div className="flex justify-start rounded-md bg-brand p-2">
                <ThemeToggle variant="header" />
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
