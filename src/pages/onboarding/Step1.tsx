import { useEffect, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { GirlForm, GirlFormValue } from '../../components/forms/GirlForm';
import { getStep1, setStep1 } from '../../lib/onboarding/session';

export function Step1() {
  const [form, setForm] = useState<GirlFormValue>(() => {
    const existing = getStep1();
    return existing
      ? { name: existing.name, age: existing.age, ethnicity: existing.ethnicity, hairColor: existing.hairColor, locationCity: existing.locationCity, locationCountry: existing.locationCountry, rating: existing.rating }
      : { name: '', age: '', ethnicity: '', hairColor: '', locationCity: '', locationCountry: '', rating: 6.0 };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    goTo('/step-2');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl mb-2">Add Girl</h1>
        <p className="text-cpn-gray mb-6">Step 1 of 4</p>
        <div className="card-cpn">
          <GirlForm
            value={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitLabel="Continue to Step 2"
          />
        </div>
      </div>
    </div>
  );
}


