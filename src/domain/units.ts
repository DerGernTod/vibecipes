export function scaleQuantity(quantity: number, scaleFactor: number): number {
  return quantity * scaleFactor;
}

export function translateUnit(unit: string, lang: string): string {
  if (lang === 'de') {
    if (unit.toLowerCase() === 'tsp') return 'TL';
    if (unit.toLowerCase() === 'tbsp') return 'EL';
    if (unit.toLowerCase() === 'cup') return 'Tasse'; // or maybe just cup
  }
  return unit;
}

export interface ConvertedResult {
  amount: number;
  unit: string;
}

const ML_PER_TSP = 4.92892;
const ML_PER_TBSP = 14.7868;
const ML_PER_CUP = 236.588;
const G_PER_OZ = 28.3495;
const G_PER_LB = 453.592;

export function convertMetricToImperial(amount: number, unit: string, densityGPerMl: number | null): ConvertedResult {
  const normUnit = unit.toLowerCase();
  
  if (normUnit === 'ml') {
    // Volume to Volume
    if (amount < ML_PER_TBSP) {
      return { amount: amount / ML_PER_TSP, unit: 'tsp' };
    } else if (amount < ML_PER_CUP / 2) {
      return { amount: amount / ML_PER_TBSP, unit: 'tbsp' };
    } else {
      return { amount: amount / ML_PER_CUP, unit: 'cup' };
    }
  } else if (normUnit === 'g') {
    // Mass to Mass / Volume
    if (densityGPerMl) {
      // Use volume for imperial if density is known
      const ml = amount / densityGPerMl;
      return convertMetricToImperial(ml, 'ml', null);
    } else {
      // Mass to Mass
      if (amount < G_PER_LB) {
        return { amount: amount / G_PER_OZ, unit: 'oz' };
      } else {
        return { amount: amount / G_PER_LB, unit: 'lb' };
      }
    }
  }
  return { amount, unit };
}

export function convertImperialToMetric(amount: number, unit: string, densityGPerMl: number | null): ConvertedResult {
  const normUnit = unit.toLowerCase();
  
  if (['tsp', 'tbsp', 'cup'].includes(normUnit)) {
    let ml = amount;
    if (normUnit === 'tsp') ml *= ML_PER_TSP;
    if (normUnit === 'tbsp') ml *= ML_PER_TBSP;
    if (normUnit === 'cup') ml *= ML_PER_CUP;
    
    if (densityGPerMl) {
      return { amount: ml * densityGPerMl, unit: 'g' };
    }
    return { amount: ml, unit: 'ml' };
  } else if (['oz', 'lb'].includes(normUnit)) {
    let g = amount;
    if (normUnit === 'oz') g *= G_PER_OZ;
    if (normUnit === 'lb') g *= G_PER_LB;
    return { amount: g, unit: 'g' };
  }
  return { amount, unit };
}

export function convertToSystem(amount: number, unit: string, densityGPerMl: number | null, system: 'metric' | 'imperial'): ConvertedResult {
  const normUnit = unit.toLowerCase();
  const isMetric = ['g', 'kg', 'ml', 'l'].includes(normUnit);
  const isImperial = ['tsp', 'tbsp', 'cup', 'oz', 'lb'].includes(normUnit);
  
  if (system === 'imperial' && isMetric) {
    return convertMetricToImperial(amount, unit, densityGPerMl);
  } else if (system === 'metric' && isImperial) {
    return convertImperialToMetric(amount, unit, densityGPerMl);
  }
  return { amount, unit };
}

function snapToFraction(amount: number): string {
  const whole = Math.floor(amount);
  const remainder = amount - whole;
  
  const snaps = [
    { value: 0, str: '' },
    { value: 1/4, str: '¼' },
    { value: 1/3, str: '⅓' },
    { value: 1/2, str: '½' },
    { value: 2/3, str: '⅔' },
    { value: 3/4, str: '¾' },
    { value: 1, str: '1' }
  ];
  
  let closest = snaps[0];
  let minDiff = Infinity;
  for (const snap of snaps) {
    const diff = Math.abs(remainder - snap.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = snap;
    }
  }
  
  // Very rough rounding margin for snap:
  // If it's too far from a snap, just return decimal
  if (minDiff > 0.1) {
    return amount.toFixed(1).replace(/\.0$/, '');
  }

  let res = '';
  if (closest.value === 1) {
    res = (whole + 1).toString();
  } else {
    res = whole > 0 ? `${whole} ` : '';
    res += closest.str;
    if (res.trim() === '') res = '0';
  }
  
  return res.trim();
}

export function formatIngredientAmount(amount: number, unit: string, lang: string, system: 'metric' | 'imperial' = 'metric'): string {
  const isImperialUnit = ['tsp', 'tbsp', 'cup', 'oz', 'lb'].includes(unit.toLowerCase());
  
  let formattedAmount = amount.toString();
  
  if (isImperialUnit) {
    formattedAmount = snapToFraction(amount);
  } else {
    // Snap metric to 1 decimal point e.g. 14.06 -> 14.1
    formattedAmount = amount.toFixed(1).replace(/\.0$/, '');
  }
  
  const translatedUnit = translateUnit(unit, lang);
  return `${formattedAmount} ${translatedUnit}`.trim();
}
