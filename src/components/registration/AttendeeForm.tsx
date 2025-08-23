import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Department {
  code: string;
  name: string;
}

const attendeeSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  birthdate: z.date().optional(),
  department_code: z.string({
    required_error: "Department is required",
  }),
});

type AttendeeFormData = z.infer<typeof attendeeSchema>;

interface AttendeeFormProps {
  departments: Department[];
  maxAttendees: number;
  onComplete?: (attendees: (AttendeeFormData & { age_years?: number })[]) => void;
}

export const AttendeeForm = ({ departments, maxAttendees, onComplete }: AttendeeFormProps) => {
  const [attendees, setAttendees] = useState<AttendeeFormData[]>([
    {
      full_name: "",
      email: "",
      phone: "",
      department_code: "",
    }
  ]);

  const form = useForm<AttendeeFormData>({
    resolver: zodResolver(attendeeSchema),
  });

  const addAttendee = () => {
    if (attendees.length < maxAttendees) {
      setAttendees([...attendees, {
        full_name: "",
        email: "",
        phone: "",
        department_code: "",
      }]);
    }
  };

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const updateAttendee = (index: number, field: keyof AttendeeFormData, value: any) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  const handleSubmit = () => {
    const processedAttendees = attendees.map(attendee => ({
      ...attendee,
      age_years: attendee.birthdate ? 
        new Date().getFullYear() - attendee.birthdate.getFullYear() : undefined
    }));
    
    onComplete?.(processedAttendees);
  };

  const isFormValid = attendees.every(attendee => 
    attendee.full_name.trim().length >= 2 && 
    attendee.department_code.trim().length > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Room Attendees ({attendees.length}/{maxAttendees})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {attendees.map((attendee, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Attendee #{index + 1}</h4>
              {attendees.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAttendee(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={attendee.full_name}
                  onChange={(e) => updateAttendee(index, "full_name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Department *</label>
                <Select
                  value={attendee.department_code}
                  onValueChange={(value) => updateAttendee(index, "department_code", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={attendee.email || ""}
                  onChange={(e) => updateAttendee(index, "email", e.target.value)}
                  placeholder="Enter email (optional)"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={attendee.phone || ""}
                  onChange={(e) => updateAttendee(index, "phone", e.target.value)}
                  placeholder="Enter phone (optional)"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Birth Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !attendee.birthdate && "text-muted-foreground"
                      )}
                    >
                      {attendee.birthdate ? (
                        format(attendee.birthdate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={attendee.birthdate}
                      onSelect={(date) => updateAttendee(index, "birthdate", date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ))}

        {attendees.length < maxAttendees && (
          <Button
            type="button"
            variant="outline"
            onClick={addAttendee}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Attendee ({attendees.length}/{maxAttendees})
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!isFormValid}
        >
          Continue to Meal Selection
        </Button>
      </CardContent>
    </Card>
  );
};