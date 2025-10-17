import { formatCurrency, formatRating } from './calculations';

export interface ShareData {
  type: 'girl' | 'overview' | 'achievement';
  girlName?: string;
  rating?: number;
  costPerNut?: number;
  timePerNut?: number;
  costPerHour?: number;
  totalSpent?: number;
  totalNuts?: number;
  totalTime?: number;
  entryCount?: number;
  overviewStats?: {
    totalGirls: number;
    totalSpent: number;
    totalNuts: number;
    avgCostPerNut: number;
    bestValueGirl?: string;
  };
  achievementTitle?: string;
  achievementDescription?: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
};

export const generateShareImage = async (data: ShareData): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.fillStyle = '#1f1f1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Load and draw the CPN favicon logo at the top center
  let headerHeight = 40;
  try {
    const logo = await loadImage('/CPN fav.png');
    const logoMaxWidth = 60;
    const logoAspectRatio = logo.width / logo.height;
    const logoWidth = logoMaxWidth;
    const logoHeight = logoWidth / logoAspectRatio;
    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = 40;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    headerHeight = logoY + logoHeight + 20;
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  // Add "My CPN (Cost Per Nut)" title below logo
  ctx.fillStyle = '#f2f661';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('My CPN (Cost Per Nut)', canvas.width / 2, headerHeight + 30);
  headerHeight += 60;

  // Reset text alignment for other content
  ctx.textAlign = 'left';

  if (data.type === 'girl' && data.girlName) {
    ctx.fillStyle = '#f2f661';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(data.girlName, 60, headerHeight + 40);

    ctx.fillStyle = '#ababab';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Rating: ${formatRating(data.rating || 0)}`, 60, headerHeight + 80);

    let yPos = headerHeight + 140;
    const metrics = [
      { label: 'Cost per Nut', value: formatCurrency(data.costPerNut || 0) },
      { label: 'Time per Nut', value: `${Math.round(data.timePerNut || 0)} min` },
      { label: 'Cost per Hour', value: formatCurrency(data.costPerHour || 0) },
      { label: 'Total Spent', value: formatCurrency(data.totalSpent || 0) },
      { label: 'Total Nuts', value: `${data.totalNuts || 0}` },
      { label: 'Total Time', value: `${Math.round((data.totalTime || 0) / 60)} hrs` },
      { label: 'Sessions', value: `${data.entryCount || 0}` },
    ];

    const col1X = 60;
    const col2X = 620;
    const rowHeight = 70;

    metrics.forEach((metric, index) => {
      const xPos = index % 2 === 0 ? col1X : col2X;
      const row = Math.floor(index / 2);
      const y = yPos + row * rowHeight;

      ctx.fillStyle = '#ababab';
      ctx.font = '22px sans-serif';
      ctx.fillText(metric.label, xPos, y);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(metric.value, xPos, y + 40);
    });
  } else if (data.type === 'overview' && data.overviewStats) {
    let yPos = headerHeight + 40;
    const stats = [
      { label: 'Total Girls Tracked', value: `${data.overviewStats.totalGirls}` },
      { label: 'Total Spent', value: formatCurrency(data.overviewStats.totalSpent) },
      { label: 'Total Nuts', value: `${data.overviewStats.totalNuts}` },
      { label: 'Avg Cost per Nut', value: formatCurrency(data.overviewStats.avgCostPerNut) },
    ];

    // Use 2-column layout for better space utilization
    const col1X = 60;
    const col2X = 620;
    const rowHeight = 90;

    stats.forEach((stat, index) => {
      const xPos = index % 2 === 0 ? col1X : col2X;
      const row = Math.floor(index / 2);
      const y = yPos + row * rowHeight;

      ctx.fillStyle = '#ababab';
      ctx.font = '24px sans-serif';
      ctx.fillText(stat.label, xPos, y);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(stat.value, xPos, y + 45);
    });

    // Position "Best Value" below the stats grid
    if (data.overviewStats.bestValueGirl) {
      const bestValueY = yPos + Math.ceil(stats.length / 2) * rowHeight + 20;

      ctx.fillStyle = '#f2f661';
      ctx.font = '24px sans-serif';
      ctx.fillText('Best Value:', col1X, bestValueY);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(data.overviewStats.bestValueGirl, col1X, bestValueY + 40);
    }
  } else if (data.type === 'achievement') {
    ctx.fillStyle = '#f2f661';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('🏆', 60, headerHeight + 60);

    ctx.fillStyle = '#f2f661';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(data.achievementTitle || 'Achievement Unlocked!', 180, headerHeight + 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    wrapText(ctx, data.achievementDescription || '', 60, headerHeight + 130, 1080, 45);
  }

  // Call-to-action section at the bottom
  const ctaY = canvas.height - 130;

  // "Discover your Cost Per Nut now" text
  ctx.fillStyle = '#ababab';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Discover your Cost Per Nut now', canvas.width / 2, ctaY);

  // "Discover your CPN" button
  const buttonWidth = 300;
  const buttonHeight = 50;
  const buttonX = (canvas.width - buttonWidth) / 2;
  const buttonY = ctaY + 15;

  // Button background
  ctx.fillStyle = '#f2f661';
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

  // Button text
  ctx.fillStyle = '#1f1f1f';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Discover your CPN', canvas.width / 2, buttonY + 33);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image'));
      }
    }, 'image/png');
  });
};

export const downloadImage = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const shareImage = async (blob: Blob, title: string, text: string) => {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], 'cpn-stats.png', { type: 'image/png' });
    const shareData = {
      title,
      text,
      files: [file],
    };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    }
  }
  return false;
};
