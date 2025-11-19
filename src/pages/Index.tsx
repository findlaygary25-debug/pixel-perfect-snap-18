import logo from "@/assets/voice2fire-logo-new.png";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img 
          src={logo} 
          alt="Voice2Fire" 
          className="w-64 h-auto mx-auto mb-6 drop-shadow-2xl"
        />
        <p className="text-xl text-muted-foreground">
          Amplifying righteous voices—watch, pray, give thanks, and create.
        </p>
      </div>
    </div>
  );
};

export default Index;
