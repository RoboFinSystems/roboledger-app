interface FloatingElementsVariantProps {
  variant?:
    | 'default'
    | 'hero'
    | 'features'
    | 'report-creator'
    | 'output-formats'
    | 'ai-reporting'
    | 'platform'
    | 'opensource'
    | 'final'
}

export default function FloatingElementsVariant({
  variant = 'default',
}: FloatingElementsVariantProps) {
  switch (variant) {
    case 'hero':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute top-0 right-1/4 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 blur-3xl"></div>
          <div className="animate-float-slower absolute -bottom-40 -left-40 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-fuchsia-600/15 to-pink-600/15 blur-3xl"></div>
          <div className="animate-float absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600/10 to-indigo-600/10 blur-3xl"></div>
        </div>
      )

    case 'features':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"></div>
          <div className="animate-float-slow absolute right-1/4 -bottom-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl"></div>
        </div>
      )

    case 'report-creator':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"></div>
          <div className="animate-float-slower absolute right-1/4 -bottom-20 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"></div>
          <div className="animate-float absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/5 blur-3xl"></div>
        </div>
      )

    case 'output-formats':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute top-0 left-1/2 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-600/10 to-purple-600/10 blur-3xl"></div>
          <div className="animate-float-slow absolute bottom-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-fuchsia-600/12 to-pink-600/12 blur-3xl"></div>
        </div>
      )

    case 'ai-reporting':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-600/15 to-purple-600/15 blur-3xl"></div>
          <div className="animate-float-slower absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-fuchsia-600/15 to-pink-600/15 blur-3xl"></div>
          <div className="animate-float absolute top-3/4 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-600/10 to-indigo-600/10 blur-3xl"></div>
        </div>
      )

    case 'platform':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -top-20 right-1/4 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-purple-600/12 to-violet-600/12 blur-3xl"></div>
          <div className="animate-float-slow absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-green-600/8 to-emerald-600/8 blur-3xl"></div>
        </div>
      )

    case 'opensource':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute -top-20 right-1/3 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-600/12 to-purple-600/12 blur-3xl"></div>
          <div className="animate-float absolute bottom-0 left-0 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-green-600/10 to-emerald-600/10 blur-3xl"></div>
          <div className="animate-float-slower absolute top-1/2 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-fuchsia-600/8 to-pink-600/8 blur-3xl"></div>
        </div>
      )

    case 'final':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slower absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 blur-3xl"></div>
        </div>
      )

    default:
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float-slow absolute top-20 left-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"></div>
          <div className="animate-float-slower absolute right-10 bottom-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"></div>
          <div className="animate-float absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"></div>
        </div>
      )
  }
}
