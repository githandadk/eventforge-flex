import { useEffect, useMemo, useState } from "react";
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
    start_date: z.date({ required_error: "Start date is required" }),
    end_date: z.date({ required_error: "End d
