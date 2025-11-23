// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface SubscriptionData {
  planName: string;
  planTier: string;
  isFree: boolean;
  status: string;
  isTrial: boolean;
  daysRemaining: number | null;
  limits: {
    maxStaff: number;
    maxCampaigns: number;
    maxStorageGb: number;
  };
  usage: {
    currentStaff: number;
    currentCampaigns: number;
    currentStorageGb: number;
  };
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/my-subscription');
      setSubscription(response.data.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = async (limitType: string) => {
    try {
      const response = await api.post('/subscriptions/check-limit', { limitType });
      return response.data.data;
    } catch (error) {
      console.error('Failed to check limit:', error);
      throw error;
    }
  };

  const checkFeature = async (featureName: string) => {
    try {
      const response = await api.post('/subscriptions/check-feature', { featureName });
      return response.data.data.hasAccess;
    } catch (error) {
      console.error('Failed to check feature:', error);
      return false;
    }
  };

  return {
    subscription,
    loading,
    checkLimit,
    checkFeature,
    reload: loadSubscription,
  };
}

 
// function CampaignList() {
//   const { subscription, checkLimit } = useSubscription();

//   const handleCreateCampaign = async () => {
//     try {
//       const limit = await checkLimit('campaigns');
      
//       if (!limit.canAdd) {
//         alert(`You have reached your campaign limit (${limit.maxLimit}). Please upgrade.`);
//         return;
//       }

//       // Proceed with campaign creation
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div>
//       <button onClick={handleCreateCampaign}>Create Campaign</button>
//       {subscription && (
//         <div>
//           <p>Plan: {subscription.planName}</p>
//           <p>Campaigns: {subscription.usage.currentCampaigns} / {subscription.limits.maxCampaigns}</p>
//         </div>
//       )}
//     </div>
//   );
// }