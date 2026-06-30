import { createElement } from 'react'

// Design-system shim for `next/image`. The static design-sync bundle has no
// Next.js image pipeline, so next/image's default export comes through as an
// object and React throws "Element type is invalid". Aliased in via
// .design-sync/tsconfig.json (design-sync build only — the real app is
// unaffected); render a plain <img> with the same src/alt so the pixels show.
type Props = Record<string, unknown>

export default function Image(props: Props) {
  const {
    src,
    alt = '',
    width,
    height,
    fill,
    priority: _priority,
    loader: _loader,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    unoptimized: _unoptimized,
    sizes,
    style,
    ...rest
  } = props as Record<string, any>
  const resolved =
    src && typeof src === 'object' ? (src.src ?? src.default?.src ?? '') : src
  const merged = fill
    ? {
        position: 'absolute',
        inset: 0,
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        ...(style as object),
      }
    : style
  return createElement('img', {
    src: resolved,
    alt,
    width,
    height,
    sizes,
    style: merged,
    ...rest,
  })
}
