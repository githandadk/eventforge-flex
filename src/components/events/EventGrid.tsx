import EventCard, { Event } from "./EventCard";

interface EventGridProps {
  events: Event[];
  loading?: boolean;
}

const EventGrid = ({ events, loading }: EventGridProps) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-96"></div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎪</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or check back later for new events.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default EventGrid;