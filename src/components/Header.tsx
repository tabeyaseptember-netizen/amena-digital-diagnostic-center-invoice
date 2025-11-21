export const Header = () => {
  return (
    <header className="medical-gradient text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <img 
                src="/logo.jpg" 
                alt="Amena Diagnostic Center Logo" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Amena Diagnostic Center</h1>
              <p className="text-sm text-white/90">Premium Healthcare Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
