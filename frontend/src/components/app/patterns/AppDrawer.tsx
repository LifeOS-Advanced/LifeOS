import { ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: 'right' | 'left' | 'top' | 'bottom';
  children: ReactNode;
  footer?: ReactNode;
}

export function AppDrawer({ open, onOpenChange, title, description, side = 'right', children, footer }: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">{children}</div>
        {footer && <div className="border-t border-border pt-4 flex justify-end gap-2">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
