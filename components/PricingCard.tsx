import Link from 'next/link';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  popular?: boolean;
  href?: string;
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  buttonText,
  buttonVariant,
  popular = false,
  href = '/login'
}: PricingCardProps) {
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-8 ${
      popular 
        ? 'border-emerald-600 shadow-xl shadow-emerald-600/10' 
        : 'border-gray-200'
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white rounded-full text-sm">
          Most Popular
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl mb-2 text-gray-900">{name}</h3>
        <div className="flex items-baseline justify-center gap-1 mb-1">
          <span className="text-5xl text-gray-900">{price}</span>
          <span className="text-gray-600">/{period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Link 
        href={href}
        className={`block w-full px-6 py-3 rounded-xl transition-all text-center ${
          buttonVariant === 'primary'
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}
