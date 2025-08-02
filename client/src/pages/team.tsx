import { useQuery } from "@tanstack/react-query";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
}

export default function TeamPage() {
  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/public/team"],
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
      <h1 className="text-2xl font-bold ak-text mb-4">Ekibimiz</h1>
      <ul className="space-y-4">
        {members?.map((m) => (
          <li key={m.id} className="border-b pb-2">
            <div className="font-semibold ak-text">
              {m.firstName} {m.lastName}
            </div>
            <div className="ak-gray">{m.role}</div>
            <a href={`tel:${m.phone}`} className="text-ak-blue underline">
              {m.phone}
            </a>
          </li>
        ))}
        {(!members || members.length === 0) && (
          <li className="ak-gray">Henüz ekip üyesi eklenmemiş.</li>
        )}
      </ul>
    </div>
  );
}

