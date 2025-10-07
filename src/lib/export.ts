export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportGirlsData(girls: any[]) {
  const exportData = girls.map((girl) => ({
    Name: girl.name,
    Age: girl.age,
    Rating: girl.rating,
    Ethnicity: girl.ethnicity || '',
    HairColor: girl.hair_color || '',
    City: girl.location_city || '',
    Country: girl.location_country || '',
    IsActive: girl.is_active ? 'Yes' : 'No',
    TotalSpent: girl.totalSpent,
    TotalNuts: girl.totalNuts,
    TotalTimeMinutes: girl.totalTime,
    CostPerNut: girl.costPerNut,
    TimePerNut: girl.timePerNut,
    CostPerHour: girl.costPerHour,
    EntryCount: girl.entryCount,
  }));

  exportToCSV(exportData, 'cpn_girls_export');
}

export function exportDataEntries(entries: any[], girlName: string) {
  const exportData = entries.map((entry) => ({
    Girl: girlName,
    Date: entry.date,
    AmountSpent: entry.amount_spent,
    DurationMinutes: entry.duration_minutes,
    NumberOfNuts: entry.number_of_nuts,
  }));

  exportToCSV(exportData, `cpn_data_entries_${girlName.toLowerCase().replace(/\s+/g, '_')}`);
}
