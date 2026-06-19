export const formatRM = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

export const formatRMCompact = (amount: number): string => {
  if (amount >= 1000) return `RM ${(amount / 1000).toFixed(1)}k`;
  return `RM ${amount.toFixed(2)}`;
};
