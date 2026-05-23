import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">L</div>
            <span className="text-lg font-bold text-foreground">LifeOS</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 LifeOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
