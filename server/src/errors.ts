export type ApiErrorCode =
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'internal'
  | 'not_implemented'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function errorBody(error: ApiError | Error) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message } },
    }
  }
  console.error(error)
  return {
    status: 500,
    body: { error: { code: 'internal' as const, message: 'Внутренняя ошибка сервера' } },
  }
}
