"use client";

export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            onClick={() => window.history.back()}>
            <span aria-hidden="true">←</span>
            <span>戻る</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              謝辞
            </h1>
            <p className="text-sm leading-6 text-neutral-300">
              このサイトで利用している祝日データの提供元と、デザイン上の参考元をまとめています。
            </p>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold tracking-[0.12em] text-neutral-400">
              祝日データ
            </h2>
            <div className="flex flex-col gap-2 text-sm leading-7 text-neutral-200">
              <p>
                日本を含む各国の祝日情報は{' '}
                <a
                  href="https://date.nager.at"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  Nager.Date
                </a>{' '}
                を利用しています。
              </p>
              <p>
                韓国の祝日情報は{' '}
                <a
                  href="https://www.data.go.kr/data/15012690/openapi.do"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  data.go.kr (공공데이터포털 한국천문연구원_특일 정보)
                </a>{' '}
                の公開データを利用しています。
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold tracking-[0.12em] text-neutral-400">
              デザイン参考
            </h2>
            <div className="flex flex-col gap-2 text-sm leading-7 text-neutral-200">
              <p>
                ビジュアル表現は
                <span className="text-kanade">音乃瀬奏</span>
                の演出から着想を得ています。
              </p>
              <p>
                参考:{' '}
                <a
                  href="https://www.youtube.com/live/mt8AyISL9Ig?t=1h09m21s"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  【 3D LIVE 】 The First Note 【 #音乃瀬奏生誕祭2025 】
                </a>
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-sm font-semibold tracking-[0.12em] text-neutral-400">
              ソースコード
            </h2>
            <div className="flex flex-col gap-2 text-sm leading-7 text-neutral-200">
              <p>
                このウェブページのソースコードは{" "}
                <a
                  href="https://github.com/Alex4386/asitawagetsuyoubi.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  GitHub
                </a>{' '}
                で確認できます。
              </p>
              <p>
                3D 表現には{' '}
                <a
                  href="https://threejs.org"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  Three.js
                </a>{' '}
                を利用しています。
              </p>
              <p>
                このウェブページは{' '}
                <a
                  href="https://nextjs.org"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  Next.js
                </a>{' '}
                で構築されています。
              </p>
              <p>
                UI の構築には{' '}
                <a
                  href="https://react.dev/?uwu=1"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  React
                </a>{' '}
                を利用しています。
              </p>
              <p>
                スタイリングには{' '}
                <a
                  href="https://tailwindcss.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-white">
                  Tailwind CSS
                </a>{' '}
                を利用しています。
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
