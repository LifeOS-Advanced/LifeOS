import { createElement } from 'react';
import { toast } from 'sonner';
import {
  RewardToast,
  type RewardToastProps,
  type RewardToastIntensity,
  type RewardToastVariant,
} from '@/components/app/RewardToast';

export type { RewardToastIntensity, RewardToastVariant };

export function showRewardToast(props: RewardToastProps) {
  toast.custom(
    id => createElement(RewardToast, {
      ...props,
      onDismiss: () => toast.dismiss(id),
    }),
    {
      duration: props.intensity === 'high' ? 5600 : props.intensity === 'medium' ? 4400 : 3600,
    },
  );
}
