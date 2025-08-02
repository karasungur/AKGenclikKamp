import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Event {
  id: string;
  startsAt: string;
  title: string;
}

export default function ProgramPage() {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/public/events"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ak-yellow">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold ak-text mb-4">Program Akışı</h1>
      <ul className="space-y-4">
        {events?.map((event) => (
          <li key={event.id} className="border-b pb-2">
            <div className="font-semibold ak-text">
              {format(new Date(event.startsAt), "d MMMM yyyy, HH:mm", { locale: tr })}
            </div>
            <div className="ak-gray">{event.title}</div>
          </li>
        ))}
        {(!events || events.length === 0) && (
          <li className="ak-gray">Henüz etkinlik eklenmemiş.</li>
        )}
      </ul>
    </div>
  );
}

