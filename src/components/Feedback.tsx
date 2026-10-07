import { type ReactNode } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';

export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 className={`animate-spin text-slate-400 ${className}`} style={{ width: size, height: size }} />;
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Spinner size={32} className="mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-slide-up">
      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-600 text-sm font-medium">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-slide-up">
      <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-sm font-medium">
          Dismiss
        </button>
      )}
    </div>
  );
}
