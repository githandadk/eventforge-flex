import { useParams, Link } from "react-router-dom";
import Layout from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  Wifi, 
  Coffee, 
  Car, 
  Utensils,
  Hotel,
  Baby,
  Presentation,
  ArrowLeft,
  Share2,
  Heart
} from "lucide-react";

// Mock data - replace with actual data fetching
const mockEventDetail = {
  id: "1",
  title: "Annual Tech Conference 2024",
  description: "Join industry leaders for cutting-edge insights into technology trends, networking opportunities, and hands-on workshops. This premier event brings together innovators, entrepreneurs, and thought leaders from around the globe.",
  longDescription: `
    <p>The Annual Tech Conference 2024 is the premier gathering for technology professionals, entrepreneurs, and innovators. Over three exciting days, you'll have the opportunity to:</p>
    
    <ul>
      <li>Attend keynote presentations from industry leaders</li>
      <li>Participate in hands-on workshops and technical sessions</li>
      <li>Network with peers and potential collaborators</li>
      <li>Explore the latest products and services at the expo</li>
      <li>Join specialized tracks in AI, Cloud Computing, and Cybersecurity</li>
    </ul>
    
    <p>Whether you're a seasoned professional or just starting your tech journey, this conference offers valuable insights and connections that will advance your career.</p>
  `,
  date: "2024-03-15",
  endDate: "2024-03-17",
  location: "San Francisco Convention Center",
  fullAddress: "747 Howard St, San Francisco, CA 94103",
  imageUrl: null,
  price: { min: 299, max: 599 },
  capacity: 500,
  registered: 347,
  category: "Technology",
  featured: true,
  registrationDeadline: "2024-03-01",
  status: "open" as "open" | "closing-soon" | "full" | "past",
  organizer: {
    name: "TechEvents Global",
    email: "info@techevents.com",
    phone: "+1 (555) 123-4567"
  },
  schedule: [
    { day: "Day 1", title: "Opening & Keynotes", time: "9:00 AM - 6:00 PM" },
    { day: "Day 2", title: "Workshops & Sessions", time: "8:30 AM - 7:00 PM" },
    { day: "Day 3", title: "Expo & Networking", time: "9:00 AM - 5:00 PM" }
  ],
  registrationOptions: [
    {
      id: "basic",
      name: "Basic Pass",
      price: 299,
      description: "Access to all sessions and networking events",
      includes: ["All sessions", "Welcome reception", "Coffee breaks", "Digital materials"]
    },
    {
      id: "premium",
      name: "Premium Pass", 
      price: 449,
      description: "Everything in Basic plus premium perks",
      includes: ["All Basic features", "Premium seating", "VIP networking dinner", "Exclusive workshops", "Welcome gift"]
    },
    {
      id: "vip",
      name: "VIP Pass",
      price: 599,
      description: "Ultimate conference experience",
      includes: ["All Premium features", "Meet & greet with speakers", "Private lounge access", "Personalized schedule", "Post-event resources"]
    }
  ],
  additionalOptions: [
    { id: "hotel", name: "Hotel Accommodation", description: "3 nights at partner hotels", priceRange: "150-300/night" },
    { id: "meals", name: "Meal Package", description: "All meals during conference", price: 120 },
    { id: "airport", name: "Airport Shuttle", description: "Round-trip transportation", price: 45 },
    { id: "childcare", name: "Childcare Service", description: "Professional childcare during event", price: 200 },
    { id: "parking", name: "Parking Pass", description: "Reserved parking for all days", price: 75 }
  ],
  amenities: ["Free WiFi", "Coffee Stations", "Lunch Included", "Parking Available", "Live Streaming", "Networking App"]
};

const EventDetail = () => {
  const { id } = useParams();
  // In a real app, you'd fetch event data based on the ID
  const event = mockEventDetail;

  const spotsLeft = event.capacity - event.registered;
  const isLowCapacity = spotsLeft <= 20;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image and Title */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl h-64 bg-gradient-hero">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-primary-foreground/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex gap-2 mb-2">
                    {event.featured && <Badge className="bg-event-featured">Featured</Badge>}
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                  <p className="text-muted-foreground text-lg">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} - {new Date(event.endDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{event.location}</p>
                      <p className="text-sm text-muted-foreground">{event.fullAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-muted-foreground">
                        {event.registered} / {event.capacity} registered
                        {isLowCapacity && <span className="text-warning ml-2">({spotsLeft} spots left)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Registration Deadline</p>
                      <p className="text-muted-foreground">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Event Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.schedule.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.day}</p>
                        <p className="text-muted-foreground">{item.title}</p>
                      </div>
                      <Badge variant="outline">{item.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.longDescription }}
                />
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {event.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <Wifi className="w-4 h-4 text-primary" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Registration Options
                  <div className="flex items-center gap-1 text-lg font-bold">
                    <DollarSign className="w-5 h-5" />
                    {event.price.min} - {event.price.max}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.registrationOptions.map((option) => (
                  <div key={option.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{option.name}</h4>
                      <span className="font-bold">${option.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {option.includes.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Additional Options</h4>
                  {event.additionalOptions.map((option) => (
                    <div key={option.id} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-muted-foreground text-xs">{option.description}</p>
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap ml-2">
                        {option.price ? `$${option.price}` : option.priceRange}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90" 
                  size="lg"
                  disabled={event.status === 'full'}
                  asChild
                >
                  <Link to={`/events/${event.id}/register`}>
                    {event.status === 'full' ? 'Event Full' : 'Register Now'}
                  </Link>
                </Button>

                {isLowCapacity && (
                  <p className="text-warning text-center text-sm font-medium">
                    ⚠️ Only {spotsLeft} spots remaining!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Event Organizer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{event.organizer.name}</p>
                <p className="text-sm text-muted-foreground">{event.organizer.email}</p>
                <p className="text-sm text-muted-foreground">{event.organizer.phone}</p>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Contact Organizer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;