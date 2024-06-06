import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex-1 flex justify-center">
      <div
        className="logo rounded-full opacity-100 px-3 py-1"
        style={{ backgroundColor: "rgba(158, 84, 255, 0.15)" }}
      >
        <div className="filter-hue-rotate-0 rounded-full opacity-100">
          <div className="flex items-center filter-hue-rotate-0 rounded-full opacity-100">
            <Image
              decoding="async"
              sizes="32px"
              src="/lightning-logo.avif"
              alt="Logo"
              width={15} // Adjust the size as needed
              height={15} // Adjust the size as needed
              className="block object-center object-cover"
            />
            <h2
              className="font-mono text-sm leading-normal text-center text-purple-900"
              style={{ color: "var(--extracted-1of0zx5, rgb(163, 85, 255))" }}
            >
              file organizer 2000
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
