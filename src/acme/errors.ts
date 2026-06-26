import type { AcmeProblem } from './types.ts'

export class AcmeError extends Error {
  public readonly problem: AcmeProblem
  public readonly statusCode?: number

  constructor(problem: AcmeProblem, statusCode?: number) {
    const msg = problem.detail || problem.title || problem.type
    super(`ACME error: ${msg}`)
    this.name = 'AcmeError'
    this.problem = problem
    this.statusCode = statusCode ?? problem.status
  }

  static fromResponse(status: number, body: string): AcmeError {
    try {
      const problem = JSON.parse(body) as AcmeProblem
      return new AcmeError(problem, status)
    } catch {
      return new AcmeError({ type: 'about:blank', detail: body }, status)
    }
  }
}
