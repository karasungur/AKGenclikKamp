import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface Settings {
  showProgram: boolean;
  showPhotos: boolean;
  showSocial: boolean;
  showTeam: boolean;
  programTitle: string;
  photosTitle: string;
  socialTitle: string;
  teamTitle: string;
}

export default function HomePage() {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/public/settings"],
  });

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ak-yellow">Yükleniyor...</div>
      </div>
    );
  }

  const items = [
    { title: "Moderatör Girişi", href: "/login" },
  ];

  if (settings.showProgram) {
    items.push({ title: settings.programTitle, href: "/program" });
  }
  if (settings.showPhotos) {
    items.push({ title: settings.photosTitle, href: "/photos" });
  }
  if (settings.showSocial) {
    items.push({ title: settings.socialTitle, href: "/social-media" });
  }
  if (settings.showTeam) {
    items.push({ title: settings.teamTitle, href: "/team" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ak-yellow/10 to-ak-blue/10">
      <div className="grid gap-4 w-full max-w-md mx-4 text-center">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className="block bg-white py-4 px-6 rounded-lg shadow-lg border border-ak-yellow hover:bg-ak-yellow hover:text-white transition-colors">
              {item.title}
            </a>
          </Link>
        ))}
        {items.length === 1 && (
          <p className="ak-gray mt-4">Şu anda yalnızca moderatör girişi aktif.</p>
        )}
      </div>
    </div>
  );
}

