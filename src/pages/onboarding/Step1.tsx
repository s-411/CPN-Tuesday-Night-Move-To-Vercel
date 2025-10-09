import { useEffect, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { GirlForm, GirlFormValue } from '../../components/forms/GirlForm';
import { getStep1, setStep1 } from '../../lib/onboarding/session';
import { OnboardingLayout } from '../../components/OnboardingLayout';

export function Step1() {
  const [form, setForm] = useState<GirlFormValue>(() => {
    const existing = getStep1();
    return existing
      ? { name: existing.name, age: existing.age, ethnicity: existing.ethnicity, hairColor: existing.hairColor, locationCity: existing.locationCity, locationCountry: existing.locationCountry, rating: existing.rating }
      : { name: '', age: '', ethnicity: '', hairColor: '', locationCity: '', locationCountry: '', rating: 6.0 };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Persist on change for resilience
    setStep1({ ...form, v: 1 });
  }, [form]);

  const handleSubmit = () => {
    setError('');
    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 18) {
      setError('Age must be 18 or older');
      return;
    }
    setLoading(true);
    setStep1({ ...form, v: 1 });
    setSuccess(true);
    
    // Auto-redirect to next step
    setTimeout(() => {
      goTo('/step-2');
    }, 800);
  };

  return (
    <OnboardingLayout step={1}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl mb-2">Add Girl</h1>
        <p className="text-cpn-gray mb-6">Enter the girl's profile information</p>
        
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <span>✓</span> Saved! Moving to next step...
            </p>
          </div>
        )}
        
        <div className="card-cpn">
          <GirlForm
            value={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            loading={loading || success}
            error={error}
            submitLabel={success ? 'Redirecting...' : 'Continue'}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}


