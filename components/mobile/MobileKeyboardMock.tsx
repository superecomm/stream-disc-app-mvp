"use client";

export function MobileKeyboardMock() {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["shift", "Z", "X", "C", "V", "B", "N", "M", "delete"],
  ];

  return (
    <div className="mt-3 rounded-[28px] border border-gray-200 bg-[#d9dce4] p-3 shadow-inner">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="mb-2 flex justify-center gap-1 last:mb-0">
          {row.map((key) => (
            <button
              key={key}
              className={`h-10 min-w-[34px] rounded-[12px] bg-white text-sm font-semibold text-gray-900 shadow ${
                key === "shift" || key === "delete" ? "px-4" : "px-3"
              }`}
            >
              {key === "shift" ? "⇧" : key === "delete" ? "⌫" : key}
            </button>
          ))}
        </div>
      ))}
      <div className="mt-2 flex items-center gap-2">
        <button className="flex h-10 w-14 items-center justify-center rounded-[12px] bg-white text-base shadow">😊</button>
        <button className="flex h-10 w-14 items-center justify-center rounded-[12px] bg-white text-base shadow">123</button>
        <button className="flex h-10 flex-1 items-center justify-center rounded-[12px] bg-white text-base font-semibold text-gray-900 shadow">
          space
        </button>
        <button className="flex h-10 w-20 items-center justify-center rounded-[12px] bg-white text-base font-semibold text-gray-900 shadow">
          return
        </button>
      </div>
    </div>
  );
}

