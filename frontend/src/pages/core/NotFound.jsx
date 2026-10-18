import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { PageFrame } from '../../components/ui/page';

export default function NotFound() {
  return (
    <PageFrame className="grid place-items-center bg-[radial-gradient(circle_at_18%_0%,rgba(244,114,182,0.15),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-2xl"
      >
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
          <Compass className="h-8 w-8" />
        </div>
        <div className="text-xs uppercase tracking-[0.34em] text-white/40">404</div>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-lg ">
          This route does not exist or has moved. Return home and continue from the main navigation.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200/20  px-5 py-3 font-semibold text-cyan-50 transition hover:bg-cyan-300/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </motion.section>
    </PageFrame>
  );
}
