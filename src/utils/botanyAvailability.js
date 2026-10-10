export const BOTANY_AVAILABILITY_OPTIONS = [
  { value: 'auto', label: 'Default: Coming soon' },
  { value: 'ready', label: 'Ready now' },
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'preparing', label: 'In preparation' },
  { value: 'paused', label: 'Temporarily paused' },
  { value: 'custom', label: 'Custom label' }
];

const LABELS = {
  coming_soon: 'Coming soon',
  preparing: 'In preparation',
  paused: 'Temporarily paused'
};

export function getBotanyTestAvailability(test, uploadedCount = 0) {
  const status = test.availabilityStatus || 'auto';
  const bankReady = uploadedCount >= test.questionCount && test.questionCount > 0;
  if (status === 'ready' && bankReady) {
    return {
      label: 'Ready now',
      tone: 'ready',
      canStart: true
    };
  }
  return {
    label: status === 'custom' ? test.availabilityLabel?.trim() || 'Coming soon' : LABELS[status] || 'Coming soon',
    tone: status === 'paused' ? 'paused' : 'soon',
    canStart: false
  };
}
