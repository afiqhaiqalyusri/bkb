import { OrderStatus } from '../types';

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'ON_HOLD',
  'INCOMING_ORDER',
  'ACCEPTED',
  'GRILLING',
  'ASSEMBLING',
  'READY',
  'COMPLETED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ON_HOLD:        'Scheduled',
  INCOMING_ORDER: 'In Queue',
  PENDING:        'In Queue',
  ACCEPTED:       'Preparing',
  GRILLING:       'Grilling',
  ASSEMBLING:     'Assembling',
  READY:          'Ready',
  COMPLETED:      'Completed',
  CANCELLED:      'Cancelled',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  ON_HOLD:        'Your order is scheduled on hold and will enter the kitchen queue soon.',
  INCOMING_ORDER: 'Your order is in the kitchen queue (FIFO sequence).',
  PENDING:        'Your order has been received.',
  ACCEPTED:       'Our team has accepted your order!',
  GRILLING:       'Your patty is on the grill. Almost there!',
  ASSEMBLING:     'Putting your burger together with love.',
  READY:          'Your order is ready! Please collect at the counter.',
  COMPLETED:      'Thank you for choosing BKB! 🍔',
  CANCELLED:      'This order has been cancelled.',
};

export const getStatusIndex = (status: OrderStatus): number => {
  if (status === 'PENDING') return 1; // Map legacy PENDING to same step as INCOMING_ORDER
  return ORDER_STATUS_STEPS.indexOf(status);
};

export const estimateWaitTime = (status: OrderStatus): string => {
  const estimates: Partial<Record<OrderStatus, string>> = {
    ON_HOLD:        'Scheduled',
    INCOMING_ORDER: 'In Queue',
    PENDING:        '~15 min',
    ACCEPTED:       '~12 min',
    GRILLING:       '~8 min',
    ASSEMBLING:     '~3 min',
    READY:          'Ready for Pickup!',
  };
  return estimates[status] || '';
};
