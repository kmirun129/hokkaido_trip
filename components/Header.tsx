export default function Header() {
  return (
    <header className="relative overflow-hidden">
      <div className="hero-gradient min-h-56 flex flex-col items-center justify-center px-6 py-10 text-white relative">
        {/* 装飾円 */}
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative text-center z-10">
          <div className="text-sm font-medium tracking-widest text-white/80 mb-2 uppercase">
            Hokkaido Trip
          </div>
          <h1 className="text-4xl font-bold mb-3 drop-shadow-sm">
            🌿 北海道旅行
          </h1>
          <p className="text-white/90 text-base font-medium">
            2025年 夏の旅 ･ 4日間
          </p>
          <div className="mt-4 flex gap-3 justify-center flex-wrap">
            {['絶景', 'グルメ', '体験', '自然'].map((tag) => (
              <span
                key={tag}
                className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
