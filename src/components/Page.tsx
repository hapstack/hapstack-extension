import { Logo, Spacer } from '@hapstack/ui'

export const Page = ({ children }: { children: React.ReactNode }) => (
  <main className="grid h-screen min-h-full w-full grid-cols-12 font-sans text-base text-primary antialiased">
    <section className="col-span-12 h-full bg-white px-12 py-6 md:col-span-7">
      <div className="mx-auto w-[400px]">
        <div className="py-6">
          <Logo />
        </div>
        <Spacer size="xl" />
        {children}
      </div>
    </section>

    <div
      className="col-span-5 hidden h-full bg-repeat md:block"
      style={{
        backgroundImage: 'url(/images/bg-pattern-dark.png)',
        backgroundSize: '140px auto',
      }}
    ></div>
  </main>
)
