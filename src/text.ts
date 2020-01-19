import { Encoding } from './index'

/**
 * Decode base-64 string.
 * @see http://www.hacksparrow.com/base64-encoding-decoding-in-node-js.html
 */
export const decodeBase64 = (text: string) =>
   Buffer.from(text, Encoding.Base64).toString()

/**
 * Encode string to base-64.
 * @see https://www.base64encode.org/
 * @see http://www.hacksparrow.com/base64-encoding-decoding-in-node-js.html
 */
export const encodeBase64 = (text: string) =>
   Buffer.from(text).toString(Encoding.Base64)
