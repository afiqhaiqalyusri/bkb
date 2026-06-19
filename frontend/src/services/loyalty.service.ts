import api from './api';
import { ApiResponse, LoyaltyAccount, LoyaltyReward } from '../types';

export const loyaltyService = {
  getAccount: () =>
    api.get<ApiResponse<LoyaltyAccount>>('/api/loyalty/account').then(r => r.data),

  getRewards: () =>
    api.get<ApiResponse<LoyaltyReward[]>>('/api/loyalty/rewards').then(r => r.data),

  redeem: (rewardId: number) =>
    api.post('/api/loyalty/redeem', { rewardId }),
};
