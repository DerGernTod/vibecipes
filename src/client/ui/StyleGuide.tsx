import React from 'react';
import { Button } from './Button.tsx';
import { Chip, TraitChip } from './Chip.tsx';
import { Field, Input } from './Field.tsx';
import { Panel } from './Panel.tsx';
import { RecipeCard } from './RecipeCard.tsx';
import { Row } from './Row.tsx';
import './kit.css';

const SAMPLE_IMG = '/__no_such_image__.jpg';

const COLOUR_TOKENS = [
  'bg', 'surface', 'surface-2', 'surface-inset', 'line',
  'text', 'text-soft', 'muted', 'faint',
  'accent', 'accent-strong', 'fill', 'on-fill', 'danger-fill',
  'danger', 'vegan', 'vegetarian', 'omnivore', 'unverified',
];
const TYPE_TOKENS = ['fs-xs', 'fs-sm', 'fs-md', 'fs-lg', 'fs-xl', 'fs-2xl'];
const SPACE_TOKENS = ['space-1', 'space-2', 'space-3', 'space-4', 'space-6', 'space-8', 'space-12'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--space-12)' }}>
      <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--space-4)', color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h2>
      {children}
    </section>
  );
}

/** Dev-only page at /?guide. Renders every kit component and state for visual checks. */
export function StyleGuide() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '7rem var(--gutter) 4rem' }}>
      <h1 style={{ marginBottom: 'var(--space-10)' }}>Kit</h1>

      <Section title="Tokens">
        <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Colour</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          {COLOUR_TOKENS.map((name) => (
            <div key={name} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ height: 56, background: `var(--${name})` }} />
              <div style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>--{name}</div>
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Type scale</h3>
        <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
          {TYPE_TOKENS.map((name) => (
            <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
              <span style={{ width: 90, flexShrink: 0, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>--{name}</span>
              <span style={{ fontSize: `var(--${name})` }}>Fluffy Oat &amp; Blueberry Pancakes</span>
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Spacing</h3>
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {SPACE_TOKENS.map((name) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span style={{ width: 90, flexShrink: 0, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>--{name}</span>
              <span style={{ display: 'block', height: 12, width: `var(--${name})`, background: 'var(--accent)', borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div style={{ marginTop: 'var(--space-3)', maxWidth: 320 }}>
          <Button variant="primary" block>Block</Button>
        </div>
      </Section>

      <Section title="Chips">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <TraitChip trait="VEGAN" />
          <TraitChip trait="VEGETARIAN" />
          <TraitChip trait="OMNIVORE" />
          <TraitChip trait="UNVERIFIED" />
          <Chip tone="parent">Parent: ing_milk</Chip>
          <Chip tone="meta">4 servings</Chip>
        </div>
      </Section>

      <Section title="Recipe cards">
        <Row title="Row with images">
          <RecipeCard title="Fluffy Oat & Blueberry Pancakes" imageUrl="/api/images/none.jpg" servings={4} trait="VEGAN" onClick={() => {}} />
          <RecipeCard title="Truffle Mushroom Risotto" servings={3} trait="VEGETARIAN" onClick={() => {}} />
          <RecipeCard title="Authentic Pork Tonkotsu Ramen" servings={2} trait="OMNIVORE" onClick={() => {}} />
          <RecipeCard title="Untagged dish" servings={2} />
        </Row>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>Image URL {SAMPLE_IMG} is intentionally broken to check the placeholder fallback.</p>
      </Section>

      <Section title="Fields">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', maxWidth: 720 }}>
          <Field label="Recipe title" htmlFor="g-title" hint="Shown on cards and in search.">
            <Input id="g-title" placeholder="e.g. Fluffy Vegan Pancakes" />
          </Field>
          <Field label="Servings" htmlFor="g-serv">
            <Input id="g-serv" type="number" defaultValue={4} />
          </Field>
        </div>
      </Section>

      <Section title="Panels">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <Panel>Default panel</Panel>
          <Panel tone="raised">Raised panel</Panel>
          <Panel tone="inset">Inset panel</Panel>
        </div>
      </Section>
    </div>
  );
}
