import { isVideoUrl } from '@/lib/upload-limits'
import MediaImage from './MediaImage'

/**
 * Renders whatever the admin put in a media slot.
 *
 * The slots that used to take only an illustration now also accept an MP4 or
 * WebM clip, and the stored value is the only thing that distinguishes them —
 * so the extension decides the element. Everything else (sizing, animation,
 * position in the layout) is driven by `className`, which is what keeps the
 * design identical whichever one is stored.
 *
 * Video autoplays muted, looped and inline: that is the behaviour an animated
 * illustration needs, and `muted` + `playsInline` are what iOS requires before
 * it will autoplay at all rather than showing a still frame with a play button.
 */
export default function Media({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes,
  poster,
  controls = false,
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  /** Still frame shown before a video's first frame is decoded. */
  poster?: string
  controls?: boolean
}) {
  if (!src) return null

  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        poster={poster || undefined}
        autoPlay
        loop
        muted
        playsInline
        controls={controls}
        // `metadata` keeps a phone from pulling the whole clip before it is
        // scrolled into view; autoplay fetches the rest when it starts.
        preload="metadata"
        aria-label={alt}
      />
    )
  }

  return (
    <MediaImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
    />
  )
}
