import React, { useEffect, useState } from 'react';
import { recipeDtoSchema, type CookSession, type RecipeDto, type RecipeStepDto, type RecipeStepIngredientDto } from '../shared/schemas.ts';
import { readJson } from './http.ts';
import { useLanguage } from './LanguageContext.tsx';
import { formatScaledAmount } from '../domain/units.ts';
import {
  dismissTimer,
  extendTimer,
  formatCountdown,
  isTimerFinished,
  remainingMs,
  startTimer,
  TIMER_EXTENSION_MS,
} from '../domain/cookSession.ts';
import { primeCookAlerts } from './cookAlerts.ts';
import { useScreenWakeLock, type WakeLockStatus } from './useScreenWakeLock.ts';
import { Button, Chip } from './ui/index.ts';
import './styles/cookMode.css';

interface CookModeProps {
  session: CookSession;
  /** Current time from the app-level ticker; drives every countdown on screen. */
  now: number;
  onSessionChange: (next: CookSession) => void;
  /** Leaves the full-screen view but keeps the session and its running timers. */
  onExit: () => void;
  /** Discards the session and its timers. */
  onEnd: () => void;
  /** Reached after the last step. Ends the session for now; the pantry deduction flow hooks in here. */
  onFinish: () => void;
}

const createTimerId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function CookMode({ session, now, onSessionChange, onExit, onEnd, onFinish }: CookModeProps) {
  const { t, lang } = useLanguage();
  const [recipe, setRecipe] = useState<RecipeDto | null>(null);
  const [failed, setFailed] = useState(false);
  const wakeLock = useScreenWakeLock();

  useEffect(() => {
    let cancelled = false;
    async function loadRecipe() {
      try {
        const res = await fetch(`/api/recipes/${session.recipeId}`);
        if (!res.ok) throw new Error(`Recipe request failed: ${res.status}`);
        const data = await readJson(res, recipeDtoSchema);
        if (!cancelled) setRecipe(data);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    loadRecipe();
    return () => {
      cancelled = true;
    };
  }, [session.recipeId]);

  const exitBar = (
    <header className="cook-header">
      <Button variant="secondary" size="sm" onClick={onExit}>← {t('Back to Recipe', 'Zurück zum Rezept')}</Button>
      <Button variant="ghost" size="sm" onClick={endSession}>{t('End Session', 'Sitzung beenden')}</Button>
    </header>
  );

  function endSession() {
    if (session.timers.length > 0 && !window.confirm(t('Running timers will be cancelled. End this cooking session?', 'Laufende Timer werden abgebrochen. Kochsitzung beenden?'))) return;
    onEnd();
  }

  if (failed) {
    return (
      <div className="cook">
        {exitBar}
        <div className="page-state page-state--error">{t('Recipe not found', 'Rezept nicht gefunden')}</div>
      </div>
    );
  }
  if (!recipe) {
    return (
      <div className="cook">
        {exitBar}
        <div className="page-state">{t('Loading recipe...', 'Lade Rezept...')}</div>
      </div>
    );
  }

  const steps = recipe.steps;
  const lastIndex = Math.max(0, steps.length - 1);
  const stepIndex = Math.min(session.stepIndex, lastIndex);
  const step: RecipeStepDto | undefined = steps[stepIndex];
  const isLast = stepIndex === lastIndex;
  const factor = session.servings / recipe.servings;
  const anyFinished = session.timers.some(timer => isTimerFinished(timer, now));
  const timers = [...session.timers].sort((a, b) => a.endTime - b.endTime);

  const goToStep = (index: number) => onSessionChange({ ...session, stepIndex: Math.min(Math.max(0, index), lastIndex) });
  const setSystem = (system: CookSession['system']) => onSessionChange({ ...session, system });

  const formatAmount = (amount: number, unit: string, densityGPerMl: number | null | undefined) =>
    formatScaledAmount(amount, unit, densityGPerMl, factor, session.system, lang);
  const ingredientName = (item: RecipeStepIngredientDto) =>
    lang === 'de' && item.ingredient ? item.ingredient.primaryNameDe : (item.ingredient?.primaryNameEn || item.canonicalIngredientId);

  const startStepTimer = (durationSec: number) => {
    primeCookAlerts();
    onSessionChange(startTimer(session, { id: createTimerId(), stepIndex, durationSec, now: Date.now() }));
  };

  const wakeLabel: Record<WakeLockStatus, string> = {
    active: t('Screen Lock Active', 'Bildschirm bleibt an'),
    paused: t('Screen Lock Paused', 'Bildschirmsperre pausiert'),
    unsupported: t('Screen Lock Unsupported', 'Bildschirmsperre nicht unterstützt'),
  };

  const stepTimerSec = step?.timerSec ?? null;

  return (
    <div className={`cook ${anyFinished ? 'cook--alert' : ''}`}>
      <header className="cook-header">
        <Button variant="secondary" size="sm" onClick={onExit}>← {t('Back to Recipe', 'Zurück zum Rezept')}</Button>
        <div className="cook-header__title">
          <span className="cook-header__recipe">{recipe.title}</span>
          <span className="cook-header__step">{t('Step', 'Schritt')} {stepIndex + 1} / {steps.length}</span>
        </div>
        <div className="cook-header__controls">
          <span className={`cook-wake cook-wake--${wakeLock.status}`}>{wakeLabel[wakeLock.status]}</span>
          {wakeLock.status === 'paused' && (
            <Button variant="ghost" size="sm" onClick={wakeLock.retry}>{t('Retry', 'Erneut versuchen')}</Button>
          )}
          <div className="segmented" role="group" aria-label={t('Unit system', 'Maßsystem')}>
            <button type="button" className="segmented__btn" aria-pressed={session.system === 'metric'} onClick={() => setSystem('metric')}>g / ml</button>
            <button type="button" className="segmented__btn" aria-pressed={session.system === 'imperial'} onClick={() => setSystem('imperial')}>tsp / oz</button>
          </div>
          <Button variant="ghost" size="sm" onClick={endSession}>{t('End Session', 'Sitzung beenden')}</Button>
        </div>
      </header>

      <div className="cook-progress" aria-hidden="true">
        <div className="cook-progress__bar" style={{ width: `${steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0}%` }} />
      </div>

      {timers.length > 0 && (
        <section className="cook-timers" aria-label={t('Running timers', 'Laufende Timer')}>
          {timers.map(timer => {
            const finished = isTimerFinished(timer, now);
            return (
              <div key={timer.id} className={`cook-timer ${finished ? 'cook-timer--done' : ''}`}>
                <span className="cook-timer__label">{t('Step', 'Schritt')} {timer.stepIndex + 1}</span>
                <strong className="cook-timer__time">{finished ? t('Done!', 'Fertig!') : formatCountdown(remainingMs(timer, now))}</strong>
                <Button size="sm" variant="secondary" onClick={() => onSessionChange(extendTimer(session, timer.id, TIMER_EXTENSION_MS, Date.now()))}>
                  {t('+2 min', '+2 Min')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onSessionChange(dismissTimer(session, timer.id))}>
                  {finished ? t('Dismiss', 'Schließen') : t('Cancel', 'Abbrechen')}
                </Button>
              </div>
            );
          })}
        </section>
      )}

      <main className="cook-stage">
        {step ? (
          <>
            <p className="cook-step__number">{t('Step', 'Schritt')} {stepIndex + 1}</p>
            <p className="cook-step__text">{step.instruction}</p>

            {step.ingredients.length > 0 && (
              <div className="cook-ingredients">
                {step.ingredients.map((item, index) => (
                  <Chip key={item.id || index} tone="meta" className="cook-ingredients__chip">
                    <strong>{formatAmount(item.amount, item.unit, item.ingredient?.densityGPerMl)}</strong> {ingredientName(item)}
                    {item.preparationNote ? ` (${item.preparationNote})` : ''}
                  </Chip>
                ))}
              </div>
            )}

            {stepTimerSec ? (
              <Button variant="primary" size="lg" className="cook-stage__timer" onClick={() => startStepTimer(stepTimerSec)}>
                ⏱ {t('Start timer', 'Timer starten')} · {formatCountdown(stepTimerSec * 1000)}
              </Button>
            ) : null}
          </>
        ) : (
          <p className="field__hint">{t('No steps added yet.', 'Noch keine Schritte hinzugefügt.')}</p>
        )}

        <details className="cook-all">
          <summary>{t('All ingredients', 'Alle Zutaten')}</summary>
          {recipe.aggregatedIngredients && recipe.aggregatedIngredients.length > 0 ? (
            <ul className="ingredient-list">
              {recipe.aggregatedIngredients.map((item, index) => {
                const name = lang === 'de' && item.ingredient ? item.ingredient.primaryNameDe : (item.ingredient?.primaryNameEn || item.canonicalIngredientId);
                const notes = item.preparationNotes.length > 0 ? ` (${item.preparationNotes.join(', ')})` : '';
                return (
                  <li key={index}>
                    <span className="ingredient-list__amount">{formatAmount(item.totalAmount, item.unit, item.ingredient?.densityGPerMl)}</span>
                    <span>{name}{notes}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="field__hint">{t('No ingredients yet.', 'Noch keine Zutaten.')}</p>
          )}
        </details>
      </main>

      <footer className="cook-nav">
        <Button size="lg" variant="secondary" disabled={stepIndex === 0} onClick={() => goToStep(stepIndex - 1)}>
          ← {t('Previous', 'Zurück')}
        </Button>
        {isLast ? (
          <Button size="lg" variant="primary" onClick={onFinish}>{t('Finish Cooking', 'Kochen beenden')}</Button>
        ) : (
          <Button size="lg" variant="primary" onClick={() => goToStep(stepIndex + 1)}>{t('Next', 'Weiter')} →</Button>
        )}
      </footer>
    </div>
  );
}
