/**
 * failAction for routes with `validate`.
 *
 * Hapi's default failAction (`'error'`) throws the generic
 * "Invalid request payload input" error and discards the detailed one — the
 * one carrying `output.payload.validation.keys`, the list of fields that
 * actually failed. A UI that cannot see those keys can only show a dead-end
 * message, so every validated route uses this instead.
 *
 * Hapi hands the detailed error to the failAction as its first argument
 * (see `toolkit.failAction`); throwing it routes it through the normal error
 * path, where the error plugin serializes `validation.keys` into the body.
 */
export const detailedFailAction = (request, h, err) => {
  throw err
}
