import { useQuery } from "@tanstack/react-query";

interface Account {
  id: string;
  platform: string;
  username: string;
  url: string;
}

export default function SocialMediaPage() {
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/public/social-media"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ak-yellow">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold ak-text mb-4">Sosyal Medya</h1>
      <ul className="space-y-4">
        {accounts?.map((acc) => (
          <li key={acc.id}>
            <a
              href={acc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border rounded-lg p-4 hover:bg-ak-yellow hover:text-white transition-colors"
            >
              {acc.platform}: {acc.username}
            </a>
          </li>
        ))}
        {(!accounts || accounts.length === 0) && (
          <li className="ak-gray">Henüz sosyal medya hesabı eklenmemiş.</li>
        )}
      </ul>
    </div>
  );
}

