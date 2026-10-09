import React from 'react';

interface RowProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** Titled horizontal scroller. Children should be fixed-width tiles (e.g. RecipeCard). */
export function Row({ title, action, children }: RowProps) {
  return (
    <section className="row">
      <div className="row__head">
        <h2 className="row__title">{title}</h2>
        {action}
      </div>
      <div className="row__track">{children}</div>
    </section>
  );
}
