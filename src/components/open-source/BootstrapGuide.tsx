import FloatingElementsVariant from '@/components/landing/FloatingElementsVariant'

export default function BootstrapGuide() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-black via-zinc-950 to-black py-20 sm:py-28">
      <FloatingElementsVariant variant="os-aws" />

      {/* Top border accent */}
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Fork & Deploy
          </div>
          <h2 className="font-heading mb-6 text-4xl font-bold text-white sm:text-5xl">
            Bootstrap Your Fork
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-300">
            Deploy your own RoboSystems instance with secure GitHub OIDC
            authentication. No AWS credentials stored in GitHub - just fork,
            bootstrap, and deploy.
          </p>
        </div>

        {/* OIDC Security Diagram */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-emerald-950/20 p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                Secure GitHub OIDC Federation
              </h3>
              <p className="text-gray-400">
                No AWS credentials stored anywhere
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="font-semibold text-white">No Secrets</span>
              </div>
              <p className="text-sm text-gray-400">
                No long-term AWS credentials stored in GitHub
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="font-semibold text-white">Scoped Access</span>
              </div>
              <p className="text-sm text-gray-400">
                Credentials scoped to specific repo/branch
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold text-white">Short Sessions</span>
              </div>
              <p className="text-sm text-gray-400">
                1-hour max session - minimal exposure window
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Prerequisites */}
          <div className="overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-blue-950/20 p-8">
            <h3 className="mb-6 text-xl font-bold text-white">Prerequisites</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-medium text-blue-400">
                  1
                </span>
                <div>
                  <span className="font-medium text-white">
                    AWS IAM Identity Center (SSO)
                  </span>
                  <p className="text-sm text-gray-400">
                    Enabled with admin permissions
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-medium text-blue-400">
                  2
                </span>
                <div>
                  <span className="font-medium text-white">CLI Tools</span>
                  <p className="text-sm text-gray-400">
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      aws
                    </code>{' '}
                    CLI v2,{' '}
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      gh
                    </code>{' '}
                    CLI,{' '}
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      jq
                    </code>
                    ,{' '}
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      direnv
                    </code>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-medium text-blue-400">
                  3
                </span>
                <div>
                  <span className="font-medium text-white">GitHub Auth</span>
                  <p className="text-sm text-gray-400">
                    Token with{' '}
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      repo
                    </code>
                    ,{' '}
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      admin:org
                    </code>
                    ,{' '}
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                      workflow
                    </code>{' '}
                    scopes
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-6 rounded-lg bg-zinc-800/50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-300">
                Quick Install (macOS)
              </h4>
              <pre className="overflow-x-auto text-xs text-gray-400">
                <code>{`brew install awscli gh jq direnv`}</code>
              </pre>
            </div>
          </div>

          {/* Bootstrap Command */}
          <div className="overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-emerald-950/20 p-8">
            <h3 className="mb-6 text-xl font-bold text-white">
              Bootstrap in 3 Commands
            </h3>

            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-900/80 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-medium text-emerald-400">
                    1
                  </span>
                  <span className="text-sm font-medium text-white">
                    Configure AWS SSO
                  </span>
                </div>
                <pre className="overflow-x-auto text-xs text-cyan-300">
                  <code>aws configure sso --profile robosystems-sso</code>
                </pre>
              </div>

              <div className="rounded-lg bg-zinc-900/80 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-medium text-emerald-400">
                    2
                  </span>
                  <span className="text-sm font-medium text-white">
                    Run Bootstrap
                  </span>
                </div>
                <pre className="overflow-x-auto text-xs text-cyan-300">
                  <code>just bootstrap</code>
                </pre>
              </div>

              <div className="rounded-lg bg-zinc-900/80 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-medium text-emerald-400">
                    3
                  </span>
                  <span className="text-sm font-medium text-white">
                    Deploy to Production
                  </span>
                </div>
                <pre className="overflow-x-auto text-xs text-cyan-300">
                  <code>just deploy prod</code>
                </pre>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-300">
                <strong>What bootstrap creates:</strong> OIDC Identity Provider,
                IAM Roles, ECR Repository, GitHub Variables, and AWS Secrets
                Manager entries - all automated.
              </p>
            </div>
          </div>
        </div>

        {/* API Access Modes */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-cyan-950/20 p-8">
          <h3 className="mb-6 text-xl font-bold text-white">
            API Access Modes
          </h3>
          <p className="mb-6 text-gray-400">
            Choose how your API is accessed - from private development to full
            production with custom domains.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-zinc-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs font-medium text-gray-300">
                  internal
                </span>
                <span className="text-xs text-gray-500">Default</span>
              </div>
              <h4 className="mb-1 font-semibold text-white">
                Development Mode
              </h4>
              <p className="mb-3 text-sm text-gray-400">
                Internal ALB with bastion tunnel
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>+ No domain required</li>
                <li>+ Secure private access</li>
                <li>+ SSM port forwarding</li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-700 bg-zinc-800/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                  public-http
                </span>
              </div>
              <h4 className="mb-1 font-semibold text-white">Quick Public</h4>
              <p className="mb-3 text-sm text-gray-400">
                Internet-facing ALB without TLS
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>+ No domain required</li>
                <li>+ Fast testing access</li>
                <li>- No HTTPS encryption</li>
              </ul>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  public
                </span>
                <span className="text-xs text-emerald-500">Recommended</span>
              </div>
              <h4 className="mb-1 font-semibold text-white">Production</h4>
              <p className="mb-3 text-sm text-gray-400">
                Full HTTPS with custom domain
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>+ ACM certificates auto-generated</li>
                <li>+ Route 53 DNS auto-configured</li>
                <li>+ OAuth integrations work</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-zinc-800/50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-300">
              Switch to Public Mode
            </h4>
            <pre className="overflow-x-auto text-xs text-gray-400">
              <code>{`gh variable set API_ACCESS_MODE_PROD --body "public"
gh variable set API_DOMAIN_NAME_ROOT --body "yourdomain.com"
gh variable set API_DOMAIN_NAME_PROD --body "api.yourdomain.com"
just deploy prod`}</code>
            </pre>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://github.com/RoboFinSystems/robosystems/wiki/Bootstrap-Guide"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 font-medium text-white transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Full Bootstrap Guide in Wiki
          </a>
        </div>
      </div>
    </section>
  )
}
