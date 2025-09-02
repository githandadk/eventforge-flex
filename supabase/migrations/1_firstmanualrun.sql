-- 1. Safety: add columns if missing
alter table public.registrations
  add column if not exists amount_total numeric(12,2) default 0 not null,
  add column if not exists status text default 'draft' not null check (status in ('draft','pending','paid','canceled'));

alter table public.attendees
  add column if not exists ticket_status text default 'hold' not null check (ticket_status in ('hold','active','canceled')),
  add column if not exists qr_code_uid uuid not null default gen_random_uuid();

create unique index if not exists attendees_qr_code_uid_key on public.attendees(qr_code_uid);

-- 2. View for a compact summary
create or replace view public.v_registration_summary as
select
  r.id as registration_id,
  r.event_id,
  r.created_by,
  r.status,
  r.amount_total,
  coalesce(sum(ri.amount),0)::numeric(12,2) as line_total,
  jsonb_agg(jsonb_build_object(
    'id', ri.id,
    'kind', ri.kind,
    'description', ri.description,
    'qty', ri.qty,
    'unit_price', ri.unit_price,
    'amount', ri.amount
  ) order by ri.created_at) filter (where ri.id is not null) as items
from public.registrations r
left join public.registration_items ri on ri.registration_id = r.id
group by r.id;

