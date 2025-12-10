import { TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { Subscription } from '../lib/supabase';

type AnalyticsViewProps = {
  subscriptions: Subscription[];
};

export default function AnalyticsView({ subscriptions }: AnalyticsViewProps) {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

  const categorySpending = activeSubscriptions.reduce((acc, sub) => {
    const monthlyPrice = sub.billing_cycle === 'monthly' ? sub.price : sub.price / 12;
    acc[sub.category] = (acc[sub.category] || 0) + monthlyPrice;
    return acc;
  }, {} as Record<string, number>);

  const topServices = [...activeSubscriptions]
    .sort((a, b) => {
      const aMonthly = a.billing_cycle === 'monthly' ? a.price : a.price / 12;
      const bMonthly = b.billing_cycle === 'monthly' ? b.price : b.price / 12;
      return bMonthly - aMonthly;
    })
    .slice(0, 5);

  const totalMonthly = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);

  const categoryColors: Record<string, string> = {
    Entertainment: 'bg-blue-500',
    Productivity: 'bg-green-500',
    Cloud: 'bg-cyan-500',
    Gaming: 'bg-red-500',
    Reading: 'bg-yellow-500',
    Fitness: 'bg-orange-500',
    Other: 'bg-slate-500',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Analytics & Insights</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Spending by Category</h3>

          <div className="space-y-4">
            {Object.entries(categorySpending)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / totalMonthly) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{category}</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 ${categoryColors[category]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {percentage.toFixed(1)}% of total spending
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Top 5 Most Expensive</h3>
          </div>

          <div className="space-y-4">
            {topServices.map((sub, index) => {
              const monthlyPrice = sub.billing_cycle === 'monthly' ? sub.price : sub.price / 12;
              return (
                <div key={sub.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{sub.service_name}</p>
                    <p className="text-sm text-slate-600">{sub.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(monthlyPrice)}</p>
                    <p className="text-xs text-slate-500">per month</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-slate-900">Key Insights</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <InsightCard
            title="Average Cost per Subscription"
            value={formatCurrency(totalMonthly / activeSubscriptions.length || 0)}
            description="Monthly average across all active subscriptions"
          />

          <InsightCard
            title="Shared Subscriptions"
            value={activeSubscriptions.filter(sub => sub.is_shared).length.toString()}
            description={`Saving ${formatCurrency(
              activeSubscriptions
                .filter(sub => sub.is_shared && sub.shared_with_count)
                .reduce((sum, sub) => {
                  const perPerson = sub.price / (sub.shared_with_count || 1);
                  return sum + (sub.price - perPerson);
                }, 0)
            )} through sharing`}
          />

          <InsightCard
            title="Company-Paid Subscriptions"
            value={activeSubscriptions.filter(sub => sub.paid_by_company).length.toString()}
            description={`${formatCurrency(
              activeSubscriptions
                .filter(sub => sub.paid_by_company)
                .reduce((sum, sub) => {
                  const monthlyPrice = sub.billing_cycle === 'monthly' ? sub.price : sub.price / 12;
                  return sum + monthlyPrice;
                }, 0)
            )} covered by company`}
          />

          <InsightCard
            title="Trial Subscriptions"
            value={subscriptions.filter(sub => sub.status === 'trial').length.toString()}
            description="Remember to cancel before they convert to paid"
            warning
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">Your Subscription Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Active</p>
            <p className="text-4xl font-bold">{activeSubscriptions.length}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Monthly Total</p>
            <p className="text-4xl font-bold">{formatCurrency(totalMonthly)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Yearly Total</p>
            <p className="text-4xl font-bold">{formatCurrency(totalMonthly * 12)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type InsightCardProps = {
  title: string;
  value: string;
  description: string;
  warning?: boolean;
};

function InsightCard({ title, value, description, warning }: InsightCardProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${warning ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
      {warning && <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />}
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold mb-1 ${warning ? 'text-orange-900' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className={`text-sm ${warning ? 'text-orange-700' : 'text-slate-600'}`}>
        {description}
      </p>
    </div>
  );
}
