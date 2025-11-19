import logo from "@/assets/utubchat-logo.png";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img 
          src={logo} 
          alt="UTubChat" 
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
