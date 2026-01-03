Review all staged changes (`git diff --cached`) with focus on these contexts:

## Application Context (src/app/, src/components/, src/lib/)

**Code Quality:**
- Does the code follow existing patterns in the codebase?
- Are components properly typed with TypeScript?
- Is error handling appropriate with user feedback?

**React & Next.js 15:**
- Are React hooks used correctly (dependencies, cleanup)?
- Is `'use client'` directive used appropriately?
- Are Server Components vs Client Components split correctly?
- Is state management appropriate (local vs context)?

**UI Consistency:**
- Are Flowbite React components used consistently?
- Do Tailwind classes follow existing patterns?
- Is dark mode properly supported?

**Security:**
- Are there XSS vulnerabilities (dangerouslySetInnerHTML, unescaped user input)?
- Is authentication checked before rendering protected content?
- Is sensitive data exposed to the client unnecessarily?

## API & Server Actions Context (src/app/api/, src/app/actions/)

- Are API routes properly authenticated via RoboSystems Client?
- Is input validation in place?
- Are errors handled gracefully with appropriate status codes?
- Do server actions have proper error boundaries?
- Is the RoboSystems Client used correctly for API calls?

## Middleware Context (src/middleware.ts)

- Are route protections correct?
- Is session validation handled properly?
- Are redirects configured correctly?

## Testing Context (src/**/__tests__/)

- Do new components have corresponding tests?
- Are tests using React Testing Library patterns correctly?
- Is test coverage maintained for critical paths?

## Deployment Context (.github/workflows/, cloudformation/)

- Are environment variables and secrets correctly referenced?
- Is the build configuration correct?
- Are there any breaking changes to the deployment process?
- Do CloudFormation changes require stack updates?

## Output

Provide a summary with:
1. **Issues**: Problems that should be fixed before commit
2. **Suggestions**: Improvements that aren't blocking
3. **Questions**: Anything unclear that needs clarification
