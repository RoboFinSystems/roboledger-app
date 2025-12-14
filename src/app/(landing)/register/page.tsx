import RegisterForm from './content'

export default function RegisterPage() {
  return (
    <>
      <div>
        <section className="bg-zinc-900">
          <div className="mx-auto flex h-screen flex-col items-center justify-center px-6 py-8 lg:py-0">
            <RegisterForm />
          </div>
        </section>
      </div>
    </>
  )
}
