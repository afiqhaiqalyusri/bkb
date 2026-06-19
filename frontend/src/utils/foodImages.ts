/**
 * Maps menu item categories and names to high-quality Unsplash food photography.
 * Avoids toy-like emojis for a premium, commercial restaurant SaaS appearance.
 */
export const getFoodImage = (category: string, name?: string): string => {
  const normCat = (category || '').toLowerCase().trim();
  const normName = (name || '').toLowerCase().trim();

  // Beverages & Drinks
  if (
    normCat.includes('drink') || 
    normCat.includes('beverage') || 
    normName.includes('milo') || 
    normName.includes('tea') || 
    normName.includes('coffee') || 
    normName.includes('air') || 
    normName.includes('water')
  ) {
    return 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=400';
  }

  // Oblong Burgers / Sub Sandwiches
  if (normCat.includes('oblong') || normName.includes('oblong')) {
    return 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=400';
  }

  // Sides, Fries, Snacks
  if (
    normCat.includes('side') || 
    normCat.includes('fries') || 
    normCat.includes('snack') || 
    normName.includes('fries') || 
    normName.includes('nugget') || 
    normName.includes('kentang')
  ) {
    return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400';
  }

  // Desserts
  if (
    normCat.includes('dessert') || 
    normName.includes('ice cream') || 
    normName.includes('waffle') || 
    normName.includes('cake')
  ) {
    return 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=400';
  }

  // Default: Premium Grilled Beef Burger
  return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400';
};
