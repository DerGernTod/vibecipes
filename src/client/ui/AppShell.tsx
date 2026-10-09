import React from 'react';

interface AppShellProps {
  brand: React.ReactNode;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Fixed top bar (brand, primary nav, actions) and the main content area below it. */
export function AppShell({ brand, nav, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-bar__start">
          {brand}
          {nav && <nav className="app-bar__nav" aria-label="Primary">{nav}</nav>}
        </div>
        {actions && <div className="app-bar__end">{actions}</div>}
      </header>
      <main>{children}</main>
    </div>
  );
}

interface NavLinkProps {
  current?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/** Top-bar navigation item. `current` marks the active view with aria-current. */
export function NavLink({ current = false, onClick, children }: NavLinkProps) {
  return (
    <button type="button" className="nav-link" aria-current={current ? 'page' : undefined} onClick={onClick}>
      {children}
    </button>
  );
}
