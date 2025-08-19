import { useState } from "react";
import Layout from "@/components/ui/layout";
import EventGrid from "@/components/events/EventGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Event } from "@/components/events/EventCard";

// Mock data - replace with actual data from your backend
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Annual Tech Conference 2024",
    description: "Join industry leaders for cutting-edge insights into technology trends, networking opportunities, and hands-on workshops.",
    date: "2024-03-15",
    endDate: "2024-03-17",
    location: "San Francisco Convention Center",
    price: { min: 299, max: 599 },
    capacity: 500,
    registered: 347,
    category: "Technology",
    featured: true,
    registrationDeadline: "2024-03-01",
    status: "open"
  },
  {
    id: "2", 
    title: "Marketing Masterclass Workshop",
    description: "Intensive 2-day workshop covering digital marketing strategies, brand building, and customer acquisition.",
    date: "2024-02-20",
    endDate: "2024-02-21",
    location: "Downtown Business Center",
    price: { min: 199, max: 299 },
    capacity: 100,
    registered: 92,
    category: "Marketing",
    featured: false,
    registrationDeadline: "2024-02-15",
    status: "closing-soon"
  },
  {
    id: "3",
    title: "Healthcare Innovation Summit",
    description: "Explore the future of healthcare with leading practitioners, researchers, and technology innovators.",
    date: "2024-04-10",
    endDate: "2024-04-12",
    location: "Medical Center Convention Hall",
    price: { min: 399, max: 799 },
    capacity: 300,
    registered: 156,
    category: "Healthcare",
    featured: true,  
    registrationDeadline: "2024-04-01",
    status: "open"
  }
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [events] = useState<Event[]>(mockEvents);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalEvents: events.length,
    featuredEvents: events.filter(e => e.featured).length,
    closingSoon: events.filter(e => e.status === 'closing-soon').length,
    totalRegistrations: events.reduce((sum, e) => sum + e.registered, 0)
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 mb-8 text-primary-foreground">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">
              Discover Amazing Events
            </h1>
            <p className="text-lg opacity-90 mb-6 max-w-2xl">
              Connect with like-minded professionals, expand your knowledge, and create memorable experiences.
              Browse our curated selection of conferences, workshops, and networking events.
            </p>
            <div className="flex gap-4">
              <Button size="lg" variant="secondary" className="bg-white/20 hover:bg-white/30 border-white/30">
                <Calendar className="w-5 h-5 mr-2" />
                Browse All Events
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View My Registrations
              </Button>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">Available to register</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <TrendingUp className="h-4 w-4 text-event-featured" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-event-featured">{stats.featuredEvents}</div>
              <p className="text-xs text-muted-foreground">Premium events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closing Soon</CardTitle>
              <Filter className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.closingSoon}</div>
              <p className="text-xs text-muted-foreground">Limited time left</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.totalRegistrations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all events</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search events by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="default">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="default">
              Category
            </Button>
            <Button variant="outline" size="default">
              Date Range
            </Button>
          </div>
        </div>

        {/* Featured Events Section */}
        {events.some(e => e.featured) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Featured Events</h2>
            <EventGrid events={events.filter(e => e.featured)} />
          </div>
        )}

        {/* All Events Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {searchTerm ? 'Search Results' : 'All Events'}
            </h2>
            <span className="text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </span>
          </div>
          <EventGrid events={filteredEvents} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;