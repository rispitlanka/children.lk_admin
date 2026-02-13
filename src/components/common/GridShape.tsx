import Image from "next/image";
import React from "react";

export default function GridShape() {
  return (
    <>
      <div className="absolute right-0 top-0 -z-1 w-full max-w-[250px] xl:max-w-[450px]">
        <Image
          width={540}
          height={254}
          src="https://res.cloudinary.com/dr3dhkvwq/image/upload/v1770912044/childrenlk/super-hero/zxt4uujei9eks2xzdddo.svg"
          alt="grid"
        />
      </div>
      <div className="absolute bottom-0 left-0 -z-1 w-full max-w-[250px] rotate-180 xl:max-w-[450px]">
        <Image
          width={540}
          height={254}
          src="https://res.cloudinary.com/dr3dhkvwq/image/upload/v1770912044/childrenlk/super-hero/zxt4uujei9eks2xzdddo.svg"
          alt="grid"
        />
      </div>
    </>
  );
}
