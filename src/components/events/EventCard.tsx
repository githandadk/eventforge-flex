import { Calendar, MapPin, Users, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  imageUrl?: string;
  price: {
    min: number;
    max: number;
  };
  capacity: number;
  registered: number;
  category: string;
  featured: boolean;
  registrationDeadline: string;
  status: 'open' | 'closing-soon' | 'full' | 'past';
}

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (min: number, max: number) => {
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'closing-soon':
        return <Badge variant="destructive">Closing Soon</Badge>;
      case 'full':
        return <Badge variant="secondary">Full</Badge>;
      case 'past':
        return <Badge variant="outline">Past Event</Badge>;
      default:
        return <Badge variant="default">Open</Badge>;
    }
  };

  const spotsLeft = event.capacity - event.registered;
  const isLowCapacity = spotsLeft <= 10 && spotsLeft > 0;

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-card-hover animate-fade-in ${
      event.featured ? 'ring-2 ring-event-featured/20 bg-gradient-card' : ''
    }`}>
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-card">
          {event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-hero flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary-foreground/70" />
            </div>
          )}
          
          {/* Status and Featured badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {event.featured && (
              <Badge className="bg-event-featured text-white">Featured</Badge>
            )}
            {getStatusBadge(event.status)}
          </div>

          {/* Price */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
              <DollarSign className="w-3 h-3 mr-1" />
              {formatPrice(event.price.min, event.price.max)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">
              {event.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(event.date)}
              {event.endDate && ` - ${formatDate(event.endDate)}`}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              {event.location}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              {event.registered} / {event.capacity} registered
              {isLowCapacity && (
                <span className="ml-2 text-warning font-medium">
                  Only {spotsLeft} spots left!
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline">{event.category}</Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Deadline: {formatDate(event.registrationDeadline)}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/events/${event.id}`}>
              View Details
            </Link>
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-primary hover:opacity-90" 
            disabled={event.status === 'full' || event.status === 'past'}
            asChild
          >
            <Link to={`/events/${event.id}/register`}>
              {event.status === 'full' ? 'Full' : 'Register Now'}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;