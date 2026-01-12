import FloatingElementsVariant from '@/components/landing/FloatingElementsVariant'

export default function AwsInfrastructure() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-black via-zinc-950 to-black py-20 sm:py-28">
      <FloatingElementsVariant variant="os-aws" />

      {/* Top border accent */}
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z" />
            </svg>
            Optional: Production Deployment
          </div>
          <h2 className="font-heading mb-6 text-4xl font-bold text-white sm:text-5xl">
            Deploy to AWS
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-300">
            Ready for production? GitHub Actions and CloudFormation templates
            provide complete AWS infrastructure automation
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* CloudFormation */}
          <div className="group overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-purple-950/20 transition-all hover:border-purple-500/50">
            <div className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0L1.75 6v12L12 24l10.25-6V6L12 0zm0 1.775L20.25 6.8v10.4L12 22.225 3.75 17.2V6.8L12 1.775z" />
                    <path d="M12 4.5L6 7.5v9l6 3 6-3v-9l-6-3zm0 1.5l4.5 2.25v6.75L12 17.25 7.5 15v-6.75L12 6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    AWS CloudFormation
                  </h3>
                  <p className="text-gray-400">
                    Infrastructure as Code Templates
                  </p>
                </div>
              </div>

              <p className="mb-6 text-gray-300">
                Complete AWS infrastructure defined as code. Deploy a
                production-ready environment with auto-scaling, load balancing,
                and managed services in minutes.
              </p>

              <div className="mb-6 space-y-3">
                <h4 className="text-lg font-semibold text-white">
                  Included Resources:
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    ECS Fargate API with ALB
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    EC2 hosted graph database clusters with auto-scaling
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    ECS Fargate Dagster orchestration with Spot capacity
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    RDS (Aurora) PostgreSQL with multi-AZ deployment
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    ElastiCache Valkey for caching
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    S3 buckets for data lake and backup storage
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    DynamoDB for instance/graph/volume registry
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    Lambda functions for management and monitoring
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    CloudWatch, Prometheus, and Grafana observability
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    VPC, CloudTrail, Route 53 DNS, and VPC Flow Logs
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    WAF for API protection
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-purple-400">✓</span>
                    Secrets Manager for credential management
                  </li>
                </ul>
              </div>

              <a
                href="https://github.com/RoboFinSystems/robosystems/tree/main/cloudformation"
                className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                View CloudFormation Templates →
              </a>
            </div>
          </div>

          {/* GitHub Actions */}
          <div className="group overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-cyan-950/20 transition-all hover:border-cyan-500/50">
            <div className="p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    GitHub Actions CI/CD
                  </h3>
                  <p className="text-gray-400">
                    Automated Deployment Pipelines
                  </p>
                </div>
              </div>

              <p className="mb-6 text-gray-300">
                CI/CD pipeline that orchestrates CloudFormation stacks for
                deployments. The production workflow automatically deploys your
                entire infrastructure stack to AWS.
              </p>

              <div className="mb-6 space-y-3">
                <h4 className="text-lg font-semibold text-white">
                  Integrated Deployment Pipeline:
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    Secure OIDC authentication - no AWS credentials in GitHub
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    CloudFormation stack deployment workflows for infrastructure
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    Production and staging environments deployments
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    Release management workflow for automated versioning,
                    changelog generation, and release deployment
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    AI-assisted feature development workflow of PR reviews
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    GitHub Action deployment status monitoring
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    GitHub-hosted runners (free for public repos)
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    Test suite validation before infrastructure deployment
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    Docker image building and ECR push
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-cyan-400">✓</span>
                    Lambda function packaging and deployment
                  </li>
                </ul>
              </div>

              <a
                href="https://github.com/RoboFinSystems/robosystems/tree/main/.github/workflows"
                className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
              >
                View GitHub Actions Workflows →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
