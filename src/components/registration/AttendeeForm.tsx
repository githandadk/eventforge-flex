import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";

interface Department {
  code: string;
  name: string;
}

interface AttendeeFormData {
  full_name: string;
  email?: string;
  phone?: string;
  age_years?: number;
  department_code: string;
}

interface AttendeeFormProps {
  departments: Department[];
  maxAttendees: number;
  onComplete?: (attendees: AttendeeFormData[]) => void;
}

export const AttendeeForm = ({ departments, maxAttendees, onComplete }: AttendeeFormProps) => {
  const [attendees, setAttendees] = useState<AttendeeFormData[]>([
    {
      full_name: "",
      email: "",
      phone: "",
      age_years: undefined,
      department_code: "",
    }
  ]);

  const addAttendee = () => {
    if (attendees.length < maxAttendees) {
      setAttendees([...attendees, {
        full_name: "",
        email: "",
        phone: "",
        age_years: undefined,
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
    onComplete?.(attendees);
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
                <label className="text-sm font-medium">Age</label>
                <Input
                  type="number"
                  min={0}
                  value={attendee.age_years ?? ""}
                  onChange={(e) =>
                    updateAttendee(
                      index,
                      "age_years",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="Enter age (optional)"
                />
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