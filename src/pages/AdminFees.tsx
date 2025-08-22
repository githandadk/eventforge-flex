import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/ui/layout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEvents } from "@/hooks/useEvents";
import { useEventFees, useUpdateEventFee, useCreateEventFee, useDeleteEventFee } from "@/hooks/useEventFees";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Settings, Users, Car, Home, Key, Utensils, Edit, Save, X, Plus, Trash2, Loader2 } from "lucide-react";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "lodging":
      return <Home className="h-4 w-4" />;
    case "meal":
      return <Utensils className="h-4 w-4" />;
    case "registration":
      return <Users className="h-4 w-4" />;
    case "shuttle":
      return <Car className="h-4 w-4" />;
    case "surcharge":
      return <Settings className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "lodging":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "meal":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "registration":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "shuttle":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "surcharge":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function AdminFees() {
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get("event") || "";
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFee, setNewFee] = useState({
    category: "",
    code: "",
    label: "",
    unit: "",
    amount: 0
  });
  const { toast } = useToast();
  
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();
  const { data: fees, isLoading: feesLoading, error: feesError, refetch: refetchFees } = useEventFees(selectedEventId);
  const updateFeeMutation = useUpdateEventFee();
  const createFeeMutation = useCreateEventFee();
  const deleteFeeMutation = useDeleteEventFee();

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  // Group fees by category for better display
  const groupedFees = fees?.reduce((acc, fee) => {
    if (!acc[fee.category]) {
      acc[fee.category] = [];
    }
    acc[fee.category].push(fee);
    return acc;
  }, {} as Record<string, typeof fees>) || {};

  const handleEditFee = (feeId: string, currentAmount: number) => {
    setEditingFee(feeId);
    setEditedAmount(currentAmount.toString());
  };

  const handleSaveFee = async (feeId: string) => {
    try {
      await updateFeeMutation.mutateAsync({
        id: feeId,
        amount: parseFloat(editedAmount)
      });
      toast({
        title: "Success",
        description: "Fee updated successfully",
      });
      setEditingFee(null);
      setEditedAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fee",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingFee(null);
    setEditedAmount("");
  };

  const handleAddFee = async () => {
    if (!selectedEventId || !newFee.category || !newFee.code || !newFee.label || !newFee.unit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createFeeMutation.mutateAsync({
        event_id: selectedEventId,
        ...newFee
      });
      toast({
        title: "Success",
        description: "Fee added successfully",
      });
      setShowAddDialog(false);
      setNewFee({
        category: "",
        code: "",
        label: "",
        unit: "",
        amount: 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add fee",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      await deleteFeeMutation.mutateAsync(feeId);
      toast({
        title: "Success",
        description: "Fee deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee",
        variant: "destructive",
      });
    }
  };

  // Show errors if they exist
  if (eventsError) {
    return (
      <Layout>
        <div className="min-h-screen bg-background p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Error loading events: {eventsError.message || "Unknown error"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <AdminGuard>
      <Layout>
        <div className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Event Fees Management</h1>
                <p className="text-muted-foreground mt-2">
                  View and manage all pricing for events
                </p>
              </div>
              {selectedEventId && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Fee</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newFee.category} onValueChange={(value) => setNewFee({...newFee, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="registration">Registration</SelectItem>
                            <SelectItem value="lodging">Lodging</SelectItem>
                            <SelectItem value="meal">Meal</SelectItem>
                            <SelectItem value="shuttle">Shuttle</SelectItem>
                            <SelectItem value="surcharge">Surcharge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                          id="code"
                          value={newFee.code}
                          onChange={(e) => setNewFee({...newFee, code: e.target.value.toUpperCase()})}
                          placeholder="e.g., AC, BREAKFAST, BASE_FEE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                          id="label"
                          value={newFee.label}
                          onChange={(e) => setNewFee({...newFee, label: e.target.value})}
                          placeholder="e.g., AC Room, Breakfast, Base Registration Fee"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          value={newFee.unit}
                          onChange={(e) => setNewFee({...newFee, unit: e.target.value})}
                          placeholder="e.g., person, night, trip, key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newFee.amount}
                          onChange={(e) => setNewFee({...newFee, amount: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddFee} disabled={createFeeMutation.isPending}>
                          {createFeeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Add Fee
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Select Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an event to view fees" />
                </SelectTrigger>
                <SelectContent>
                  {eventsLoading ? (
                    <SelectItem value="loading" disabled>Loading events...</SelectItem>
                  ) : events && events.length > 0 ? (
                    events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-events" disabled>No events found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEventId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Event Fees: {selectedEvent?.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  All pricing information for this event
                </p>
              </CardHeader>
              <CardContent>
                {feesLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : fees && fees.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedFees).map(([category, categoryFees]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <h3 className="text-lg font-semibold capitalize">
                            {category.replace('_', ' ')}
                          </h3>
                          <Badge className={getCategoryColor(category)}>
                            {categoryFees.length} item{categoryFees.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryFees.map((fee) => (
                            <TableRow key={fee.id}>
                              <TableCell>
                                <code className="rounded bg-muted px-2 py-1 text-sm">
                                  {fee.code}
                                </code>
                              </TableCell>
                              <TableCell>{fee.label}</TableCell>
                              <TableCell>
                                <Badge variant="outline">per {fee.unit}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {editingFee === fee.id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-lg">$</span>
                                    <Input
                                      type="number"
                                      value={editedAmount}
                                      onChange={(e) => setEditedAmount(e.target.value)}
                                      className="w-24 text-right"
                                      step="0.01"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-mono text-lg">
                                    ${fee.amount.toFixed(2)}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {editingFee === fee.id ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveFee(fee.id)}
                                      disabled={updateFeeMutation.isPending}
                                      className="gap-1"
                                    >
                                      {updateFeeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      className="gap-1"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditFee(fee.id, fee.amount)}
                                      className="gap-1"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteFee(fee.id)}
                                      disabled={deleteFeeMutation.isPending}
                                      className="gap-1 text-red-600 hover:text-red-700"
                                    >
                                      {deleteFeeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No fees configured</h3>
                    <p className="text-muted-foreground">
                      This event doesn't have any fees configured yet. Click "Add Fee" to create new fees.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </Layout>
    </AdminGuard>
  );
}
