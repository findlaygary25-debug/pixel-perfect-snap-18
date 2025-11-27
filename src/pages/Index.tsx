import logo from "@/assets/voice2fire-logo-new.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      {/* CENTER CONTENT */}
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <img
          src={logo}
          alt="Voice2Fire"
          className="w-56 mb-6 drop-shadow-md"
        />

        <p className="text-xl font-semibold text-gray-700 max-w-md leading-relaxed">
          Amplifying righteous voices — watch, pray, give thanks, and create.
        </p>
      </div>
    </div>
  );
};

export default Index;