-- 3. Transactional RPC
create or replace function public.complete_registration(
  p_user_id uuid,
  p_event_id uuid,
  p_profile jsonb,
  p_room jsonb,            -- {checkin, checkout, lodging_option_id, num_keys}
  p_attendees jsonb,       -- [{first_name,last_name,email,phone,department}]
  p_meals jsonb,           -- OPTIONAL: [{attendee_index, meal_session_id}]
  p_shuttles jsonb         -- OPTIONAL: [{direction, time, fee, notes}]
) returns table (registration_id uuid, amount_total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg_id uuid;
  v_room_booking_id uuid;
  v_capacity int;
  v_max int;
  v_keys int;
  v_i int;
  v_att jsonb;
  v_att_id uuid;
  v_item_amount numeric(12,2);
begin
  -- 1) Profile upsert (by user_id)
  insert into public.profiles (user_id, first_name, last_name, phone, organization)
  values (
    p_user_id,
    coalesce(p_profile->>'first_name',''),
    coalesce(p_profile->>'last_name',''),
    p_profile->>'phone',
    p_profile->>'organization'
  )
  on conflict (user_id) do update set
    first_name = excluded.first_name,
    last_name  = excluded.last_name,
    phone      = excluded.phone,
    organization = excluded.organization;

  -- 2) Registration
  insert into public.registrations (event_id, created_by, status)
  values (p_event_id, p_user_id, 'pending')
  returning id into v_reg_id;

  -- 3) Room booking
  v_keys := coalesce((p_room->>'num_keys')::int, 1);
  select capacity_per_room into v_capacity
  from public.lodging_options
  where id = (p_room->>'lodging_option_id')::uuid;

  if v_capacity is null then
    raise exception 'Invalid lodging_option_id';
  end if;
  v_max := v_capacity * greatest(v_keys,1);

  insert into public.room_bookings (
    registration_id, lodging_option_id, checkin_date, checkout_date, num_keys
  ) values (
    v_reg_id,
    (p_room->>'lodging_option_id')::uuid,
    (p_room->>'checkin')::date,
    (p_room->>'checkout')::date,
    v_keys
  ) returning id into v_room_booking_id;

  -- 3a) Add key deposit (optional: if your option has a deposit/ key fee)
  if coalesce((p_room->>'key_deposit_per_key')::numeric, 0) > 0 then
    insert into public.registration_items (registration_id, kind, description, qty, unit_price, amount)
    values (
      v_reg_id, 'key_deposit', 'Key deposit', v_keys,
      (p_room->>'key_deposit_per_key')::numeric,
      v_keys * (p_room->>'key_deposit_per_key')::numeric
    );
  end if;

  -- 4) Attendees
  if jsonb_typeof(p_attendees) = 'array' then
    if jsonb_array_length(p_attendees) > v_max then
      raise exception 'Attendee count exceeds room capacity (%).', v_max;
    end if;

    for v_i in 0 .. jsonb_array_length(p_attendees)-1 loop
      v_att := p_attendees->v_i;

      insert into public.attendees (registration_id, first_name, last_name, email, phone, department, ticket_status)
      values (
        v_reg_id,
        v_att->>'first_name',
        v_att->>'last_name',
        v_att->>'email',
        v_att->>'phone',
        v_att->>'department',
        'hold'
      )
      returning id into v_att_id;

      -- link to room (room_booking_guests)
      insert into public.room_booking_guests (room_booking_id, attendee_id)
      values (v_room_booking_id, v_att_id);

      -- optional department surcharge as line item if present on attendee json
      if (v_att ? 'department_surcharge') then
        v_item_amount := coalesce((v_att->>'department_surcharge')::numeric,0);
        if v_item_amount > 0 then
          insert into public.registration_items (registration_id, kind, description, qty, unit_price, amount)
          values (
            v_reg_id, 'department_surcharge',
            concat('Dept surcharge for ', coalesce(v_att->>'first_name','Attendee')),
            1, v_item_amount, v_item_amount
          );
        end if;
      end if;
    end loop;
  end if;

  -- 5) Meals
  if p_meals is not null and jsonb_typeof(p_meals) = 'array' then
    for v_i in 0 .. jsonb_array_length(p_meals)-1 loop
      v_att := p_meals->v_i; -- reuse holder
      -- expect {attendee_index, meal_session_id, price}
      insert into public.attendee_meal_passes (attendee_id, meal_session_id)
      values (
        (select id from public.attendees where registration_id = v_reg_id
           order by created_at offset (v_att->>'attendee_index')::int limit 1),
        (v_att->>'meal_session_id')::uuid
      );

      if (v_att ? 'price') then
        v_item_amount := coalesce((v_att->>'price')::numeric, 0);
        if v_item_amount > 0 then
          insert into public.registration_items (registration_id, kind, description, qty, unit_price, amount)
          values (
            v_reg_id, 'meal', 'Meal session', 1, v_item_amount, v_item_amount
          );
        end if;
      end if;
    end loop;
  end if;

  -- 6) Shuttles
  if p_shuttles is not null and jsonb_typeof(p_shuttles) = 'array' then
    for v_i in 0 .. jsonb_array_length(p_shuttles)-1 loop
      v_att := p_shuttles->v_i; -- {direction, time, fee, notes}
      insert into public.shuttle_requests (registration_id, direction, pickup_time, notes)
      values (v_reg_id, v_att->>'direction', (v_att->>'time')::timestamptz, v_att->>'notes');

      if (v_att ? 'fee') then
        v_item_amount := coalesce((v_att->>'fee')::numeric, 0);
        if v_item_amount > 0 then
          insert into public.registration_items (registration_id, kind, description, qty, unit_price, amount)
          values (v_reg_id, 'shuttle', concat('Shuttle ', v_att->>'direction'), 1, v_item_amount, v_item_amount);
        end if;
      end if;
    end loop;
  end if;

  -- 7) Totals
  update public.registrations r
  set amount_total = coalesce((
      select sum(amount) from public.registration_items where registration_id = v_reg_id
  ),0)
  where r.id = v_reg_id;

  return query
    select v_reg_id, (select amount_total from public.registrations where id = v_reg_id);
end;
$$;

-- RLS example (adjust to your setup)
alter table public.registrations enable row level security;
create policy reg_sel on public.registrations for select
  using (auth.uid() = created_by or public.is_admin(auth.uid()));
create policy reg_ins on public.registrations for insert
  with check (auth.uid() = created_by or public.is_admin(auth.uid()));
create policy reg_upd on public.registrations for update
  using (auth.uid() = created_by or public.is_admin(auth.uid()))
  with check (auth.uid() = created_by or public.is_admin(auth.uid()));
