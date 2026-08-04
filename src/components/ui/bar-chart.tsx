"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function BarChart() {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        label: 'Curah Hujan (mm)',
        data: [345, 310, 280, 150, 80, 45, 20, 15, 40, 120, 210, 290],
        backgroundColor: '#0A84FF',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1b1c1c',
        titleFont: { family: 'Inter', size: 14 },
        bodyFont: { family: 'Inter', size: 14 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
          drawBorder: false, // Updated for chart.js v4 (previously drawBorder)
        },
        border: {
          display: false,
        },
        ticks: {
          font: { family: 'Inter' },
          color: '#414754',
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: { family: 'Inter' },
          color: '#414754',
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Bar data={data} options={options} />
    </div>
  );
}
