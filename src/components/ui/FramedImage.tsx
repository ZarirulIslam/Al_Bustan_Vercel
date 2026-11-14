import Image from "next/image";
import { cn } from "@/lib/utils";
import { focusClass, type ImageFit, type ImageFocus } from "@/lib/imageDisplay";

// Fills its (relative, sized) parent with an image, following the
// slide's display settings:
// - cover: fills the frame, cropping around the chosen focus point
// - contain: the whole image is shown, with a blurred, darkened copy
//   filling the empty space so the frame never looks blank.
export function FramedImage({
  src,
  alt,
  fit,
  focus,
  sizes,
  priority,
  unoptimized,
  className,
}: {
  src: string;
  alt: string;
  fit: ImageFit;
  focus: ImageFocus;
  sizes: string;
  priority?: boolean;
  unoptimized?: boolean;
  className?: string;
}) {
  if (fit === "contain") {
    return (
      <>
        <Image
          src={src}
          alt=""
          aria-hidden="true"
          fill
          sizes="10vw"
          unoptimized={unoptimized}
          className="scale-110 object-cover blur-2xl brightness-75"
        />
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className={cn("object-contain", className)}
        />
      </>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      className={cn("object-cover", focusClass(focus), className)}
    />
  );
}
