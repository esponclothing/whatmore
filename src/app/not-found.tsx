import Link from "next/link";
import { MessageSquare, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="relative max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-500/10">
          <MessageSquare size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-full">
            404 • Page Not Found
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Lost in Automation?
          </h1>
          <p className="text-sm text-slate-400">
            The page you are looking for does not exist, has been moved, or is under a different workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/whatsapp/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all shadow-md shadow-indigo-600/30"
          >
            <Home size={16} /> WhatsApp Dashboard
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

