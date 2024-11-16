import { cn, Heading } from '@theguild/components';

export function PlanComparison({ className }: { className?: string }) {
  return (
    <section className={cn('bg-green-1000 rounded-3xl p-24 text-center', className)}>
      <Heading as="h2" size="md" className="flex items-center justify-center gap-4 text-white">
        Want to compare plans?
        <em className="text-green-1000 rounded-2xl bg-gradient-to-r from-[#C1D3D7] to-blue-500 px-3 py-2 not-italic">
          No need.
        </em>
      </Heading>

      <p className="mt-8 font-medium text-white/80">
        We do not gate any features. All our plans are fully-featured, with access to the community.
        We only charge a premium for support.
      </p>
    </section>
  );
}
