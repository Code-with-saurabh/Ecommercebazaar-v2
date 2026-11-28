import { useEffect, useState } from 'react';
import { get } from '../api';
import { formatMoney } from '../utils/money';

export function useShippingPolicy() {
  const [policy, setPolicy] = useState(null);
  useEffect(() => {
    let active = true;
    get('/shipping-policy').then(data => { if (active) setPolicy(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return policy;
}

export function shippingDescription(policy) {
  if (!policy) return 'Shipping is shown at checkout.';
  if (!policy.shippingFlat || !policy.freeShippingOver) return 'Complimentary shipping on all orders.';
  return `Free shipping from ${formatMoney(policy.freeShippingOver)}. ${formatMoney(policy.shippingFlat)} on orders below that.`;
}
