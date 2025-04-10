import Image from 'next/image';

const ArchitectureDiagram = () => {
  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-3xl font-light text-white/90 mb-6">Architecture Diagram</h2>
      <div className="w-full max-w-4xl border border-gray-700 rounded-lg overflow-hidden">
        <Image
          src="/workflow-diagram.svg"
          alt="Cloudflare Workflows Architecture Diagram"
          width={83}
          height={96}
          className="w-full h-auto"
          priority
        />
      </div>
    </div>
  );
};

export default ArchitectureDiagram; 