import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  CreditCard, 
  User, 
  MapPin, 
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const Registration = () => {
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    dietaryRestrictions: "",
    
    // Registration Options
    passType: "basic",
    accommodationDays: [] as string[],
    mealPackage: false,
    airportShuttle: false,
    childcare: false,
    parking: false,
    roomDeposit: false,
    
    // Seminar Selections
    selectedSeminars: [] as string[],
    
    // Emergency Contact
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: ""
  });

  // Mock event data - replace with actual data
  const event = {
    id: "1",
    title: "Annual Tech Conference 2024",
    date: "2024-03-15",
    endDate: "2024-03-17",
    location: "San Francisco Convention Center"
  };

  const registrationOptions = {
    passes: [
      { id: "basic", name: "Basic Pass", price: 299, description: "Access to all sessions" },
      { id: "premium", name: "Premium Pass", price: 449, description: "Basic + premium perks" },
      { id: "vip", name: "VIP Pass", price: 599, description: "Ultimate experience" }
    ],
    accommodation: [
      { id: "march14", name: "March 14 (Pre-conference)", price: 180 },
      { id: "march15", name: "March 15 (Day 1)", price: 180 },
      { id: "march16", name: "March 16 (Day 2)", price: 180 },
      { id: "march17", name: "March 17 (Day 3)", price: 180 }
    ],
    seminars: [
      { id: "ai-ml", name: "AI & Machine Learning Track", price: 75, capacity: 50, registered: 32 },
      { id: "cloud", name: "Cloud Architecture Bootcamp", price: 85, capacity: 40, registered: 38 },
      { id: "security", name: "Cybersecurity Workshop", price: 95, capacity: 30, registered: 15 },
      { id: "leadership", name: "Tech Leadership Panel", price: 65, capacity: 60, registered: 45 }
    ],
    additionalServices: [
      { id: "meals", name: "Full Meal Package", price: 120, description: "All meals during conference" },
      { id: "shuttle", name: "Airport Shuttle", price: 45, description: "Round-trip transportation" },
      { id: "childcare", name: "Childcare Service", price: 200, description: "Professional childcare" },
      { id: "parking", name: "Parking Pass", price: 75, description: "Reserved parking" },
      { id: "deposit", name: "Room Key Deposit", price: 50, description: "Refundable room access deposit" }
    ]
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Pass price
    const selectedPass = registrationOptions.passes.find(p => p.id === formData.passType);
    if (selectedPass) total += selectedPass.price;
    
    // Accommodation
    total += formData.accommodationDays.length * 180;
    
    // Seminars
    formData.selectedSeminars.forEach(seminarId => {
      const seminar = registrationOptions.seminars.find(s => s.id === seminarId);
      if (seminar) total += seminar.price;
    });
    
    // Additional services
    if (formData.mealPackage) total += 120;
    if (formData.airportShuttle) total += 45;
    if (formData.childcare) total += 200;
    if (formData.parking) total += 75;
    if (formData.roomDeposit) total += 50;
    
    return total;
  };

  const handleAccommodationChange = (dayId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      accommodationDays: checked 
        ? [...prev.accommodationDays, dayId]
        : prev.accommodationDays.filter(id => id !== dayId)
    }));
  };

  const handleSeminarChange = (seminarId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedSeminars: checked
        ? [...prev.selectedSeminars, seminarId]
        : prev.selectedSeminars.filter(id => id !== seminarId)
    }));
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Registration Options", icon: Calendar },
    { number: 3, title: "Payment", icon: CreditCard }
  ];

  const progress = (currentStep / steps.length) * 100;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to={`/events/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event Details
            </Link>
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Event Registration</h1>
            <p className="text-muted-foreground">{event.title}</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(event.date).toLocaleDateString()} - {new Date(event.endDate!).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step.number 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground text-muted-foreground'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input 
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input 
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input 
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company/Organization</Label>
                      <Input 
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions or Special Needs</Label>
                    <Textarea 
                      id="dietary"
                      value={formData.dietaryRestrictions}
                      onChange={(e) => setFormData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                      placeholder="Please describe any dietary restrictions, accessibility needs, or other special requirements..."
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Emergency Contact</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="emergencyName">Name</Label>
                        <Input 
                          id="emergencyName"
                          value={formData.emergencyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyPhone">Phone</Label>
                        <Input 
                          id="emergencyPhone"
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyRelation">Relationship</Label>
                        <Input 
                          id="emergencyRelation"
                          value={formData.emergencyRelation}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                          placeholder="e.g., Spouse, Parent"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Pass Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conference Pass</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={formData.passType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, passType: value }))}
                    >
                      {registrationOptions.passes.map((pass) => (
                        <div key={pass.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <RadioGroupItem value={pass.id} id={pass.id} />
                          <div className="flex-1">
                            <Label htmlFor={pass.id} className="font-medium cursor-pointer">
                              {pass.name} - ${pass.price}
                            </Label>
                            <p className="text-sm text-muted-foreground">{pass.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Accommodation */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hotel Accommodation</CardTitle>
                    <p className="text-sm text-muted-foreground">Select the nights you need accommodation</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {registrationOptions.accommodation.map((night) => (
                      <div key={night.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            id={night.id}
                            checked={formData.accommodationDays.includes(night.id)}
                            onCheckedChange={(checked) => handleAccommodationChange(night.id, checked as boolean)}
                          />
                          <Label htmlFor={night.id} className="cursor-pointer">
                            {night.name}
                          </Label>
                        </div>
                        <span className="font-medium">${night.price}/night</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Seminars */}
                <Card>
                  <CardHeader>
                    <CardTitle>Specialized Seminars & Workshops</CardTitle>
                    <p className="text-sm text-muted-foreground">Select additional sessions (limited capacity)</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {registrationOptions.seminars.map((seminar) => {
                      const spotsLeft = seminar.capacity - seminar.registered;
                      const isLowCapacity = spotsLeft <= 5;
                      
                      return (
                        <div key={seminar.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox 
                              id={seminar.id}
                              checked={formData.selectedSeminars.includes(seminar.id)}
                              onCheckedChange={(checked) => handleSeminarChange(seminar.id, checked as boolean)}
                              disabled={spotsLeft === 0}
                            />
                            <div className="flex-1">
                              <Label htmlFor={seminar.id} className="cursor-pointer font-medium">
                                {seminar.name}
                              </Label>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {seminar.registered}/{seminar.capacity} registered
                                </span>
                                {isLowCapacity && spotsLeft > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {spotsLeft} left
                                  </Badge>
                                )}
                                {spotsLeft === 0 && (
                                  <Badge variant="secondary" className="text-xs">Full</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="font-medium">${seminar.price}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Additional Services */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {registrationOptions.additionalServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox 
                            id={service.id}
                            checked={formData[service.id === 'meals' ? 'mealPackage' : 
                                            service.id === 'shuttle' ? 'airportShuttle' :
                                            service.id === 'childcare' ? 'childcare' :
                                            service.id === 'parking' ? 'parking' :
                                            'roomDeposit'] as boolean}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              [service.id === 'meals' ? 'mealPackage' : 
                               service.id === 'shuttle' ? 'airportShuttle' :
                               service.id === 'childcare' ? 'childcare' :
                               service.id === 'parking' ? 'parking' :
                               'roomDeposit']: checked 
                            }))}
                          />
                          <div>
                            <Label htmlFor={service.id} className="cursor-pointer font-medium">
                              {service.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          </div>
                        </div>
                        <span className="font-medium">${service.price}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    This is a placeholder - integrate with your Stripe implementation
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Stripe Payment Integration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your existing Stripe code will handle the payment processing here.
                    </p>
                    <Button className="bg-gradient-primary hover:opacity-90">
                      Process Payment (${calculateTotal()})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <Button 
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                disabled={currentStep === 3}
                className="bg-gradient-primary hover:opacity-90"
              >
                {currentStep === 3 ? 'Complete Registration' : 'Next Step'}
              </Button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Registration Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {/* Pass */}
                  <div className="flex justify-between">
                    <span>
                      {registrationOptions.passes.find(p => p.id === formData.passType)?.name}
                    </span>
                    <span>${registrationOptions.passes.find(p => p.id === formData.passType)?.price}</span>
                  </div>

                  {/* Accommodation */}
                  {formData.accommodationDays.length > 0 && (
                    <div className="flex justify-between">
                      <span>Accommodation ({formData.accommodationDays.length} nights)</span>
                      <span>${formData.accommodationDays.length * 180}</span>
                    </div>
                  )}

                  {/* Seminars */}
                  {formData.selectedSeminars.map(seminarId => {
                    const seminar = registrationOptions.seminars.find(s => s.id === seminarId);
                    return seminar ? (
                      <div key={seminarId} className="flex justify-between">
                        <span className="text-xs">{seminar.name}</span>
                        <span>${seminar.price}</span>
                      </div>
                    ) : null;
                  })}

                  {/* Additional Services */}
                  {formData.mealPackage && (
                    <div className="flex justify-between">
                      <span>Meal Package</span>
                      <span>$120</span>
                    </div>
                  )}
                  {formData.airportShuttle && (
                    <div className="flex justify-between">
                      <span>Airport Shuttle</span>
                      <span>$45</span>
                    </div>
                  )}
                  {formData.childcare && (
                    <div className="flex justify-between">
                      <span>Childcare Service</span>
                      <span>$200</span>
                    </div>
                  )}
                  {formData.parking && (
                    <div className="flex justify-between">
                      <span>Parking Pass</span>
                      <span>$75</span>
                    </div>
                  )}
                  {formData.roomDeposit && (
                    <div className="flex justify-between">
                      <span>Room Key Deposit</span>
                      <span>$50</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  * Room key deposit is refundable upon key return
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Registration;