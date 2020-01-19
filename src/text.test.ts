import '@toba/test'
import { encodeBase64, decodeBase64 } from './'

test('base 64 encodes text', () => {
   expect(encodeBase64('Neque porro quisquam est qui dolorem ipsum')).toBe(
      'TmVxdWUgcG9ycm8gcXVpc3F1YW0gZXN0IHF1aSBkb2xvcmVtIGlwc3Vt'
   )
})

test('base 64 decodes text', () => {
   expect(
      decodeBase64('TmVxdWUgcG9ycm8gcXVpc3F1YW0gZXN0IHF1aSBkb2xvcmVtIGlwc3Vt')
   ).toBe('Neque porro quisquam est qui dolorem ipsum')
})
