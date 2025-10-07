import { useEffect, useState } from 'react';
import { goTo } from '../../lib/navigation';
import { DataEntryForm, DataEntryFormValue } from '../../components/forms/DataEntryForm';
import { getStep1, getStep2, setStep2 } from '../../lib/onboarding/session';

export function Step2() {
  const [form, setForm] = useState<DataEntryFormValue>(() => {
    const existing = getStep2();
    return existing
      ? { date: existing.date, amountSpent: existing.amountSpent, hours: existing.hours, minutes: existing.minutes, numberOfNuts: existing.numberOfNuts }
      : { date: new Date().toISOString().split('T')[0], amountSpent: '', hours: '', minutes: '', numberOfNuts: '' };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Gate: require step 1
    const s1 = getStep1();
    if (!s1) {
      goTo('/step-1');
    }
  }, []);

  useEffect(() => {
    setStep2({ ...form, v: 1 });
  }, [form]);

  const handleSubmit = () => {
    setError('');
    const totalMinutes = parseInt(form.hours || '0') * 60 + parseInt(form.minutes || '0');
    const amount = parseFloat(form.amountSpent || '0');
    const nuts = parseInt(form.numberOfNuts || '0');

    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0');
      return;
    }
    if (nuts < 0) {
      setError('Number of nuts cannot be negative');
      return;
    }
    if (amount < 0) {
      setError('Amount spent cannot be negative');
      return;
    }
    setLoading(true);
    setStep2({ ...form, v: 1 });
    goTo('/step-3');
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl mb-2">Add Data</h1>
        <p className="text-cpn-gray mb-6">Step 2 of 4</p>
        <div className="card-cpn">
          <DataEntryForm
            value={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            submitLabel="Continue to Step 3"
            showPreview={false}
          />
        </div>
        <div className="flex justify-between mt-4">
          <button className="btn-secondary" onClick={() => goTo('/step-1')}>Back</button>
        </div>
      </div>
    </div>
  );
}


