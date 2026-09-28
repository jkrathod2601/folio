import Boom from '@hapi/boom'
import { IMAGE_CONTENT_TYPES } from '../models/imageField.js'

/**
 * Raw image upload handling, shared by every image route.
 *
 * Covers and character portraits differ only in their cap and their noun, so
 * the allowlist, the empty check, the buffered-length re-check and the
 * `size === data.length` invariant all live here rather than being restated
 * per route. Restating them is how the cover route ends up rejecting PDF while
 * the portrait route happily stores one.
 */

/** Strip parameters and casing noise from a content-type header. */
export function normalizeContentType(header) {
  return String(header ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
}

/**
 * Validate a buffered upload body and return a ready-to-assign subdocument.
 *
 * `payload.maxBytes` on the route is the first line of defence — it rejects on
 * the declared content-length before the body is buffered. The buffered length
 * is re-checked here because a chunked request can lie about, or omit, that
 * header, and by this point the bytes are already in memory.
 *
 * @param {Buffer} data
 * @param {string} rawContentType
 * @param {{ maxBytes: number, label: string }} opts
 * @returns {{ data: Buffer, contentType: string, size: number, updatedAt: Date }}
 * @throws  Boom 415 / 400 / 413
 */
export function readImageUpload(data, rawContentType, { maxBytes, label }) {
  const contentType = normalizeContentType(rawContentType)

  if (!IMAGE_CONTENT_TYPES.includes(contentType)) {
    throw Boom.unsupportedMediaType(
      `${label} must be one of: ${IMAGE_CONTENT_TYPES.join(', ')}`,
    )
  }

  if (!Buffer.isBuffer(data) || data.length === 0) {
    throw Boom.badRequest(`${label} is empty`)
  }

  if (data.length > maxBytes) {
    throw Boom.entityTooLarge(`${label} must be under ${maxBytes} bytes`)
  }

  return { data, contentType, size: data.length, updatedAt: new Date() }
}

/** The `payload` block every raw image route shares. */
export function rawImagePayload(maxBytes) {
  return {
    parse: false,
    output: 'data',
    // Rejects on content-length before buffering, so an oversized upload never
    // lands in memory.
    maxBytes,
  }
}
