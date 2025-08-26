import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Clock, MapPin, Calendar } from "lucide-react";
import { ProfileForm } from "@/components/registration/ProfileForm";
import { RoomBookingForm } from "@/components/registration/RoomBookingForm";
import { AttendeeForm } from "@/components/registration/AttendeeForm";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEvent } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";

type RegistrationStep = "profile" | "room" | "attendees" | "review" | "complete";

interface RoomBookingData {
  checkin_date: Date;
  checkout_date: Date;
  lodging_option_id: string;
  totalCost: number;
  numberOfNights: number;
}

interface AttendeeData {
  full_name: string;
  email?: string;
  phone?: string;
  birthdate?: Date;
  department_code: string;
  age_years?: number;
}

export default function EventRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: event, isLoading: eventLoading } = useEvent(id!);
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<RegistrationStep>("profile");
  const [roomBookingData, setRoomBookingData] = useState<RoomBookingData | null>(null);
  const [attendeesData, setAttendeesData] = useState<AttendeeData[]>([]);
  const [saving, setSaving] = useState(false);
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Move to room booking if profile is complete
  useEffect(() => {
    if (currentStep === "profile" && profile?.full_name && profile?.emergency_contact_name) {
      setCurrentStep("room");
    }
  }, [profile, currentStep]);

  if (authLoading || profileLoading || eventLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => navigate("/")}>Go Back Home</Button>
        </div>
      </Layout>
    );
  }

  const steps = [
    { key: "profile", label: "Profile", completed: currentStep !== "profile" },
    { key: "room", label: "Room Booking", completed: false },
    { key: "attendees", label: "Attendees", completed: false },
    { key: "review", label: "Review", completed: false },
  ];

  const handleProfileComplete = () => {
    setCurrentStep("room");
  };

  const handleRoomBookingComplete = (data: RoomBookingData) => {
    setRoomBookingData(data);
    setCurrentStep("attendees");
  };

  const handleAttendeesComplete = (attendees: AttendeeData[]) => {
    setAttendeesData(attendees);
    setCurrentStep("review");
  };

  const completeRegistration = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Please sign in", description: "You need to be logged in to complete registration." });
      navigate("/login");
      return;
    }
    if (!event || !roomBookingData || attendeesData.length === 0) {
      toast({ variant: "destructive", title: "Missing information", description: "Please complete room booking and add at least one attendee." });
      return;
    }
    setSaving(true);
    try {
      // 1) Create registration (owner is the current user per RLS)
      const { data: registration, error: regError } = await supabase
        .from("registrations")
        .insert({
          event_id: event.id,
          created_by: user.id,
        })
        .select()
        .single();
      if (regError) throw regError;

      // 2) Create room booking block (1 row per booking)
      const { data: roomBooking, error: rbError } = await supabase
        .from("room_bookings")
        .insert({
          registration_id: registration.id,
          event_id: event.id,
          lodging_option_id: roomBookingData.lodging_option_id,
          checkin_date: new Date(roomBookingData.checkin_date).toISOString().split("T")[0],
          checkout_date: new Date(roomBookingData.checkout_date).toISOString().split("T")[0],
        })
        .select()
        .single();
      if (rbError) throw rbError;

      // 3) Insert attendees under this registration and event, and return their ids
      const attendeeRows = attendeesData.map((a) => ({
        registration_id: registration.id,
        event_id: event.id,
        full_name: a.full_name,
        email: a.email || null,
        phone: a.phone || null,
        department_code: a.department_code,
        birthdate: a.birthdate ? new Date(a.birthdate).toISOString().split("T")[0] : null,
        age_years: typeof a.age_years === "number" ? a.age_years : null,
        qr_code_uid: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      }));

      const { data: insertedAttendees, error: attError } = await supabase
        .from("attendees")
        .insert(attendeeRows)
        .select();
      if (attError) throw attError;

      // 4) Attach attendees as guests to this room booking
      const guestRows = (insertedAttendees || []).map((a) => ({
        room_booking_id: roomBooking.id,
        attendee_id: a.id,
      }));

      if (guestRows.length > 0) {
        const { error: guestsError } = await supabase
          .from("room_booking_guests")
          .insert(guestRows);
        if (guestsError) throw guestsError;
      }

      // 5) Create registration_items for related charges linked to booking (lodging)
      const LodgingDescription = `Lodging booking (${roomBookingData.numberOfNights} night${roomBookingData.numberOfNights !== 1 ? "s" : ""})`;
      const { error: itemsError } = await supabase
        .from("registration_items")
        .insert({
          registration_id: registration.id,
          kind: "room_night",
          ref_table: "room_bookings",
          ref_id: roomBooking.id,
          description: LodgingDescription,
          unit_price: roomBookingData.totalCost,
          qty: 1,
        });
      if (itemsError) throw itemsError;

      toast({
        title: "Registration complete",
        description: "Your room booking, guests, and charges were saved.",
      });
      setCurrentStep("complete");
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: err?.message ?? "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "profile":
        return (
          <ProfileForm
            profile={profile}
            onComplete={handleProfileComplete}
          />
        );

      case "room":
        return (
          <RoomBookingForm
            lodgingOptions={event.lodging_options || []}
            eventStartDate={event.start_date}
            eventEndDate={event.end_date}
            onComplete={handleRoomBookingComplete}
          />
        );

      case "attendees":
        if (!roomBookingData) return null;
        const selectedLodging = event.lodging_options?.find(
          opt => opt.id === roomBookingData.lodging_option_id
        );
        
        return (
          <AttendeeForm
            departments={departments || []}
            maxAttendees={selectedLodging?.capacity_per_room || 4}
            onComplete={handleAttendeesComplete}
          />
        );

      case "review":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Registration Summary</h3>
                <p className="text-muted-foreground">Please review your registration details below.</p>
              </div>

              {roomBookingData && (
                <div className="space-y-2">
                  <h4 className="font-medium">Room Booking</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{roomBookingData.numberOfNights} nights - ${roomBookingData.totalCost}</p>
                    <p>{attendeesData.length} attendee{attendeesData.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={completeRegistration} disabled={saving}>
                {saving ? "Saving..." : "Complete Registration"}
              </Button>
            </CardContent>
          </Card>
        );

      case "complete":
        return (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Registration Complete!</h3>
              <p className="text-muted-foreground mb-6">
                Your registration has been submitted successfully.
              </p>
              <Button onClick={() => navigate("/")}>
                Return to Events
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Details
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Register for {event.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed || step.key === currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground text-muted-foreground"
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step.key === currentStep ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-20 h-px mx-4 ${
                  step.completed ? "bg-primary" : "bg-muted-foreground"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        {renderCurrentStep()}
      </div>
    </Layout>
  );
}