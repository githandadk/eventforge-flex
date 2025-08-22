import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Bed } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface LodgingOption {
  id: string;
  name: string;
  nightly_rate: number;
  capacity_per_room: number;
  ac: boolean;
  notes?: string;
}

const roomBookingSchema = z.object({
  checkin_date: z.date({
    required_error: "Check-in date is required",
  }),
  checkout_date: z.date({
    required_error: "Check-out date is required",
  }),
  lodging_option_id: z.string({
    required_error: "Please select a room type",
  }),
});

type RoomBookingFormData = z.infer<typeof roomBookingSchema>;

interface RoomBookingFormProps {
  lodgingOptions: LodgingOption[];
  eventStartDate: string;
  eventEndDate: string;
  onComplete?: (data: RoomBookingFormData & { totalCost: number; numberOfNights: number }) => void;
}

export const RoomBookingForm = ({ 
  lodgingOptions, 
  eventStartDate, 
  eventEndDate, 
  onComplete 
}: RoomBookingFormProps) => {
  const form = useForm<RoomBookingFormData>({
    resolver: zodResolver(roomBookingSchema),
  });

  const watchedValues = form.watch();
  const selectedOption = lodgingOptions.find(opt => opt.id === watchedValues.lodging_option_id);
  
  const numberOfNights = watchedValues.checkin_date && watchedValues.checkout_date 
    ? differenceInDays(watchedValues.checkout_date, watchedValues.checkin_date)
    : 0;
    
  const totalCost = selectedOption && numberOfNights > 0
    ? selectedOption.nightly_rate * numberOfNights
    : 0;

  const onSubmit = (data: RoomBookingFormData) => {
    onComplete?.({
      ...data,
      totalCost,
      numberOfNights,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bed className="w-5 h-5" />
          Room Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkin_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-in Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick check-in date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(eventStartDate) || date > new Date(eventEndDate)
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkout_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-out Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick check-out date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <= (watchedValues.checkin_date || new Date(eventStartDate)) || 
                            date > new Date(eventEndDate)
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lodging_option_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {lodgingOptions.map((option) => (
                        <div key={option.id}>
                          <RadioGroupItem
                            value={option.id}
                            id={option.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={option.id}
                            className="flex flex-col items-start space-y-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold">{option.name}</span>
                              <span className="text-sm font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
                                ${option.nightly_rate}/night
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                Up to {option.capacity_per_room} guests
                              </div>
                              <div className="flex items-center gap-1">
                                {option.ac ? "AC" : "No AC"}
                              </div>
                            </div>
                            {option.notes && (
                              <p className="text-sm text-muted-foreground">{option.notes}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {totalCost > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {numberOfNights} night{numberOfNights !== 1 ? 's' : ''} × ${selectedOption?.nightly_rate}
                  </span>
                  <span className="text-lg font-bold">${totalCost}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={totalCost === 0}>
              Continue to Attendee Selection
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};