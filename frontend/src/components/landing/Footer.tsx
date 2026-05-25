import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-sm font-bold text-primary-foreground">L</div>
            <span className="text-lg font-bold text-foreground">LifeOS</span>
          </div>
          <div className="flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#testimonials" className="transition-colors hover:text-foreground">Trust</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
            <Link to="/signup" className="transition-colors hover:text-foreground">Start</Link>
          </div>
          <p className="text-sm text-muted-foreground">(c) 2026 LifeOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
