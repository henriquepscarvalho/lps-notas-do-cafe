// O script do AdSense carrega site-wide no root layout (app/layout.tsx).
// Este layout fica como passagem pra nao pedir o mesmo script duas vezes.
export default function ArtigosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
