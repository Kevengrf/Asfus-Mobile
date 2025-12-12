import Image from 'next/image';

export function AsfusLogo() {
  return (
    <div className="flex items-center">
      <Image
        src="/Logo_ASFUS.svg"
        alt="ASFUS Logo"
        width={150}
        height={60}
        className="h-14 w-auto"
      />
    </div>
  );
}
