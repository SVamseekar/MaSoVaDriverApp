// EU Regulation 1169/2011 — 14 mandatory declarable allergens
export type AllergenType =
  | 'CELERY'
  | 'CEREALS_GLUTEN'
  | 'CRUSTACEANS'
  | 'EGGS'
  | 'FISH'
  | 'LUPIN'
  | 'MILK'
  | 'MOLLUSCS'
  | 'MUSTARD'
  | 'NUTS'
  | 'PEANUTS'
  | 'SESAME'
  | 'SOYA'
  | 'SULPHUR_DIOXIDE';

export const ALLERGEN_SHORT: Record<AllergenType, string> = {
  CELERY: 'Cel',
  CEREALS_GLUTEN: 'Glu',
  CRUSTACEANS: 'Cru',
  EGGS: 'Egg',
  FISH: 'Fish',
  LUPIN: 'Lup',
  MILK: 'Milk',
  MOLLUSCS: 'Mol',
  MUSTARD: 'Mus',
  NUTS: 'Nuts',
  PEANUTS: 'Pnt',
  SESAME: 'Ses',
  SOYA: 'Soy',
  SULPHUR_DIOXIDE: 'SO₂',
};
