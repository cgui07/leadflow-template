import Image from "next/image";

interface BrandLogoProps {
  alt: string;
  className?: string;
  height: number;
  priority?: boolean;
  src: string;
  width: number;
}

function isLocalAssetSource(src: string): boolean {
  return src.startsWith("/");
}

export function BrandLogo({
  alt,
  className,
  height,
  priority = false,
  src,
  width,
}: BrandLogoProps) {
  if (isLocalAssetSource(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={`${width}px`}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
