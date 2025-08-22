import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/ui/layout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useEvent } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Save, ArrowLeft } from "lucide-react";
import { format, isAfter, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * SCHEMA
 * - Assume start_date & end_date are DATE columns in Postgres
 * - Assume reg_open & reg_close are TIMESTAMPTZ (optional)
 */
const eventFormSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    description: z.string().optional(),
    location: z.string().optional(),
    slug: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    start_date: z.date({ required_error: "Start date is required" }),
    end_date: z.date({ required_error: "End date is required" }),
    reg_open: z.date().optional(),
    reg_close: z.date().optional(),
    lodging_option: z.boolean(),
    meal_option: z.boolean(),
    shuttle_option: z.boolean(),
  })
  .refine((data) => isAfter(data.end_date, data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  });

type EventFormData = z.infer<typeof eventFormSchema>;

export default function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;
  
  const { data: event, isLoading } = useEvent(id || "");
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      lodging_option: false,
      meal_option: false,
      shuttle_option: false,
    },
  });

  useEffect(() => {
    if (event && isEditing) {
      reset({
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        slug: event.slug || "",
        timezone: event.timezone || "",
        currency: event.currency || "",
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        reg_open: event.reg_open ? new Date(event.reg_open) : undefined,
        reg_close: event.reg_close ? new Date(event.reg_close) : undefined,
        lodging_option: event.lodging_option ?? false,
        meal_option: event.meal_option ?? false,
        shuttle_option: event.shuttle_option ?? false,
      });
    }
  }, [event, isEditing, reset]);

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData = {
        name: data.name,
        description: data.description,
        location: data.location,
        slug:
          data.slug ||
          data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        timezone: data.timezone,
        currency: data.currency,
        lodging_option: data.lodging_option,
        meal_option: data.meal_option,
        shuttle_option: data.shuttle_option,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        reg_open: data.reg_open ? data.reg_open.toISOString() : null,
        reg_close: data.reg_close ? data.reg_close.toISOString() : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", id);
        
        if (error) throw error;
        toast({ title: "Event updated successfully" });
      } else {
        const { error } = await supabase
          .from("events")
          .insert(eventData);
        
        if (error) throw error;
        toast({ title: "Event created successfully" });
      }
      
      navigate("/admin");
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error saving event",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <Layout>
          <div className="container max-w-4xl mx-auto p-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        </Layout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Layout>
        <div className="container max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Edit Event" : "Create New Event"}
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter event name"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      {...register("slug")}
                      placeholder="event-slug"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="Enter event location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      {...register("timezone")}
                      placeholder="e.g. America/New_York"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    {...register("currency")}
                    placeholder="e.g. USD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Enter event description"
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Controller
                      name="start_date"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.start_date && (
                      <p className="text-sm text-destructive">{errors.start_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Controller
                      name="end_date"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.end_date && (
                      <p className="text-sm text-destructive">{errors.end_date.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Registration Opens</Label>
                    <Controller
                      name="reg_open"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Registration Closes</Label>
                    <Controller
                      name="reg_close"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Controller
                    name="lodging_option"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="lodging_option"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="lodging_option">Lodging Option</Label>
                      </div>
                    )}
                  />
                  <Controller
                    name="meal_option"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="meal_option"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="meal_option">Meal Option</Label>
                      </div>
                    )}
                  />
                  <Controller
                    name="shuttle_option"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="shuttle_option"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="shuttle_option">Shuttle Option</Label>
                      </div>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AdminGuard>
  );
}
