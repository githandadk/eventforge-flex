import { useState } from "react";
import Layout from "@/components/ui/layout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/hooks/useEvents";
import {
  Calendar,
  DollarSign,
  Plus,
  Users,
  FileText,
  MapPin,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const { data: events, isLoading } = useEvents();
  const navigate = useNavigate();

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  const dashboardCards = [
    {
      title: "Event Details",
      description: "Manage core event information",
      icon: <FileText className="h-5 w-5" />,
      action: () => (selectedEventId ? navigate(`/admin/events/${selectedEventId}`) : null),
      disabled: !selectedEventId,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      title: "Event Fees",
      description: "Configure pricing, registration fees, and discounts",
      icon: <DollarSign className="h-5 w-5" />,
      action: () => (selectedEventId ? navigate(`/admin/fees?event=${selectedEventId}`) : null),
      disabled: !selectedEventId,
      color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    },
    {
      title: "Registrations",
      description: "View and manage event registrations",
      icon: <Users className="h-5 w-5" />,
      action: () => (selectedEventId ? navigate(`/admin/registrations/${selectedEventId}`) : null),
      disabled: !selectedEventId,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    },
  ];

  return (
    <AdminGuard>
      <Layout>
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Manage events, registrations, and system settings
                </p>
              </div>
              <Button onClick={() => navigate("/admin/events/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Event
              </Button>
            </div>

            {/* Event Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Event to Manage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an event to manage" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading events...</SelectItem>
                      ) : events && events.length > 0 ? (
                        events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{event.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {new Date(event.start_date).getFullYear()}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-events" disabled>No events found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {selectedEvent && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedEvent.location || "No location set"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(selectedEvent.start_date).toLocaleDateString()} - {new Date(selectedEvent.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Management Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.map((card, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  onClick={card.disabled ? undefined : card.action}
                >
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                      {card.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                    {card.disabled && (
                      <Badge variant="secondary" className="mt-2">
                        Select event first
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold">{events?.length || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                      <p className="text-2xl font-bold">
                        {events?.filter(e => new Date(e.end_date) >= new Date()).length || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                      <p className="text-2xl font-bold">
                        {events?.filter(e => new Date(e.start_date) > new Date()).length || 0}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </AdminGuard>
  );
}