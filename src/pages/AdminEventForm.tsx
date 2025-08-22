import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/ui/layout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEvent } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.date(),
  end_date: z.date(),
  reg_open: z.date().optional(),
  reg_close: z.date().optional(),
  timezone: z.string().default("America/New_York"),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = id !== "new";
  
  const { data: event, isLoading } = useEvent(id || "");
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      timezone: "America/New_York",
    },
  });

  useEffect(() => {
    if (event && isEditing) {
      form.reset({
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        reg_open: event.reg_open ? new Date(event.reg_open) : undefined,
        reg_close: event.reg_close ? new Date(event.reg_close) : undefined,
        timezone: event.timezone,
      });
    }
  }, [event, isEditing, form]);

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData = {
        name: data.name,
        description: data.description || null,
        location: data.location || null,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date.toISOString().split('T')[0],
        reg_open: data.reg_open?.toISOString() || null,
        reg_close: data.reg_close?.toISOString() || null,
        timezone: data.timezone,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", id);
        
        if (error) throw error;
        toast({ title: "Event updated successfully!" });
      } else {
        const { error } = await supabase
          .from("events")
          .insert(eventData);
        
        if (error) throw error;
        toast({ title: "Event created successfully!" });
      }
      
      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading && isEditing) {
    return (
      <AdminGuard>
        <Layout>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg">Loading event...</p>
            </div>
          </div>
        </Layout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Layout>
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditing ? "Edit Event" : "Create New Event"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isEditing ? "Update event details and settings" : "Set up a new event"}
                </p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Event Name *</Label>
                    <Input 
                      id="name"
                      {...form.register("name")}
                      placeholder="Enter event name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      {...form.register("description")}
                      placeholder="Enter event description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location"
                      {...form.register("location")}
                      placeholder="Enter event location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input 
                      id="timezone"
                      {...form.register("timezone")}
                      placeholder="America/New_York"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Event Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Dates</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch("start_date") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("start_date") ? (
                            format(form.watch("start_date"), "PPP")
                          ) : (
                            <span>Pick start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("start_date")}
                          onSelect={(date) => date && form.setValue("start_date", date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch("end_date") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("end_date") ? (
                            format(form.watch("end_date"), "PPP")
                          ) : (
                            <span>Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("end_date")}
                          onSelect={(date) => date && form.setValue("end_date", date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Registration Period</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Registration Opens</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch("reg_open") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("reg_open") ? (
                            format(form.watch("reg_open"), "PPP")
                          ) : (
                            <span>Pick registration open date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("reg_open")}
                          onSelect={(date) => form.setValue("reg_open", date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Registration Closes</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch("reg_close") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("reg_close") ? (
                            format(form.watch("reg_close"), "PPP")
                          ) : (
                            <span>Pick registration close date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.watch("reg_close")}
                          onSelect={(date) => form.setValue("reg_close", date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  {isEditing ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </AdminGuard>
  );
}