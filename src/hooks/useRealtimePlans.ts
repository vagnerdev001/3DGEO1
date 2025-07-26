import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { BuildingPlan } from '../types/plan.types';
import { planService } from '../services/planService';

interface UseRealtimePlansOptions {
  projectId: string;
  onPlanUpdate?: (plan: BuildingPlan) => void;
  onPlanDelete?: (planId: string) => void;
}

export const useRealtimePlans = ({ 
  projectId, 
  onPlanUpdate, 
  onPlanDelete 
}: UseRealtimePlansOptions) => {
  const [plans, setPlans] = useState<BuildingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BuildingPlan | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [loading, setLoading] = useState(true);

  // Load initial plans
  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const result = await planService.getPlansByProject(projectId);
        if (result.success && result.data) {
          setPlans(result.data);
          if (result.data.length > 0 && !selectedPlan) {
            setSelectedPlan(result.data[0]);
          }
        }
      } catch (error) {
        console.error('Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadPlans();
    }
  }, [projectId]);

  // Initialize real-time subscription
  useEffect(() => {
    if (!projectId) return;

    setSyncStatus('connecting');
    
    const planChannel = supabase
      .channel(`project-${projectId}-plans`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'building_plans',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Plan change detected:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            try {
              const result = await planService.getPlanWithDetails(payload.new.id);
              if (result.success && result.data) {
                setPlans(current => {
                  const exists = current.find(p => p.id === result.data!.id);
                  if (exists) {
                    return current.map(p => p.id === result.data!.id ? result.data! : p);
                  }
                  return [...current, result.data!];
                });
                onPlanUpdate?.(result.data);
              }
            } catch (error) {
              console.error('Error handling plan update:', error);
            }
          } else if (payload.eventType === 'DELETE') {
            setPlans(current => current.filter(p => p.id !== payload.old.id));
            if (selectedPlan?.id === payload.old.id) {
              setSelectedPlan(null);
            }
            onPlanDelete?.(payload.old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_metrics'
        },
        async (payload) => {
          // Update metrics for affected plan
          const planId = payload.new?.plan_id || payload.old?.plan_id;
          if (planId) {
            try {
              const result = await planService.getPlanWithDetails(planId);
              if (result.success && result.data) {
                setPlans(current => 
                  current.map(p => 
                    p.id === planId ? { ...p, metrics: result.data!.metrics } : p
                  )
                );
                
                if (selectedPlan?.id === planId) {
                  setSelectedPlan(prev => prev ? { ...prev, metrics: result.data!.metrics } : null);
                }
              }
            } catch (error) {
              console.error('Error handling metrics update:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_buildings'
        },
        async (payload) => {
          // Update buildings for affected plan
          const planId = payload.new?.plan_id || payload.old?.plan_id;
          if (planId) {
            try {
              const result = await planService.getPlanWithDetails(planId);
              if (result.success && result.data) {
                setPlans(current => 
                  current.map(p => 
                    p.id === planId ? result.data! : p
                  )
                );
                
                if (selectedPlan?.id === planId) {
                  setSelectedPlan(result.data);
                }
              }
            } catch (error) {
              console.error('Error handling buildings update:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setSyncStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    setChannel(planChannel);

    return () => {
      if (planChannel) {
        supabase.removeChannel(planChannel);
      }
    };
  }, [projectId, onPlanUpdate, onPlanDelete, selectedPlan]);

  // Broadcast plan selection to other components
  const selectPlan = useCallback((plan: BuildingPlan | null) => {
    setSelectedPlan(plan);
    
    if (channel && plan) {
      channel.send({
        type: 'broadcast',
        event: 'plan_selected',
        payload: { 
          planId: plan.id,
          planName: plan.plan_name,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [channel]);

  const refreshPlans = useCallback(async () => {
    try {
      const result = await planService.getPlansByProject(projectId);
      if (result.success && result.data) {
        setPlans(result.data);
      }
    } catch (error) {
      console.error('Error refreshing plans:', error);
    }
  }, [projectId]);

  return {
    plans,
    selectedPlan,
    selectPlan,
    syncStatus,
    loading,
    refreshPlans
  };
};