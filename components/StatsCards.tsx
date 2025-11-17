type StatsCardsProps = {
  totalVerifications: number;
  uniqueAssetsCount: number;
};

export function StatsCards({ totalVerifications, uniqueAssetsCount }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
        <h3 className="text-slate-400 text-sm font-medium mb-2">
          Total Verifications
        </h3>
        <p className="text-3xl font-bold text-emerald-400">
          {totalVerifications}
        </p>
      </div>
      <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
        <h3 className="text-slate-400 text-sm font-medium mb-2">
          Unique Assets
        </h3>
        <p className="text-3xl font-bold text-emerald-400">
          {uniqueAssetsCount}
        </p>
      </div>
    </div>
  );
}

