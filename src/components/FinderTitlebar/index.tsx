export default function FinderTitlebar() {
  return (
    <div className="flex items-center h-9 px-4 bg-[#E8E8ED] border-b border-[#D1D1D6] rounded-t-xl select-none">
      {/* Traffic lights */}
      <div className="flex items-center gap-2.5">
        <span className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
        <span className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DEA123]" />
        <span className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]" />
      </div>
    </div>
  )
}
