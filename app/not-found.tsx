import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

/**
 * Styled with the portfolio's own vocabulary: Sora, the outlined-white
 * headline treatment and the offset-block button from the navbar.
 */
export default function NotFound() {
  return (
    <div className="font-sora min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <p className="font-extrabold text-6xl lg:text-9xl">
        4<span className="text-white text-stroke-black">0</span>4
      </p>

      <h1 className="text-2xl lg:text-4xl mt-6">
        Page <span className="font-extrabold">not found</span>
      </h1>

      <p className="text-[#71717A] font-mono text-sm lg:text-base mt-4 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <Link href="/" className="relative inline-block px-4 py-2 font-medium group mt-10">
        <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-black group-hover:-translate-x-0 group-hover:-translate-y-0" />
        <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-black" />
        <span className="relative text-black group-hover:text-white flex items-center gap-x-3">
          Back to home
        </span>
      </Link>
    </div>
  )
}
