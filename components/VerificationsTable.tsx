type Verification = {
  assetId: string;
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
  createdAt: string;
};

type VerificationsTableProps = {
  verifications: Verification[];
};

const gradeColors = {
  A: "text-green-400",
  B: "text-blue-400",
  C: "text-yellow-400",
  D: "text-red-400",
};

export function VerificationsTable({ verifications }: VerificationsTableProps) {
  if (verifications.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-8 text-center text-slate-400">
        No verifications yet. Start verifying assets to see them here.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Asset ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Serial
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {verifications.map((verification, index) => (
              <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {new Date(verification.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {verification.assetId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {(verification.similarityScore * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-bold ${gradeColors[verification.grade]}`}
                  >
                    {verification.grade}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                  {verification.serial}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

