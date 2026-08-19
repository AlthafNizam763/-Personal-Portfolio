import Image from 'next/image'
import { isGifUrl, isVectorUrl } from '@/lib/upload-limits'

/**
 * Wrapper that routes each image to the right renderer.
 *
 * Raster images (uploads, screenshots, logos) go through next/image so they
 * get AVIF/WebP conversion, responsive srcsets and lazy loading. SVGs, GIFs
 * and data URIs are emitted as plain <img>: the optimizer passes vectors and
 * animated frames through untouched, so routing them through it would only add
 * a round trip — and a GIF that lost its animation would be a broken asset,
 * not a slower one.
 *
 * `width`/`height` describe the intrinsic aspect ratio only — layout is driven
 * by `className`, which is what keeps the migrated markup pixel-identical.
 */
export default function MediaImage({
  src,
  alt,
  className = '',
  width = 1200,
  height = 900,
  priority = false,
  sizes = '(max-width: 1024px) 100vw, 50vw',
  unoptimized,
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  unoptimized?: boolean
}) {
  if (!src) return null

  const skipsOptimizer = isVectorUrl(src) || isGifUrl(src) || src.startsWith('data:')

  if (skipsOptimizer) {
    // Vectors and animated GIFs gain nothing from the image optimizer, so they
    // skip next/image.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
    />
  )
}
