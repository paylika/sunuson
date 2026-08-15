import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-8 text-center">
      <div className="text-[64px] font-semibold leading-none text-grad">404</div>
      <p className="mt-3 text-[14px] text-fg/55">
        Cette page n&apos;existe pas ou l&apos;artiste a changé de lien.
      </p>
      <Button href="/" className="mt-6 w-full">
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
